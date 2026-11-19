import time

cache = {}

async def get_value(key, ttl, fetch):
    cached_val = cache.get(key)
    if (cached_val and time.time() - cached_val[0] < ttl):
        return cached_val[1]

    result = await fetch()
    cache[key] = (time.time(), result)
    return result
