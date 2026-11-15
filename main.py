import os
import secrets
from urllib.parse import urlencode
from contextlib import asynccontextmanager
import asyncpg

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
    guilds = await get_user_guilds()
    g = next((g for g in guilds if int(g["id"]) == guild_id), None)
    if g is None:
        raise HTTPException(404, "Guild not found")
    perms = int(g["permissions"])
    if not(g["owner"] or perms & (ADMINISTRATOR | MANAGE_GUILD)):
        raise HTTPException(403, "Missing Manage Server")

    return g

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
    allow_methods=["GET", "POST"],
    allow_headers=["*"]
)

async def fetch_bot_guilds(client: httpx.AsyncClient):
    guilds, after = [], None
    while True:
        params = {"limit": 200}
        if after:
            params["after"] = after
        r = await client.get(
            f"{API}/users/@me/guilds",
            headers={"Authorization": f"Bot {BOT_TOKEN}"},
            params=params
        )
        r.raise_for_status()
        page = r.json()
        guilds.extend(page)
        if len(page) < 200:
            return guilds
        after = page[-1]["id"]

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
        token.raise_for_status()
        access_token = token.json()["access_token"]

        user = await client.get(f"{API}/users/@me", headers={"Authorization": f"Bearer {access_token}"})

        user.raise_for_status()

    u = user.json()
    print(u)
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
async def guilds(request: Request):
    access_token = request.session.get("access_token")
    if not access_token:
        raise HTTPException(401, "Not logged in")

    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{API}/users/@me/guilds",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"with_counts": "true"}
        )
        bot_guilds = await fetch_bot_guilds(client)

    if r.status_code == 401:
        request.session.clear()
        raise HTTPException(401, "Session expired")
    r.raise_for_status()
    bot_ids = {g["id"] for g in bot_guilds}

    return [
        {
            "id": g["id"],
            "name": g["name"],
            "icon": g["icon"],
            "owner": g["owner"],
            "permissions": g["permissions"],
            "bot_in_guild": g["id"] in bot_ids
        } for g in r.json()
    ]

@app.get("/api/modules/{guild_id}/list")
async def guild_modules(request: Request, guild_id: str):

    rows = await request.app.state.db.fetch(
        "SELECT module_id FROM server_modules WHERE guild_id = $1",
        int(guild_id),
    )
    return [r["name"] for r in rows]
