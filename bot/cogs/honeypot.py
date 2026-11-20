from typing import TYPE_CHECKING

import discord
from discord.ext import commands

from utils.utils import guild_module_active, can_moderate


class Honeypot(commands.Cog):
    def __init__(self, bot: commands.Cog):
        self.bot = bot

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or message.guild is None:
            return

        if not await guild_module_active(self.bot.pool, message.guild.id, "honeypot"):
            return

        channel_id = (
            message.channel.parent_id
            if isinstance(message.channel, discord.Thread)
            else message.channel.id
        )

        result = await self.bot.pool.fetchrow(
            "SELECT * FROM honeypot WHERE guild_id = $1 AND channel_id = $2",
            message.guild.id,
            channel_id,
        )
        if result is None:
            return

        action = result["action"]
        author = message.author
        if action in ("kick", "ban") and isinstance(author, discord.Member):
            if not can_moderate(author, "ban_members"):
                return

            if result["message"] is not None:
                try:
                    await author.send(result["message"])
                except discord.Forbidden:
                    pass

            try:
                if action == "kick":
                    await author.ban(reason="Honeypot", delete_message_seconds=result["delete_seconds"])
                    await message.guild.unban(author, reason="Honeypot soft-ban")
                else:
                    await author.ban(reason="Honeypot", delete_message_seconds=result["delete_seconds"])
            except discord.HTTPException:
                pass


async def setup(bot: commands.Bot):
    await bot.add_cog(Honeypot(bot))
