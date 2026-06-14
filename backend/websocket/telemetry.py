"""
WebSocket Telemetry Hub — pushes real-time warehouse data to connected frontend clients.

Flow:
  Kafka consumer → Redis Pub/Sub → WebSocket broadcast → React frontend

Each connected client subscribes to a specific warehouse_id.
Messages are typed JSON payloads that the frontend Zustand store consumes.
"""
import json
import asyncio
import logging
from fastapi import WebSocket, WebSocketDisconnect
import redis.asyncio as aioredis
from core.config import settings

logger = logging.getLogger(__name__)


# ─────────────────────────── Connection Manager ───────────────────────────

class ConnectionManager:
    """
    Tracks all active WebSocket connections, grouped by warehouse_id.
    Supports targeted broadcasts (to all clients watching warehouse WH-01)
    and global broadcasts (network-wide alerts).
    """

    def __init__(self):
        # warehouse_id → list of active WebSocket connections
        self._connections: dict[str, list[WebSocket]] = {}

    async def connect(self, ws: WebSocket, warehouse_id: str):
        await ws.accept()
        self._connections.setdefault(warehouse_id, []).append(ws)
        logger.info(f"WS connected: warehouse={warehouse_id}, total={self._count()}")

    def disconnect(self, ws: WebSocket, warehouse_id: str):
        conns = self._connections.get(warehouse_id, [])
        if ws in conns:
            conns.remove(ws)
        logger.info(f"WS disconnected: warehouse={warehouse_id}")

    async def broadcast_to_warehouse(self, warehouse_id: str, message: dict):
        """Send a message to all clients watching a specific warehouse."""
        dead = []
        for ws in self._connections.get(warehouse_id, []):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, warehouse_id)

    async def broadcast_global(self, message: dict):
        """Send a message to ALL connected clients (e.g. network-wide alerts)."""
        for warehouse_id in list(self._connections.keys()):
            await self.broadcast_to_warehouse(warehouse_id, message)

    def _count(self) -> int:
        return sum(len(conns) for conns in self._connections.values())


manager = ConnectionManager()


# ─────────────────────────── Message Types ───────────────────────────
# The frontend Zustand store listens for these message types:
#
#  STAGE_UPDATE      → updates stage pipeline telemetry
#  ALERT             → adds a new alert to the feed
#  BOTTLENECK        → updates bottleneck detection result
#  FORECAST_UPDATE   → updates demand forecast data
#  SLOTTING_UPDATE   → updates slotting recommendations
#  HEALTH_UPDATE     → updates warehouse health score
#  SUPERVISOR_STATUS → updates Digital Twin aisle occupancy map

def make_stage_update(warehouse_id: str, stage_data: dict) -> dict:
    return {"type": "STAGE_UPDATE", "warehouse_id": warehouse_id, "payload": stage_data}

def make_alert(warehouse_id: str, alert: dict) -> dict:
    return {"type": "ALERT", "warehouse_id": warehouse_id, "payload": alert}

def make_bottleneck_update(warehouse_id: str, bottlenecks: list) -> dict:
    return {"type": "BOTTLENECK", "warehouse_id": warehouse_id, "payload": bottlenecks}

def make_forecast_update(warehouse_id: str, forecasts: list) -> dict:
    return {"type": "FORECAST_UPDATE", "warehouse_id": warehouse_id, "payload": forecasts}

def make_health_update(warehouse_id: str, health: dict) -> dict:
    return {"type": "HEALTH_UPDATE", "warehouse_id": warehouse_id, "payload": health}

def make_supervisor_status(warehouse_id: str, aisle_map: dict) -> dict:
    return {"type": "SUPERVISOR_STATUS", "warehouse_id": warehouse_id, "payload": aisle_map}


# ─────────────────────────── WebSocket Endpoint ───────────────────────────

async def telemetry_ws_endpoint(ws: WebSocket, warehouse_id: str):
    """
    FastAPI WebSocket route handler.
    Mount this in main.py:
        @app.websocket("/ws/telemetry/{warehouse_id}")
        async def ws_route(ws: WebSocket, warehouse_id: str):
            await telemetry_ws_endpoint(ws, warehouse_id)
    """
    await manager.connect(ws, warehouse_id)
    try:
        # Send initial snapshot on connect
        await ws.send_json({"type": "CONNECTED", "warehouse_id": warehouse_id})

        # Keep connection alive — handle any client messages (e.g. ping)
        while True:
            try:
                data = await asyncio.wait_for(ws.receive_text(), timeout=30.0)
                msg = json.loads(data)
                if msg.get("type") == "PING":
                    await ws.send_json({"type": "PONG"})
            except asyncio.TimeoutError:
                # Send keepalive
                await ws.send_json({"type": "KEEPALIVE"})
    except WebSocketDisconnect:
        manager.disconnect(ws, warehouse_id)


# ─────────────────────────── Redis Subscriber ───────────────────────────

async def start_redis_subscriber():
    """
    Runs as a background task in FastAPI lifespan.
    Subscribes to Redis Pub/Sub channels and forwards messages to WebSocket clients.

    Redis channels:
      waremind:stage:{warehouse_id}
      waremind:alert:{warehouse_id}
      waremind:bottleneck:{warehouse_id}
      waremind:global
    """
    redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    pubsub = redis.pubsub()
    await pubsub.psubscribe("waremind:*")  # Subscribe to all waremind channels

    logger.info("Redis subscriber started — listening for waremind:* channels")

    async for message in pubsub.listen():
        if message["type"] not in ("pmessage", "message"):
            continue

        channel: str = message.get("channel", "")
        try:
            data = json.loads(message["data"])
        except (json.JSONDecodeError, TypeError):
            continue

        # Route to correct WebSocket clients
        parts = channel.split(":")
        if len(parts) >= 3:
            warehouse_id = parts[2]
            await manager.broadcast_to_warehouse(warehouse_id, data)
        elif channel == "waremind:global":
            await manager.broadcast_global(data)


# ─────────────────────────── Redis Publisher Helper ───────────────────────────

async def publish_to_warehouse(redis: aioredis.Redis, warehouse_id: str, message: dict):
    """
    Called by Celery tasks and API routes to push updates to connected clients.
    Example:
        await publish_to_warehouse(redis, "WH-01", make_alert("WH-01", alert_data))
    """
    channel = f"waremind:stage:{warehouse_id}"
    msg_type = message.get("type", "UPDATE")
    if msg_type == "ALERT":
        channel = f"waremind:alert:{warehouse_id}"
    elif msg_type == "BOTTLENECK":
        channel = f"waremind:bottleneck:{warehouse_id}"

    await redis.publish(channel, json.dumps(message))
