import os
import secrets
from urllib.parse import urlencode
from contextlib import asynccontextmanager
import asyncpg
from pydantic import BaseModel
from cache import get_value

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from starlette.middleware.sessions import SessionMiddleware

load_dotenv()
CLIENT_ID = os.environ["DISCORD_CLIENT_ID"]
CLIENT_SECRET = os.environ["DISCORD_CLIENT_SECRET"]
BOT_TOKEN = os.environ["DISCORD_BOT_TOKEN"]
REDIRECT_URI = os.environ["REDIRECT_URI"]
FRONTEND_URL = os.environ["FRONTEND_URL"]
SECURE_COOKIES = os.environ.get("SECURE_COOKIES", "false").lower() == "true"
DATABASE_URL = os.environ["DATABASE_URL"]
API = "https://discord.com/api"

ADMINISTRATOR = 1 << 3
MANAGE_GUILD = 1 << 5
TEXT, VOICE, CATEGORY, ANNOUNCEMENT = 0, 2, 4, 5
MODULE_IDS = ["autoroles", "reactionroles"]

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db = await asyncpg.create_pool(DATABASE_URL)
    yield
    await app.state.db.close()

def require_user(request: Request):
    user = request.session.get("user")
    if not user or not request.session.get("access_token"):
        raise HTTPException(401, "Not logged in")
    return user
async def require_guild_manager(guild_id: int, request: Request, user: dict = Depends(require_user)):
    guilds = await get_user_guilds(request, user)
    g = next((g for g in guilds if int(g["id"]) == guild_id), None)
    if g is None:
        raise HTTPException(404, "Guild not found")
    perms = int(g["permissions"])
    if not(g["owner"] or perms & (ADMINISTRATOR | MANAGE_GUILD)):
        raise HTTPException(403, "Missing Manage Server")

    return g

def raise_for_discord(r: httpx.Response):
    if r.status_code == 429:
        retry_after = r.json().get("retry_after", 1)
        raise HTTPException(
            503,
            "Rate limited by Discord, try again shortly",
            headers={"Retry-After": str(int(retry_after) + 1)},
        )
    if r.status_code >= 500:
        raise HTTPException(502, "Discord is having issues, try again shortly")
    r.raise_for_status()

async def get_user_guilds(request: Request, user: dict):
    return await get_value(("user_guilds", user["id"]), 60, lambda: fetch_user_guilds(request))

async def fetch_user_guilds(request: Request):
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{API}/users/@me/guilds",
            headers={"Authorization": f"Bearer {request.session['access_token']}"}
        )
    if r.status_code == 401:
        request.session.clear()
        raise HTTPException(401, "Session expired")
    raise_for_discord(r)
    return r.json()

async def bot_get(path: str):
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{API}{path}", headers={"Authorization": f"Bot {BOT_TOKEN}"})
    if r.status_code in (403, 404):
        raise HTTPException(404, "Bot is not in this guild")
    raise_for_discord(r)
    return r.json()

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    SessionMiddleware,
    secret_key=os.environ["SESSION_SECRET"],
    same_site="lax",
    https_only=SECURE_COOKIES
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"]
)

async def get_bot_guilds(client: httpx.AsyncClient):
    return await get_value(("bot_guilds",), 60, lambda: fetch_bot_guilds(client))

async def fetch_bot_guilds(client: httpx.AsyncClient):
    guilds, after = [], None
    while True:
        params = {"limit": 200}
        if after:
            params["after"] = after
        r = await client.get(
            f"{API}/users/@me/guilds",
            headers={"Authorization": f"Bot {BOT_TOKEN}"},
            params=params,
        )
        raise_for_discord(r)
        page = r.json()
        guilds.extend(page)
        if len(page) < 200:
            break
        after = page[-1]["id"]

    return guilds

@app.get("/auth/login")
def login(request: Request):
    state = secrets.token_urlsafe(16)
    request.session["oauth_state"] = state
    params = urlencode({
        "client_id": CLIENT_ID,
        "response_type": "code",
        "redirect_uri": REDIRECT_URI,
        "scope": "identify guilds",
        "state": state
    })
    return RedirectResponse(f"https://discord.com/oauth2/authorize?{params}")

@app.get("/auth/callback")
async def callback(request: Request, code: str | None = None, state: str | None = None, error: str | None = None):
    if error or not code:
        return RedirectResponse(FRONTEND_URL)
    if not state or state != request.session.pop("oauth_state", None):
        raise HTTPException(400, "Invalid state")

    async with httpx.AsyncClient() as client:
        token = await client.post(f"{API}/oauth2/token", data={
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": REDIRECT_URI
        })
        if token.is_error:
            print("Discord token error:", token.status_code, token.text)
        raise_for_discord(token)
        access_token = token.json()["access_token"]

        user = await client.get(f"{API}/users/@me", headers={"Authorization": f"Bearer {access_token}"})

        raise_for_discord(user)

    u = user.json()
    request.session["user"] = {
        "id": u["id"],
        "username": u["username"],
        "global_name": u.get("global_name"),
        "avatar": u["avatar"],
    }
    request.session["access_token"] = access_token
    return RedirectResponse(FRONTEND_URL)

@app.get("/api/me")
def me(request: Request):
    return request.session.get("user")

@app.post("/api/logout")
def logout(request: Request):
    request.session.clear()
    return {"ok": True}

@app.get("/api/guilds")
async def guilds(request: Request, user: dict = Depends(require_user)):
    async with httpx.AsyncClient() as client:
        bot_guilds = await get_bot_guilds(client)
    bot_ids = {g["id"] for g in bot_guilds}
    r = await get_user_guilds(request, user)

    return [
        {
            "id": g["id"],
            "name": g["name"],
            "icon": g["icon"],
            "owner": g["owner"],
            "permissions": g["permissions"],
            "bot_in_guild": g["id"] in bot_ids
        } for g in r
    ]

@app.get("/api/guilds/{guild_id}/modules")
async def guild_modules(request: Request, guild_id: int, g: dict = Depends(require_guild_manager)):
    rows = await request.app.state.db.fetch(
        "SELECT * FROM server_modules WHERE guild_id = $1",
        guild_id,
    )
    return [
        {
            "module_id": r["module_id"],
            "enabled": r["enabled"]
        } for r in rows
    ]

class ModuleUpdate(BaseModel):
    enabled: bool

class ReactionRole(BaseModel):
    channel_id: str
    message_id: str
    emoji: str
    role_id: str

@app.get("/api/guilds/{guild_id}/modules/reactionroles")
async def list_reaction_roles(request: Request, guild_id: int, g: dict = Depends(require_guild_manager)):
    rows = await request.app.state.db.fetch(
        "SELECT * FROM reaction_roles WHERE guild_id = $1", guild_id
    )
    return [
        {k: str(r[k]) for k in ("channel_id", "message_id", "emoji", "role_id")}
        for r in rows
    ]

@app.post("/api/guilds/{guild_id}/modules/reactionroles")
async def add_reaction_role(request: Request, guild_id: int, body: ReactionRole, g: dict = Depends(require_guild_manager)):
    await request.app.state.db.execute(
        """
        INSERT INTO reaction_roles (guild_id, channel_id, message_id, emoji, role_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (message_id, emoji) DO UPDATE SET role_id = EXCLUDED.role_id
        """,
        guild_id, int(body.channel_id), int(body.message_id), body.emoji, int(body.role_id)
    )
    return {"ok": True}

@app.delete("/api/guilds/{guild_id}/modules/reactionroles/{message_id}")
async def delete_reaction_role(request: Request, guild_id: int, message_id: int, emoji: str, g: dict = Depends(require_guild_manager)):
    result = await request.app.state.db.execute(
    """
    DELETE FROM reaction_roles
    WHERE guild_id = $1 AND message_id = $2 AND emoji = $3
    """, guild_id, message_id, emoji)
    if result == "DELETE 0":
        raise HTTPException(404, "Reaction role not found")
    return {"ok": True}

def require_module_id(module_id: str):
    if module_id not in MODULE_IDS:
        raise HTTPException(404, "Module not found")
    return True

@app.post("/api/guilds/{guild_id}/modules/{module_id}/toggle",
dependencies=[Depends(require_module_id)])
async def toggle_module(
    request: Request,
    guild_id: int,
    module_id: str,
    body: ModuleUpdate,
    g: dict = Depends(require_guild_manager)):
    await request.app.state.db.execute(
        """
        INSERT INTO server_modules (guild_id, module_id, enabled)
        VALUES ($1, $2, $3)
        ON  CONFLICT (guild_id, module_id) DO UPDATE SET enabled = EXCLUDED.enabled
        """,
        guild_id, module_id, body.enabled,
    )
    return {"ok": True}

@app.get("/api/guilds/{guild_id}/channels")
async def guild_channels(request: Request, guild_id: int, g: dict = Depends(require_guild_manager)):
    return await get_value(("channels", guild_id), 30, lambda: fetch_guild_channels(guild_id))

async def fetch_guild_channels(guild_id: int):
    channels = await bot_get(f"/guilds/{guild_id}/channels")
    result = [
        {
            "id": c["id"],
            "name": c["name"],
            "type": c["type"],
            "parent_id": c.get("parent_id"),
            "position": c["position"]
        }
        for c in channels if c["type"] in (TEXT, ANNOUNCEMENT, CATEGORY)
    ]

    result.sort(key=lambda c: c["position"])
    return result

@app.get("/api/guilds/{guild_id}/emojis")
async def guild_emojis(request: Request, guild_id: int, g: dict = Depends(require_guild_manager)):
    emojis = await bot_get(f"/guilds/{guild_id}/emojis")

    result = [
        {
            "id": e["id"],
            "name": e["name"],
            "animated": e["animated"]
        }
        for e in emojis
    ]
    return result

@app.get("/api/guilds/{guild_id}/roles")
async def guild_roles(request: Request, guild_id: int, g: dict = Depends(require_guild_manager)):
    roles = await bot_get(f"/guilds/{guild_id}/roles")
    result = [
        {
            "id": r["id"],
            "name": r["name"]
        }
        for r in roles if r["name"] != "@everyone"
    ]
    return result

