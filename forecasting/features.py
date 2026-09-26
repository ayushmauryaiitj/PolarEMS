from __future__ import annotations

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from typing import Dict, List, Tuple
import pandas as pd
import numpy as np

# Canonical feature lists for each forecasting target
LOAD_FEATURES: List[str] = [
    "hour", "month", "hour_sin", "hour_cos", "month_sin", "month_cos",
    "temperature_c", "lag_1_load", "lag_24_load", "rolling_24_load"
]

SOLAR_FEATURES: List[str] = [
    "hour", "month", "hour_sin", "hour_cos", "month_sin", "month_cos",
    "irradiance_w_m2", "cloud_fraction", "temperature_c",
    "lag_1_solar", "lag_24_solar"
]

WIND_FEATURES: List[str] = [
    "hour", "month", "hour_sin", "hour_cos", "month_sin", "month_cos",
    "wind_speed_ms", "wind_direction_deg", "temperature_c", "pressure_hpa",
    "lag_1_wind", "lag_24_wind"
]


def create_forecasting_features(df_raw: pd.DataFrame) -> pd.DataFrame:
    """Create leakage-safe lagged and rolling features from hourly time series.
    
    Important:
    All lag and rolling features strictly use .shift(1) or earlier to guarantee
    zero look-ahead target leakage at prediction time t.
    """
    df = df_raw.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp").reset_index(drop=True)
    
    # 1. Load Lag & Rolling Features (shifted by 1 to prevent target leakage)
    df["lag_1_load"] = df["load_kw"].shift(1)
    df["lag_24_load"] = df["load_kw"].shift(24)
    df["rolling_24_load"] = df["load_kw"].shift(1).rolling(window=24, min_periods=24).mean()
    
    # 2. Solar Lag Features
    df["lag_1_solar"] = df["solar_kw"].shift(1)
    df["lag_24_solar"] = df["solar_kw"].shift(24)
    
    # 3. Wind Lag Features
    df["lag_1_wind"] = df["wind_kw"].shift(1)
    df["lag_24_wind"] = df["wind_kw"].shift(24)
    
    # Drop the initial 24 hours containing NaNs from 24h lag window
    df_clean = df.dropna().reset_index(drop=True)
    return df_clean


def chronological_split(
    df: pd.DataFrame,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, Dict[str, Dict[str, str]]]:
    """Split dataset chronologically into Train (70%), Validation (15%), and Test (15%).
    
    Strictly preserves chronological order without shuffling to emulate realistic
    operational deployment.
    """
    n = len(df)
    train_end = int(n * train_ratio)
    val_end = int(n * (train_ratio + val_ratio))
    
    df_train = df.iloc[:train_end].copy().reset_index(drop=True)
    df_val = df.iloc[train_end:val_end].copy().reset_index(drop=True)
    df_test = df.iloc[val_end:].copy().reset_index(drop=True)
    
    split_info = {
        "train": {
            "rows": str(len(df_train)),
            "start": str(df_train["timestamp"].min()),
            "end": str(df_train["timestamp"].max())
        },
        "validation": {
            "rows": str(len(df_val)),
            "start": str(df_val["timestamp"].min()),
            "end": str(df_val["timestamp"].max())
        },
        "test": {
            "rows": str(len(df_test)),
            "start": str(df_test["timestamp"].min()),
            "end": str(df_test["timestamp"].max())
        }
    }
    return df_train, df_val, df_test, split_info
