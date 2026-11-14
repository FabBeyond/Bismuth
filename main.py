import os
import secrets
from urllib.parse import urlencode

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from starlette.middleware.sessions import SessionMiddleware

load_dotenv()
CLIENT_ID = os.environ["DISCORD_CLIENT_ID"]
CLIENT_SECRET = os.environ["DISCORD_CLIENT_SECRET"]
REDIRECT_URI = os.environ["REDIRECT_URI"]
FRONTEND_URL = os.environ["FRONTEND_URL"]
SECURE_COOKIES = os.environ.get("SECURE_COOKIES", "false").lower() == "true"
API = "https://discord.com/api"

app = FastAPI()
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
