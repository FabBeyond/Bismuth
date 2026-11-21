import asyncio
import contextlib
import logging
import time

import asyncpg

log = logging.getLogger("bismuth.settings")

CHANNEL = "settings_changed"
TTL = 15 * 60

LEVEL_DEFAULTS = {
    "xp_min": 15, "xp_max": 25, "cooldown": 60,
    "curve_a": 5, "curve_b": 50, "announce_channel_id": None
}

class SettingsCache:
    def __init__(self, pool: asyncpg.Pool, dsn: str):
        self.pool = pool
        self.dsn = dsn
        self._cache: dict[tuple[str, int], tuple[float, object]] = {}
        self._generation = 0
        self._task: asyncio.Task | None = None
        self._loaders = {
            "level_settings": self._load_level_settings,
            "server_modules": self._load_modules
        }

    async def get(self, table: str, guild_id: int):
        key = (table, guild_id)
        hit = self._cache.get(key)
        if hit and time.monotonic() - hit[0] < TTL:
            return hit[1]

        gen = self._generation
        value = await self._loaders[table](guild_id)

        if gen == self._generation:
            self._cache[key] = (time.monotonic(), value)
        return value

    async def module_active(self, guild_id: int, module_id: str):
        modules = await self.get("server_modules", guild_id)
        return modules.get(module_id, False)

    async def _load_level_settings(self, guild_id: int):
        row = await self.pool.fetchrow(
            "SELECT * FROM level_settings WHERE guild_id = $1",
            guild_id
        )
        return {**LEVEL_DEFAULTS, **dict(row)} if row else dict(LEVEL_DEFAULTS)

    async def _load_modules(self, guild_id: int):
        rows = await self.pool.fetch(
            "SELECT module_id, enabled FROM server_modules WHERE guild_id = $1",
            guild_id
        )
        return {r["module_id"]: bool(r["enabled"]) for r in rows}

    def _on_notify(self, conn, pid, channel, payload: str):
        table, _, guild_id = payload.partition(":")
        self._cache.pop((table, int(guild_id)), None)
        self._generation += 1

    def start(self):
        self._task = asyncio.create_task(self._listen_forever())

    async def stop(self):
        if self._task:
            self._task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._task

    async def _listen_forever(self):
        while True:
            conn = None
            try:
                conn = await asyncpg.connect(self.dsn)
                await conn.add_listener(CHANNEL, self._on_notify)

                self._cache.clear()
                self._generation += 1
                log.info("Listening for settings changes")

                while True:
                    await asyncio.sleep(30)
                    await conn.execute("SELECT 1", timeout=10)
            except asyncio.CancelledError:
                raise
            except Exception:
                log.exception("Settings listener lost, reconnecting in 5s")
            finally:
                if conn is not None:
                    conn.terminate()

            await asyncio.sleep(5)

