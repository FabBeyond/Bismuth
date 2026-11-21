import logging
from sys import exec_prefix

import discord
from discord import app_commands
from discord.ext import commands

log = logging.getLogger("bismuth")

class General(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.command()
    @commands.is_owner()
    async def reload(self, ctx: commands.Context, name: str):
        ext = f"cogs.{name}"

        try:
            if ext in self.bot.extensions:
                await self.bot.reload_extension(ext)
                action = "Reloaded"
            else:
                await self.bot.load_extension(f"cogs.{name}")
                action = "Loaded"
        except commands.ExtensionError as e:
            log.exception(f"Reload of {ext} failed")
            await ctx.reply(f"Failed: '{e}'")

        await ctx.reply(f"{action} '{name}'")

async def setup(bot: commands.Bot):
    await bot.add_cog(General(bot))
