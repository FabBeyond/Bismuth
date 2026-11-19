import httpx
from fastapi import HTTPException, Request

from cache import get_value
from config import API, BOT_TOKEN, TEXT, ANNOUNCEMENT, CATEGORY

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
