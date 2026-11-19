import discord
from discord import app_commands
from discord.ext import commands

from utils.utils import guild_module_active


class ReactionRoles(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload: discord.RawReactionActionEvent):
        if not await guild_module_active(self.bot.pool, payload.guild_id, "reactionroles"):
            return

        if payload.guild_id is None or payload.member is None or payload.member.bot:
            return

        role_id = await self.get_role(payload.guild_id, payload.message_id, str(payload.emoji))
        if role_id is None:
            return

        guild = self.bot.get_guild(payload.guild_id)
        role = guild.get_role(role_id)
        if role:
            await payload.member.add_roles(role, reason="Reaction Role")

    @commands.Cog.listener()
    async def on_raw_reaction_remove(self, payload: discord.RawReactionActionEvent):
        if not await guild_module_active(self.bot.pool, payload.guild_id, "reactionroles"):
            return

        if payload.guild_id is None:
            return

        role_id = await self.get_role(payload.guild_id, payload.message_id, str(payload.emoji))
        if role_id is None:
            return

        guild = self.bot.get_guild(payload.guild_id)
        role = guild.get_role(role_id)
        member = await guild.fetch_member(payload.user_id)
        if role and member:
            await member.remove_roles(role, reason="Reaction Role")

    async def get_role(self, guild_id, message_id, emoji):
        return await self.bot.pool.fetchval(
            "SELECT role_id FROM reaction_roles WHERE guild_id = $1 AND message_id = $2 and emoji = $3",
            guild_id, message_id, emoji,
        )


async def setup(bot: commands.Bot):
    await bot.add_cog(ReactionRoles(bot))
