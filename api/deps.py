from fastapi import Depends, HTTPException, Request

from config import ADMINISTRATOR, MANAGE_GUILD, MODULE_IDS
from discord_api import get_user_guilds

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
def require_module_id(module_id: str):
    if module_id not in MODULE_IDS:
        raise HTTPException(404, "Module not found")
    return True

