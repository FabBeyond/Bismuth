import discord
from discord.ext import commands

class GuildSync(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def add_guild(self, guild_id: int):
        await self.bot.pool.execute(
            "INSERT INTO bot_guilds (guild_id) VALUES ($1) ON CONFLICT DO NOTHING",
            guild_id
        )

    @commands.Cog.listener()
    async def on_guild_join(self, guild: discord.Guild):
        await self.add_guild(guild.id)

    @commands.Cog.listener()
    async def on_guild_available(self, guild: discord.Guild):
        await self.add_guild(guild.id)

    @commands.Cog.listener()
    async def on_guild_remove(self, guild: discord.Guild):
        await self.bot.pool.execute(
            "DELETE FROM bot_guilds WHERE guild_id = $1",
            guild.id)

    @commands.Cog.listener()
    async def on_ready(self):
        ids = [g.id for g in self.bot.guilds]
        async with self.bot.pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute(
                    "DELETE FROM bot_guilds WHERE guild_id <> ALL($1::bigint[])",
                    ids
                )
                await conn.execute(
                    """
                    INSERT INTO bot_guilds (guild_id)
                    SELECT unnest($1::bigint[])
                    ON CONFLICT DO NOTHING
                    """,
                    ids
                )

async def setup(bot: commands.Bot):
    await bot.add_cog(GuildSync(bot))
