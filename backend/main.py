"""
FastAPI Application Entry Point — WareMindAI Backend.
"""
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.database import engine, Base
from api.routes import auth, warehouses, events, algorithms, simulation
from websocket.telemetry import telemetry_ws_endpoint, start_redis_subscriber

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ─────────────────────────── Lifespan ───────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create DB tables + start Redis subscriber. Shutdown: clean up."""
    logger.info("Starting WareMindAI backend...")

    # Create all PostgreSQL tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("PostgreSQL tables ready.")

    # Start Redis → WebSocket subscriber in background
    redis_task = asyncio.create_task(start_redis_subscriber())
    logger.info("Redis subscriber started.")

    yield  # App is running

    redis_task.cancel()
    await engine.dispose()
    logger.info("WareMindAI backend shut down.")


# ─────────────────────────── App ───────────────────────────
app = FastAPI(
    title="WareMindAI API",
    description="Intelligent Warehouse Operations Platform — Backend API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────── REST Routes ───────────────────────────
app.include_router(auth.router,         prefix="/api/auth",          tags=["Auth"])
app.include_router(warehouses.router,   prefix="/api/warehouses",    tags=["Warehouses"])
app.include_router(events.router,       prefix="/api/events",        tags=["WMS Events"])
app.include_router(algorithms.router,   prefix="/api/algorithms",    tags=["Algorithms"])
app.include_router(simulation.router,   prefix="/api/simulation",    tags=["Simulation"])


# ─────────────────────────── WebSocket ───────────────────────────
@app.websocket("/ws/telemetry/{warehouse_id}")
async def ws_telemetry(ws: WebSocket, warehouse_id: str):
    """
    Real-time telemetry WebSocket per warehouse.
    Connect from frontend: new WebSocket('ws://localhost:8000/ws/telemetry/WH-01')
    """
    await telemetry_ws_endpoint(ws, warehouse_id)


# ─────────────────────────── Health Check ───────────────────────────
@app.get("/health", tags=["System"])
async def health():
    return {"status": "ok", "service": "waremindai-api", "version": "1.0.0"}
