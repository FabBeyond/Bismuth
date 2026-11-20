import asyncio
import time

cache = {}
inflight = {}

async def get_value(key, ttl, fetch):
    cached_val = cache.get(key)
    if (cached_val and time.time() - cached_val[0] < ttl):
        return cached_val[1]

    task = inflight.get(key)
    if task is not None:
        return await task

    task = asyncio.ensure_future(fetch())
    inflight[key] = task

    try: 
        result = await fetch()
        cache[key] = (time.time(), result)
        return result
    finally:
        inflight.pop(key, None)
