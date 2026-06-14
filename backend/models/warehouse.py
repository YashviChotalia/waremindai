"""
PostgreSQL schema — SQLAlchemy async models.
Run 'alembic upgrade head' to apply migrations.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    String, Float, Integer, Boolean, DateTime,
    ForeignKey, Enum, Text, JSON
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


# ─────────────────────────── Warehouse ───────────────────────────
class Warehouse(Base):
    __tablename__ = "warehouses"

    id: Mapped[str] = mapped_column(String(10), primary_key=True)  # e.g. "WH-01"
    name: Mapped[str] = mapped_column(String(120))
    region: Mapped[str] = mapped_column(String(80))
    city: Mapped[str] = mapped_column(String(80))
    capacity_sqft: Mapped[int] = mapped_column(Integer, default=0)
    total_zones: Mapped[int] = mapped_column(Integer, default=4)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    workers: Mapped[list["Worker"]] = relationship(back_populates="warehouse")
    skus: Mapped[list["SKU"]] = relationship(back_populates="warehouse")
    orders: Mapped[list["Order"]] = relationship(back_populates="warehouse")
    alerts: Mapped[list["Alert"]] = relationship(back_populates="warehouse")
    baselines: Mapped[list["OperationalBaseline"]] = relationship(back_populates="warehouse")


# ─────────────────────────── Worker ───────────────────────────
class Worker(Base):
    __tablename__ = "workers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    warehouse_id: Mapped[str] = mapped_column(ForeignKey("warehouses.id"))
    name: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(
        Enum("picker", "packer", "receiver", "dispatcher", "supervisor", name="worker_role")
    )
    shift: Mapped[str] = mapped_column(Enum("morning", "afternoon", "night", name="shift_type"))
    active: Mapped[bool] = mapped_column(Boolean, default=True)

    warehouse: Mapped["Warehouse"] = relationship(back_populates="workers")


# ─────────────────────────── SKU ───────────────────────────
class SKU(Base):
    __tablename__ = "skus"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)  # e.g. "SKU-4821"
    warehouse_id: Mapped[str] = mapped_column(ForeignKey("warehouses.id"))
    name: Mapped[str] = mapped_column(String(200))
    zone: Mapped[str] = mapped_column(
        Enum("Zone A", "Zone B", "Zone C", "Zone D", name="zone_type")
    )
    pick_frequency: Mapped[float] = mapped_column(Float, default=0.0)  # picks/day
    velocity: Mapped[str] = mapped_column(
        Enum("High", "Medium", "Low", name="velocity_type")
    )
    size_percent: Mapped[float] = mapped_column(Float, default=0.0)   # % of floor space
    reorder_point: Mapped[int] = mapped_column(Integer, default=0)
    current_stock: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    warehouse: Mapped["Warehouse"] = relationship(back_populates="skus")


# ─────────────────────────── Order ───────────────────────────
class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    warehouse_id: Mapped[str] = mapped_column(ForeignKey("warehouses.id"))
    external_order_id: Mapped[str] = mapped_column(String(60), unique=True)
    status: Mapped[str] = mapped_column(
        Enum("pending", "picking", "picked", "packing", "packed", "dispatched", name="order_status"),
        default="pending"
    )
    priority: Mapped[str] = mapped_column(
        Enum("standard", "express", "same_day", name="order_priority"),
        default="standard"
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    dispatched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    batch_id: Mapped[str | None] = mapped_column(String(40), nullable=True)  # for order batching

    warehouse: Mapped["Warehouse"] = relationship(back_populates="orders")
    lines: Mapped[list["OrderLine"]] = relationship(back_populates="order", cascade="all, delete-orphan")


class OrderLine(Base):
    __tablename__ = "order_lines"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id"))
    sku_id: Mapped[str] = mapped_column(ForeignKey("skus.id"))
    qty: Mapped[int] = mapped_column(Integer)
    picked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    short_pick: Mapped[bool] = mapped_column(Boolean, default=False)  # picking error flag

    order: Mapped["Order"] = relationship(back_populates="lines")


# ─────────────────────────── Alert ───────────────────────────
class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    warehouse_id: Mapped[str] = mapped_column(ForeignKey("warehouses.id"))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[Text] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(
        Enum("low", "medium", "high", "critical", name="alert_severity")
    )
    is_dismissed: Mapped[bool] = mapped_column(Boolean, default=False)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    warehouse: Mapped["Warehouse"] = relationship(back_populates="alerts")


# ─────────────────────────── Operational Baseline ───────────────────────────
# Used for gain-share revenue model — tracks pre-optimization KPIs
class OperationalBaseline(Base):
    __tablename__ = "operational_baselines"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    warehouse_id: Mapped[str] = mapped_column(ForeignKey("warehouses.id"))
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    # Primary gain-share metrics
    travel_time_per_pick_min: Mapped[float] = mapped_column(Float)   # minutes per pick line
    labor_hours_per_1k_orders: Mapped[float] = mapped_column(Float)  # direct labor hours
    downstream_queue_delay_min: Mapped[float] = mapped_column(Float) # packer idle time (min)
    short_pick_error_rate: Mapped[float] = mapped_column(Float)      # 0.0 – 1.0

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    warehouse: Mapped["Warehouse"] = relationship(back_populates="baselines")


# ─────────────────────────── Slotting Recommendation ───────────────────────────
class SlottingRecommendation(Base):
    __tablename__ = "slotting_recommendations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    warehouse_id: Mapped[str] = mapped_column(ForeignKey("warehouses.id"))
    sku_id: Mapped[str] = mapped_column(ForeignKey("skus.id"))
    from_zone: Mapped[str] = mapped_column(String(10))
    to_zone: Mapped[str] = mapped_column(String(10))
    expected_gain_pct: Mapped[float] = mapped_column(Float)
    labor_savings_monthly: Mapped[float] = mapped_column(Float)
    difficulty: Mapped[str] = mapped_column(String(10))
    reason: Mapped[str] = mapped_column(Text)
    applied: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


# ─────────────────────────── Algorithm Run Log ───────────────────────────
class AlgorithmRun(Base):
    __tablename__ = "algorithm_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    warehouse_id: Mapped[str] = mapped_column(ForeignKey("warehouses.id"))
    algorithm: Mapped[str] = mapped_column(String(60))  # e.g. "heuristics_miner"
    status: Mapped[str] = mapped_column(
        Enum("queued", "running", "completed", "failed", name="run_status"),
        default="queued"
    )
    result_summary: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
