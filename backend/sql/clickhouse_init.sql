"""ClickHouse schema initialization — run once on first deploy."""

-- WMS Event Log (the raw input for ALL Process Mining algorithms)
-- Case ID + Activity + Timestamp is the minimal event log schema
CREATE TABLE IF NOT EXISTS wms_events (
    warehouse_id   String,
    case_id        String,       -- Unique order or batch ID
    activity       String,       -- 'order_released', 'picking_started', 'picking_completed',
                                 -- 'packing_started', 'packed', 'dispatched'
    timestamp      DateTime64(3, 'UTC'),
    worker_id      String,
    zone           String,
    equipment_id   String,       -- For Multi-Perspective Process Mining
    cost_per_min   Float32,      -- For Multi-Perspective Process Mining
    duration_sec   Float32       -- Time spent on this activity
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (warehouse_id, case_id, timestamp)
TTL timestamp + INTERVAL 24 MONTH;  -- Auto-expire logs older than 2 years


-- Stage Telemetry (real-time pipeline metrics)
CREATE TABLE IF NOT EXISTS stage_telemetry (
    warehouse_id   String,
    stage          String,       -- 'receive', 'pick', 'pack', 'dispatch'
    throughput     UInt32,
    capacity       UInt32,
    active_queue   UInt32,
    workers        UInt8,
    timestamp      DateTime64(3, 'UTC')
) ENGINE = MergeTree()
ORDER BY (warehouse_id, stage, timestamp)
TTL timestamp + INTERVAL 3 MONTH;


-- Demand Forecasts (written by the LSTM engine, read by ForecastCenter)
CREATE TABLE IF NOT EXISTS demand_forecasts (
    warehouse_id   String,
    sku_id         String,
    forecast_date  Date,
    hour           UInt8,
    predicted_qty  Float32,
    confidence     Float32,
    model_version  String,
    created_at     DateTime64(3, 'UTC')
) ENGINE = ReplacingMergeTree(created_at)
ORDER BY (warehouse_id, sku_id, forecast_date, hour);


-- Bottleneck Detections (written by Process Mining, read by BottleneckIntelligence)
CREATE TABLE IF NOT EXISTS bottleneck_detections (
    warehouse_id      String,
    detected_at       DateTime64(3, 'UTC'),
    stage             String,
    utilization_pct   Float32,
    queue_depth       UInt32,
    throughput_delta  Float32,   -- How much throughput is being lost
    algorithm         String,    -- Which PM algorithm detected it
    confidence        Float32
) ENGINE = MergeTree()
ORDER BY (warehouse_id, detected_at);
