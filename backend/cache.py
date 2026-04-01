import redis.asyncio as redis
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from dotenv import load_dotenv
import os

load_dotenv()

# Cache TTL constants (in seconds)
CACHE_DEFAULT = 86400   # 24 hours
CACHE_PREDICT = 21600   # 6 hours

# Redis connection
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

async def init_cache():
    """Initialize Redis cache (optional)"""
    try:
        redis_client = redis.from_url(REDIS_URL, encoding="utf8", decode_responses=True)
        FastAPICache.init(RedisBackend(redis_client), prefix="fastapi-cache")
        print("✓ Redis cache initialized")
    except Exception as e:
        print(f"⚠ Redis not available, running without cache: {e}")
        print("  (App will work but responses won't be cached)")

async def clear_all_cache():
    """Clear all cache entries"""
    try:
        redis_client = redis.from_url(REDIS_URL)
        await redis_client.flushdb()
        await redis_client.close()
        print("All cache cleared")
    except Exception as e:
        print(f"Redis not available for cache clearing: {e}")
