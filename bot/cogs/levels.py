import discord
from discord import app_commands
from discord.ext import commands, tasks
import random
import math
import time

from utils.utils import guild_module_active

MAX_COOLDOWN = 3600

class Levels(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self._last_grant: dict[tuple[int, int], float] = {}
        self.prune_cooldowns.start()

    def level_for_xp(self, xp: int, a: int, b: int):
        if a == 0:
            return xp // b

        return (math.isqrt(b*b + 4 *a * xp) - b) // (2 * a)

    def xp_for_level(self, n: int, a: int, b: int):
        return a * n * n + b * n

    def level_progress(self, xp: int, a: int, b: int):
        cur_level = self.level_for_xp(xp, a, b)
        cur_xp = xp
        xp_to_next_level = self.xp_for_level(cur_level+1, a, b)-cur_xp

        return cur_xp, cur_level, xp_to_next_level

    async def cog_unload(self):
        self.prune_cooldowns.cancel()

    def _on_cooldown(self, guild_id: int, user_id: int, cooldown: int):
        key = (guild_id, user_id)
        now = time.monotonic()
        last = self._last_grant.get(key)
        if last is not None and now - last < cooldown:
            return True

        self._last_grant[key] = now
        return False

    @tasks.loop(minutes=10)
    async def prune_cooldowns(self):
        cutoff = time.monotonic() - MAX_COOLDOWN
        self._last_grant = {k: t for k, t in self._last_grant.items() if t > cutoff}

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or message.guild is None:
            return

        gid = message.guild.id
        if not await self.bot.settings.module_active(gid, "levels"):
            return
        s = await self.bot.settings.get("level_settings", gid)

        if self._on_cooldown(gid, message.author.id, s["cooldown"]):
            return

        gained = random.randint(s["xp_min"], s["xp_max"])
        new_xp = await self.bot.pool.fetchval(
            """
            INSERT INTO member_xp (guild_id, user_id, xp)
            VALUES ($1, $2, $3)
            ON CONFLICT (guild_id, user_id)
            DO UPDATE SET xp = member_xp.xp + EXCLUDED.xp
            RETURNING xp
            """,
            message.guild.id, message.author.id, gained
        )

        old_level = self.level_for_xp(new_xp - gained, s["curve_a"], s["curve_b"])
        new_level = self.level_for_xp(new_xp, s["curve_a"], s["curve_b"])

        if (new_level > old_level):
            await message.channel.send(f"{message.author.mention} reached level {new_level}")


    @app_commands.command(name="level", description="Show your level and XP")
    @app_commands.describe(member="Whose level to show (default: you)")
    @app_commands.guild_only()
    async def level(self, interaction: discord.Interaction, member: discord.Member | None = None):
        member = member or interaction.user
        gid = interaction.guild_id

        if not await self.bot.settings.module_active(gid, "levels"):
            await interaction.response.send_message(
                "Leveling is disabled on this server.", ephemeral=True
            )
            return

        s = await self.bot.settings.get("level_settings", gid)
        xp = await self.bot.pool.fetchval(
            "SELECT xp FROM member_xp WHERE guild_id = $1 AND user_id = $2",
            gid, member.id
        ) or 0

        cur_xp, level, xp_to_next_level = self.level_progress(xp, s["curve_a"], s["curve_b"])

        await interaction.response.send_message(
            f"{member.mention} is level {level} with {cur_xp} XP. They are missing {xp_to_next_level} XP to level up.",
            allowed_mentions=None
        )

async def setup(bot: commands.Bot):
    await bot.add_cog(Levels(bot))
