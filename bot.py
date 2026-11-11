from pathlib import Path
import asyncpg
import aiohttp

import discord
from discord.ext import commands

import config
import logging

log = logging.getLogger("bismuth")


class Bismuth(commands.AutoShardedBot):
    def __init__(self):
        intents = discord.Intents.default()

        super().__init__(
            command_prefix=commands.when_mentioned,
            intents=intents,
            member_cache_flags=discord.MemberCacheFlags.none(),
            chunk_guilds_at_startup=False,
            max_messages=None,
        )

        self.pool = None
        self.session = None

    async def setup_hook(self):
        self.pool = await asyncpg.create_pool(config.DATABASE_URL, min_size=1, max_size=10)
        self.session = aiohttp.ClientSession()
        await self.run_migrations()

        for file in Path("cogs").glob("*.py"):
            if file.stem.startswith("_"):
                continue
            await self.load_extension(f"cogs.{file.stem}")
            log.info("Loaded cog %s", file.stem)

    async def close(self):
        if self.session:
            await self.session.close()
        if self.pool:
            await self.pool.close()
        await super().close()

    async def on_ready(self):
        log.info("Ready as %s | %s guilds | %s shards", self.user, len(self.guilds), self.shard_count)

    async def on_shard_ready(self, shard_id: int):
        log.info("Shard %s ready", shard_id)

    async def run_migrations(self):
        async with self.pool.acquire() as conn:
            await conn.execute("CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY)")
            done = {r["name"] for r in await conn.fetch("SELECT name FROM schema_migrations")}

            for file in sorted(Path("db/migrations").glob("*.sql")):
                if file.name in done:
                    continue
                async with conn.transaction():
                    await conn.execute(file.read_text())
                    await conn.execute("INSERT INTO schema_migrations (name) VALUES ($1)", file.name)
                log.info("Applied migration %s", file.name)

bot = Bismuth()


@bot.tree.error
async def on_app_command_error(interaction: discord.Interaction, error: discord.app_commands.AppCommandError):
    # TODO: handle cooldowns, missing permissions, etc. with friendly messages
    log.exception("Command error", exc_info=error)
    msg = "Something went wrong."
    if interaction.response.is_done():
        await interaction.followup.send(msg, ephemeral=True)
    else:
        await interaction.response.send_message(msg, ephemeral=True)


if __name__ == "__main__":
    discord.utils.setup_logging()
    bot.run(config.TOKEN, log_handler=None)
