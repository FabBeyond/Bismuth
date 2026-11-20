from fastapi import APIRouter, Depends, HTTPException, Request

from deps import require_guild_manager, require_module_id
from models import ModuleUpdate, ReactionRole, AutoRole, Honeypot
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

@router.get("/api/guilds/{guild_id}/modules/autoroles")
async def list_auto_roles(request: Request, guild_id: int, g: dict = Depends(require_guild_manager)):
    rows = await request.app.state.db.fetch(
        "SELECT * FROM autoroles WHERE guild_id = $1", guild_id
        )
    return [
        {
            "role_id": str(r["role_id"])
        }
        for r in rows
    ]

@router.post("/api/guilds/{guild_id}/modules/autoroles")
async def add_auto_role(request: Request, guild_id: int, body: AutoRole, g: dict = Depends(require_guild_manager)):
    await request.app.state.db.execute(
        """
        INSERT INTO autoroles (guild_id, role_id)
        VALUES($1, $2)
        ON CONFLICT (guild_id, role_id) DO NOTHING
        """, guild_id, int(body.role_id)
    )
    return {"ok": True}

@router.delete("/api/guilds/{guild_id}/modules/autoroles/{role_id}")
async def delete_auto_role(request: Request, guild_id: int, role_id: int, g: dict = Depends(require_guild_manager)):
    result = await request.app.state.db.execute(
        """
        DELETE FROM autoroles
        WHERE guild_id = $1 AND role_id = $2
        """, guild_id, role_id
    )
    if result == "DELETE 0":
        raise HTTPException(404, "Auto role not found")
    return {"ok": True}


@router.get("/api/guilds/{guild_id}/modules/honeypot")
async def list_honeypot(request: Request, guild_id: int, g: dict = Depends(require_guild_manager)):
    rows = await request.app.state.db.fetch(
        "SELECT * FROM honeypot WHERE guild_id = $1", guild_id
        )
    return [
        {
            "channel_id": str(r["channel_id"]),
            "action": r["action"],
            "message": r["message"],
            "delete_seconds": r["delete_seconds"]
        }
        for r in rows
    ]

@router.post("/api/guilds/{guild_id}/modules/honeypot")
async def add_honeypot(request: Request, guild_id: int, body: Honeypot, g: dict = Depends(require_guild_manager)):
    await channel_guild_check(guild_id, body.channel_id)

    await request.app.state.db.execute(
        """
        INSERT INTO honeypot (guild_id, channel_id, action, message, delete_seconds)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (guild_id, channel_id) DO UPDATE SET
            action = EXCLUDED.action,
            message = EXCLUDED.message,
            delete_seconds = EXCLUDED.delete_seconds
        """, guild_id, int(body.channel_id), body.action, body.message, body.delete_seconds
    )
    return {"ok": True}

@router.delete("/api/guilds/{guild_id}/modules/honeypot/{channel_id}")
async def delete_honeypot(request: Request, guild_id: int, channel_id: int, g: dict = Depends(require_guild_manager)):
    result = await request.app.state.db.execute(
        """
        DELETE FROM honeypot
        WHERE guild_id = $1 AND channel_id = $2
        """, guild_id, channel_id
    )
    if result == "DELETE 0":
        raise HTTPException(404, "Honeypot channel not found")
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
