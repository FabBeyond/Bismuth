import discord
from discord import app_commands
from discord.ext import commands


class AutoRoles(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        role_ids = await self.get_auto_roles(member.guild.id)
        roles = [member.guild.get_role(role_id) for role_id in role_ids]
        roles = [r for r in roles if r is not None]
        if roles:
            await member.add_roles(*roles, reason="Auto Roles")


    async def get_auto_roles(self, guild_id):
        rows = await self.bot.pool.fetch(
            "SELECT role_id FROM autoroles WHERE guild_id = $1",
            guild_id,
        )
        return [r["role_id"] for r in rows]

async def setup(bot: commands.Bot):
    await bot.add_cog(AutoRoles(bot))
