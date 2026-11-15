async def guild_module_active(db, guild_id, module_id):
    val = await db.fetchval(
        "SELECT enabled FROM server_modules WHERE guild_id = $1 AND module_id = $2",
        guild_id, module_id,
    )
    if val is None:
        return False
    return bool(val)
