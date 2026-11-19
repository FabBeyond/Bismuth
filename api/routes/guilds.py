import httpx
from fastapi import APIRouter, Depends, Request

from deps import require_user, require_guild_manager
from discord_api import bot_get, bot_post, get_bot_guilds, get_user_guilds, channel_guild_check
from models import SendMessage

router = APIRouter()

@router.get("/api/guilds")
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

@router.get("/api/guilds/{guild_id}/channels")
async def guild_channels(request: Request, guild_id: int, g: dict = Depends(require_guild_manager)):
    return await get_value(("channels", guild_id), 30, lambda: fetch_guild_channels(guild_id))

@router.get("/api/guilds/{guild_id}/emojis")
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

@router.get("/api/guilds/{guild_id}/roles")
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

@router.post("/api/guilds/{guild_id}/channels/{channel_id}/messages")
async def send_message(request: Request, guild_id: int, channel_id: int, body: SendMessage, g: dict = Depends(require_guild_manager)):
    await channel_guild_check(guild_id, channel_id)
    result = await bot_post(f"/channels/{channel_id}/messages", {"content": body.message})
    return {"message_id": result["id"]}
