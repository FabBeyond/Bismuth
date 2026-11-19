from fastapi import APIRouter, Depends, HTTPException, Request

from deps import require_guild_manager, require_module_id
from models import ModuleUpdate, ReactionRole
from discord_api import bot_put, channel_guild_check
from urllib.parse import quote

router = APIRouter()

@router.get("/api/guilds/{guild_id}/modules")
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

@router.get("/api/guilds/{guild_id}/modules/reactionroles")
async def list_reaction_roles(request: Request, guild_id: int, g: dict = Depends(require_guild_manager)):
    rows = await request.app.state.db.fetch(
        "SELECT * FROM reaction_roles WHERE guild_id = $1", guild_id
    )
    return [
        {k: str(r[k]) for k in ("channel_id", "message_id", "emoji", "role_id")}
        for r in rows
    ]

@router.post("/api/guilds/{guild_id}/modules/reactionroles")
async def add_reaction_role(request: Request, guild_id: int, body: ReactionRole, g: dict = Depends(require_guild_manager)):
    await channel_guild_check(guild_id, body.channel_id)

    emoji = body.emoji
    if body.emoji.startswith("<") and body.emoji.endswith(">"):
        name, emoji_id = body.emoji[1:-1].split(":")[-2:]
        emoji = f"{name}:{emoji_id}"

    await bot_put(f"/channels/{body.channel_id}/messages/{body.message_id}/reactions/{quote(emoji)}/@me")

    await request.app.state.db.execute(
        """
        INSERT INTO reaction_roles (guild_id, channel_id, message_id, emoji, role_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (message_id, emoji) DO UPDATE SET role_id = EXCLUDED.role_id
        """,
        guild_id, int(body.channel_id), int(body.message_id), body.emoji, int(body.role_id)
    )
    return {"ok": True}

@router.delete("/api/guilds/{guild_id}/modules/reactionroles/{message_id}")
async def delete_reaction_role(request: Request, guild_id: int, message_id: int, emoji: str, g: dict = Depends(require_guild_manager)):
    result = await request.app.state.db.execute(
    """
    DELETE FROM reaction_roles
    WHERE guild_id = $1 AND message_id = $2 AND emoji = $3
    """, guild_id, message_id, emoji)
    if result == "DELETE 0":
        raise HTTPException(404, "Reaction role not found")
    return {"ok": True}

@router.post("/api/guilds/{guild_id}/modules/{module_id}/toggle",
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
