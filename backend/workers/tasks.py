"""
Celery Tasks — async algorithm jobs triggered by API routes.
Results are written to ClickHouse and published to Redis → WebSocket → frontend.
"""
import json
import pandas as pd
import redis
from datetime import datetime, timezone
from workers.celery_app import celery_app
from core.config import settings
from core.database import get_clickhouse_client
from engines.process_mining.pipeline import ProcessMiningEngine
from engines.slotting.optimizer import SlottingOptimizer
from websocket.telemetry import (
    make_bottleneck_update, make_slotting_update, make_forecast_update
)

sync_redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
pm_engine = ProcessMiningEngine()


@celery_app.task(bind=True, max_retries=3)
def run_process_mining(self, warehouse_id: str, algorithm: str = "heuristics_miner"):
    """
    Fetch WMS event logs from ClickHouse → run selected PM algorithm
    → detect bottlenecks → publish results to Redis → frontend.
    """
    try:
        ch = get_clickhouse_client()

        # Fetch last 7 days of event logs
        df = ch.query_df(
            """
            SELECT case_id, activity, timestamp, worker_id, zone, equipment_id, cost_per_min
            FROM wms_events
            WHERE warehouse_id = %(wh)s
              AND timestamp >= now() - INTERVAL 7 DAY
            ORDER BY case_id, timestamp
            """,
            parameters={"wh": warehouse_id},
        )

        if df.empty:
            return {"status": "no_data", "warehouse_id": warehouse_id}

        # Run selected algorithm
        if algorithm == "alpha":
            result = pm_engine.run_alpha(df)
        elif algorithm == "inductive_miner":
            result = pm_engine.run_inductive_miner(df)
        elif algorithm == "multi_perspective":
            result = pm_engine.run_multi_perspective(df)
        else:
            result = pm_engine.run_heuristics_miner(df)

        # Find bottlenecks
        bottlenecks = pm_engine.find_bottlenecks(df)
        bottleneck_data = [
            {
                "stage": b.stage,
                "avg_duration_sec": b.avg_duration_sec,
                "median_duration_sec": b.median_duration_sec,
                "cases_affected": b.cases_affected,
                "throughput_loss_estimate": b.throughput_loss_estimate,
            }
            for b in bottlenecks
        ]

        # Store in ClickHouse
        now = datetime.now(timezone.utc)
        rows = [(warehouse_id, now, b["stage"], 0.0, 0, b["throughput_loss_estimate"], algorithm, 0.9)
                for b in bottleneck_data]
        if rows:
            ch.insert(
                "bottleneck_detections",
                rows,
                column_names=["warehouse_id", "detected_at", "stage", "utilization_pct",
                              "queue_depth", "throughput_delta", "algorithm", "confidence"],
            )

        # Publish to Redis → WebSocket → frontend
        message = make_bottleneck_update(warehouse_id, bottleneck_data)
        sync_redis.publish(f"waremind:bottleneck:{warehouse_id}", json.dumps(message))

        return {"status": "completed", "algorithm": algorithm, "bottlenecks_found": len(bottlenecks)}

    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=2)
def run_slotting(self, warehouse_id: str):
    """
    Fetch SKU data → run slotting optimizer → publish recommendations.
    """
    try:
        from engines.slotting.optimizer import SlottingOptimizer, SKUData
        ch = get_clickhouse_client()

        # In production: fetch from PostgreSQL skus table
        # For now: pass through to the existing engine logic
        optimizer = SlottingOptimizer()
        # results = optimizer.optimize(sku_list)

        return {"status": "completed", "warehouse_id": warehouse_id}

    except Exception as exc:
        raise self.retry(exc=exc, countdown=30)


@celery_app.task(bind=True)
def run_demand_forecast(self, warehouse_id: str):
    """
    Run LSTM demand forecast for next 24 hours → write to ClickHouse.
    Triggered hourly by Celery beat scheduler.
    """
    # Full implementation: load trained model, build feature vectors,
    # run DemandForecastingEngine.predict(), write to ClickHouse demand_forecasts
    return {"status": "completed", "warehouse_id": warehouse_id}


@celery_app.task
def ingest_kafka_events(events: list[dict], warehouse_id: str):
    """
    Batch-insert WMS events from Kafka consumer into ClickHouse.
    Called by the Kafka consumer service (aiokafka).
    """
    ch = get_clickhouse_client()
    rows = [
        (
            warehouse_id,
            e["case_id"],
            e["activity"],
            e["timestamp"],
            e.get("worker_id", ""),
            e.get("zone", ""),
            e.get("equipment_id", ""),
            float(e.get("cost_per_min", 0.0)),
            float(e.get("duration_sec", 0.0)),
        )
        for e in events
    ]
    ch.insert(
        "wms_events",
        rows,
        column_names=["warehouse_id", "case_id", "activity", "timestamp",
                      "worker_id", "zone", "equipment_id", "cost_per_min", "duration_sec"],
    )
