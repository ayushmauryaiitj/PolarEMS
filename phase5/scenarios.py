"""Definition of reproducible demonstration scenarios for Phase 5 benchmarking."""

from __future__ import annotations

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from typing import Any, Dict, List
import pandas as pd
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_PATH = BASE_DIR / "data" / "processed" / "polar_microgrid_hourly.csv"

# Global Microgrid Hardware Specifications (Identical across all scenarios and strategies)
MICROGRID_CONFIG = {
    "pv_capacity_kw": 100.0,
    "wind_capacity_kw": 150.0,
    "battery_energy_kwh": 200.0,
    "battery_p_ch_max_kw": 100.0,
    "battery_p_dis_max_kw": 100.0,
    "eta_ch": 0.95,
    "eta_dis": 0.95,
    "soc_min": 0.20,
    "soc_max": 1.00,
    "diesel_p_min_kw": 0.0,
    "diesel_p_max_kw": 200.0,
    "a_fuel": 5.0,    # L/h no-load idle consumption
    "b_fuel": 0.25    # L/kWh incremental consumption slope
}


def load_scenario_profiles() -> Dict[str, Dict[str, Any]]:
    """Construct the 4 mandatory benchmark scenarios from the processed dataset."""
    df = pd.read_csv(DATASET_PATH)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    
    # 1. Scenario 1: Normal / High Renewable Operation (2020-04-13)
    s1_mask = (df["timestamp"] >= "2020-04-13 00:00:00") & (df["timestamp"] <= "2020-04-13 23:00:00")
    df_s1 = df[s1_mask].copy().reset_index(drop=True)
    
    # 2. Scenario 2: Renewable Drought / Restricted Fuel Stress-Test (2020-11-07)
    s2_mask = (df["timestamp"] >= "2020-11-07 00:00:00") & (df["timestamp"] <= "2020-11-07 23:00:00")
    df_s2 = df[s2_mask].copy().reset_index(drop=True)
    
    # 3. Scenario 3: High Demand Operation (2020-07-28 mid-winter high load)
    s3_mask = (df["timestamp"] >= "2020-07-28 00:00:00") & (df["timestamp"] <= "2020-07-28 23:00:00")
    df_s3 = df[s3_mask].copy().reset_index(drop=True)
    
    # 4. Scenario 4: Renewable Failure / Severe Storm
    # High-wind baseline (2020-04-13) with transparent 90% renewable derating (alpha_RE = 0.10)
    # representing extreme icing / blizzard turbine furling and snow-covered PV panels
    df_s4 = df_s1.copy()
    df_s4["solar_kw"] = df_s4["solar_kw"] * 0.10
    df_s4["wind_kw"] = df_s4["wind_kw"] * 0.10
    
    scenarios = {
        "Scenario 1: Normal / High Renewable": {
            "df": df_s1,
            "description": "High solar and wind availability (~2,780 kWh RE) under standard operational fuel (2,000 L).",
            "fuel_init_l": 2000.0,
            "soc_init": 0.70,
            "start_time": str(df_s1["timestamp"].iloc[0]),
            "end_time": str(df_s1["timestamp"].iloc[-1])
        },
        "Scenario 2: Renewable Drought / Restricted Fuel": {
            "df": df_s2,
            "description": "Severe sub-cut-in wind lull and low solar (~23 kWh RE) combined with restricted emergency fuel (1,000 L).",
            "fuel_init_l": 1000.0,
            "soc_init": 0.70,
            "start_time": str(df_s2["timestamp"].iloc[0]),
            "end_time": str(df_s2["timestamp"].iloc[-1])
        },
        "Scenario 3: High Demand": {
            "df": df_s3,
            "description": "Peak mid-winter space heating and scientific operations load (~5,431 kWh) with standard fuel (2,000 L).",
            "fuel_init_l": 2000.0,
            "soc_init": 0.70,
            "start_time": str(df_s3["timestamp"].iloc[0]),
            "end_time": str(df_s3["timestamp"].iloc[-1])
        },
        "Scenario 4: Renewable Failure / Storm": {
            "df": df_s4,
            "description": "Sudden 90% renewable equipment derating (alpha_RE=0.10) due to severe blizzard/icing with 1,500 L fuel.",
            "fuel_init_l": 1500.0,
            "soc_init": 0.50,
            "start_time": str(df_s4["timestamp"].iloc[0]),
            "end_time": str(df_s4["timestamp"].iloc[-1])
        }
    }
    return scenarios
