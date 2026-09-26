"""PolarEMS GAMS Input Preparation Adapter.

Extracts a 24-hour test window from the processed dataset and generates true
multi-step predictions using the saved Phase 3 forecasting models (Random Forest).
Outputs GAMS include file (optimization/input/forecast_data.inc) and JSON metadata.
"""

from __future__ import annotations

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import json
from typing import Dict, Any, Tuple
import joblib
import numpy as np
import pandas as pd

from forecasting.features import (
    LOAD_FEATURES,
    SOLAR_FEATURES,
    WIND_FEATURES,
    create_forecasting_features
)

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_PATH = BASE_DIR / "data" / "processed" / "polar_microgrid_hourly.csv"
MODELS_DIR = BASE_DIR / "models"
INPUT_DIR = BASE_DIR / "optimization" / "input"


def load_forecasting_models() -> Tuple[Any, Any, Any]:
    """Load serialized Phase 3 ML forecasting models."""
    load_pkg = joblib.load(MODELS_DIR / "load_model.joblib")
    solar_pkg = joblib.load(MODELS_DIR / "solar_model.joblib")
    wind_pkg = joblib.load(MODELS_DIR / "wind_model.joblib")
    return load_pkg["model"], solar_pkg["model"], wind_pkg["model"]


def generate_24h_gams_input(start_idx: int = 7440, horizon_hours: int = 24) -> Dict[str, Any]:
    """Generate 24-hour forecast profiles using ML models and format for GAMS."""
    INPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # 1. Load dataset & engineer lag features
    df_raw = pd.read_csv(DATASET_PATH)
    df_features = create_forecasting_features(df_raw)
    
    # Ensure window is within test set range
    if start_idx + horizon_hours > len(df_features):
        start_idx = len(df_features) - horizon_hours
        
    df_window = df_features.iloc[start_idx : start_idx + horizon_hours].copy().reset_index(drop=True)
    
    # 2. Generate multi-step ML forecasts
    load_model, solar_model, wind_model = load_forecasting_models()
    
    load_fc = np.maximum(0.0, load_model.predict(df_window[LOAD_FEATURES]))
    solar_fc = np.maximum(0.0, solar_model.predict(df_window[SOLAR_FEATURES]))
    wind_fc = np.maximum(0.0, wind_model.predict(df_window[WIND_FEATURES]))
    
    timestamps = df_window["timestamp"].tolist()
    
    # 3. Write GAMS .inc include file with explicit assignments
    inc_path = INPUT_DIR / "forecast_data.inc"
    inc_lines = [
        "* GAMS Input Data Include File: 24-Hour Predictive Forecasts",
        f"* Generated from PolarEMS ML Models for window starting {timestamps[0]}",
        ""
    ]
    
    for i in range(horizon_hours):
        t_label = f"t{i+1}"
        inc_lines.append(f"P_load('{t_label}') = {load_fc[i]:.4f} ;")
        inc_lines.append(f"P_pv_avail('{t_label}') = {solar_fc[i]:.4f} ;")
        inc_lines.append(f"P_wind_avail('{t_label}') = {wind_fc[i]:.4f} ;")
        
    inc_path.write_text("\n".join(inc_lines) + "\n", encoding="utf-8")
    print(f"Generated GAMS input include file: {inc_path}")
    
    # 4. Save JSON representation with timestamps
    json_path = INPUT_DIR / "forecast_24h.json"
    str_timestamps = [str(ts) for ts in timestamps]
    forecast_dict = {
        "start_time": str_timestamps[0],
        "end_time": str_timestamps[-1],
        "horizon_hours": horizon_hours,
        "timestamps": str_timestamps,
        "load_forecast_kw": [round(float(x), 4) for x in load_fc],
        "solar_forecast_kw": [round(float(x), 4) for x in solar_fc],
        "wind_forecast_kw": [round(float(x), 4) for x in wind_fc]
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(forecast_dict, f, indent=2)
    print(f"Saved forecast JSON to: {json_path}")
    
    return forecast_dict


if __name__ == "__main__":
    generate_24h_gams_input()
