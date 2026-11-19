import secrets
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse

from config import API, CLIENT_ID, CLIENT_SECRET, FRONTEND_URL, REDIRECT_URI
from discord_api import raise_for_discord

router = APIRouter()

@router.get("/auth/login")
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

@router.get("/auth/callback")
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

@router.post("/api/logout")
def logout(request: Request):
    request.session.clear()
    return {"ok": True}

@router.get("/api/me")
def me(request: Request):
    return request.session.get("user")
