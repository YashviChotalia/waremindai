"""
Granular Demand Forecasting — LSTM Neural Network (PyTorch).

Predicts demand at SKU × Warehouse × Hour granularity.
Features: time-of-day, day-of-week, weather, events, 30-day rolling avg.

Usage:
    model = DemandForecastNet(n_skus=500, n_features=12)
    engine = DemandForecastingEngine(model)
    forecasts = engine.predict(features_df, horizon_hours=24)
"""
import torch
import torch.nn as nn
import numpy as np
import pandas as pd
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass
class SkuForecast:
    sku_id: str
    warehouse_id: str
    forecast_hour: datetime
    predicted_qty: float
    confidence: float  # 0.0 – 1.0


class DemandForecastNet(nn.Module):
    """
    LSTM-based demand forecasting network.

    Input shape:  (batch, sequence_length, n_features)
    Output shape: (batch, n_skus)  — predicted demand per SKU for next timestep

    Feature vector per timestep (n_features=12):
      0  hour_of_day          (0-23, normalized)
      1  day_of_week          (0-6, normalized)
      2  is_weekend           (0 or 1)
      3  temperature_c        (normalized)
      4  precipitation_mm     (normalized)
      5  is_raining           (0 or 1)
      6  local_event_score    (0-1, e.g. festival nearby)
      7  flash_sale_flag      (0 or 1)
      8  rolling_avg_30d      (normalized, per SKU aggregated)
      9  rolling_avg_7d       (normalized)
      10 rolling_avg_1d       (normalized)
      11 reorder_urgency      (0-1, days_until_stockout normalized)
    """

    def __init__(self, n_skus: int, n_features: int = 12, hidden_size: int = 128, num_layers: int = 2):
        super().__init__()
        self.n_skus = n_skus
        self.hidden_size = hidden_size

        self.lstm = nn.LSTM(
            input_size=n_features,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.2,
        )
        self.attention = nn.MultiheadAttention(hidden_size, num_heads=4, batch_first=True)
        self.norm = nn.LayerNorm(hidden_size)
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, 256),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(256, n_skus),
            nn.ReLU(),  # Demand can't be negative
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        lstm_out, _ = self.lstm(x)                     # (batch, seq, hidden)
        attn_out, _ = self.attention(lstm_out, lstm_out, lstm_out)
        out = self.norm(lstm_out + attn_out)            # Residual connection
        return self.fc(out[:, -1, :])                   # Use last timestep only


class DemandForecastingEngine:
    """
    Wraps the neural network with:
    - Feature engineering from raw warehouse + weather data
    - Inference with uncertainty estimation (MC Dropout)
    - Result formatting for ClickHouse storage and frontend display
    """

    def __init__(self, model: DemandForecastNet, device: str = "cpu"):
        self.model = model.to(device)
        self.device = device
        self.sku_index: dict[str, int] = {}  # Maps sku_id → model output index

    def build_feature_vector(
        self,
        timestamp: datetime,
        weather: dict,          # {temperature_c, precipitation_mm, is_raining}
        local_event_score: float,
        flash_sale_flag: bool,
        rolling_avgs: dict,     # {30d, 7d, 1d} normalized rolling demand
        reorder_urgency: float,
    ) -> list[float]:
        """Build the 12-feature input vector for a single timestep."""
        return [
            timestamp.hour / 23.0,
            timestamp.weekday() / 6.0,
            float(timestamp.weekday() >= 5),
            weather.get("temperature_c", 20.0) / 50.0,
            min(weather.get("precipitation_mm", 0.0) / 50.0, 1.0),
            float(weather.get("is_raining", False)),
            local_event_score,
            float(flash_sale_flag),
            rolling_avgs.get("30d", 0.5),
            rolling_avgs.get("7d", 0.5),
            rolling_avgs.get("1d", 0.5),
            reorder_urgency,
        ]

    @torch.no_grad()
    def predict(
        self,
        feature_sequences: list[list[list[float]]],  # [batch, seq_len, n_features]
        sku_ids: list[str],
        warehouse_id: str,
        base_timestamp: datetime,
        n_mc_samples: int = 20,  # Monte Carlo Dropout for uncertainty
    ) -> list[SkuForecast]:
        """
        Run inference.
        Uses MC Dropout (forward pass with dropout enabled) to estimate confidence intervals.
        """
        x = torch.tensor(feature_sequences, dtype=torch.float32).to(self.device)

        # MC Dropout — enable dropout during inference for uncertainty estimation
        self.model.train()  # Keeps dropout active
        samples = torch.stack([self.model(x) for _ in range(n_mc_samples)])
        self.model.eval()

        mean_pred = samples.mean(dim=0)   # (batch, n_skus)
        std_pred  = samples.std(dim=0)    # Uncertainty

        forecasts = []
        for batch_idx, (means, stds) in enumerate(zip(mean_pred, std_pred)):
            for sku_idx, sku_id in enumerate(sku_ids):
                qty = max(0.0, float(means[sku_idx].item()))
                uncertainty = float(stds[sku_idx].item())
                confidence = max(0.0, 1.0 - min(uncertainty / (qty + 1e-8), 1.0))

                forecasts.append(SkuForecast(
                    sku_id=sku_id,
                    warehouse_id=warehouse_id,
                    forecast_hour=base_timestamp,
                    predicted_qty=round(qty, 2),
                    confidence=round(confidence, 3),
                ))

        return forecasts
