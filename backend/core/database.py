from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import clickhouse_connect
import redis.asyncio as aioredis
from core.config import settings


# ─────────────────────────── PostgreSQL ───────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    echo=(settings.APP_ENV == "development"),
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency — yields a database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# ─────────────────────────── ClickHouse ───────────────────────────
def get_clickhouse_client():
    """
    Returns a synchronous ClickHouse client.
    Used inside Celery tasks and engine pipelines.
    For async routes, run in a threadpool executor.
    """
    return clickhouse_connect.get_client(
        host=settings.CLICKHOUSE_HOST,
        port=settings.CLICKHOUSE_PORT,
        username=settings.CLICKHOUSE_USER,
        password=settings.CLICKHOUSE_PASSWORD,
        database=settings.CLICKHOUSE_DB,
    )


# ─────────────────────────── Redis ───────────────────────────
async def get_redis() -> aioredis.Redis:
    """FastAPI dependency — yields a Redis connection."""
    client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        yield client
    finally:
        await client.aclose()
