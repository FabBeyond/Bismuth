import discord

async def guild_module_active(db, guild_id, module_id):
    val = await db.fetchval(
        "SELECT enabled FROM server_modules WHERE guild_id = $1 AND module_id = $2",
        guild_id, module_id,
    )
    if val is None:
        return False
    return bool(val)

def can_moderate(member: discord.Member, permission: str):
    me = member.guild.me

    if not getattr(me.guild_permissions, permission):
        return False
    if member.id == member.guild.owner_id:
        return False
    if me.top_role <= member.top_role:
        return False
    return True
