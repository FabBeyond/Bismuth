import discord
from discord import app_commands
from discord.ext import commands


class General(commands.Cog):
    """TODO: describe the general feature set."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    # Example slash command shape:
    # @app_commands.command(name="example", description="...")
    # async def example(self, interaction: discord.Interaction):
    #     ...

    # Example listener shape:
    # @commands.Cog.listener()
    # async def on_guild_join(self, guild: discord.Guild):
    #     ...


async def setup(bot: commands.Bot):
    await bot.add_cog(General(bot))
