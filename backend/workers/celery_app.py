"""
Celery worker — runs algorithm jobs asynchronously.
Triggered by API routes, results published to Redis → WebSocket → frontend.
"""
from celery import Celery
from core.config import settings

celery_app = Celery(
    "waremind",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_routes={
        "workers.tasks.run_process_mining":  {"queue": "algorithms"},
        "workers.tasks.run_demand_forecast": {"queue": "ml"},
        "workers.tasks.run_slotting":        {"queue": "algorithms"},
    },
)
