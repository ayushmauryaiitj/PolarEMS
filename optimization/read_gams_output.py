"""PolarEMS GAMS Output Parser and Physical Validation Suite.

Reads GAMS output CSV and metadata, generates canonical dispatch.csv,
computes microgrid operational summaries, and performs exhaustive physical validation.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Tuple
import pandas as pd
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent
OPT_DIR = BASE_DIR / "optimization"
INPUT_DIR = OPT_DIR / "input"
OUTPUT_DIR = OPT_DIR / "output"

RAW_DISPATCH_PATH = OUTPUT_DIR / "raw_dispatch.csv"
SOLVER_STATUS_PATH = OUTPUT_DIR / "solver_status.txt"
CANONICAL_DISPATCH_PATH = OUTPUT_DIR / "dispatch.csv"
SUMMARY_JSON_PATH = OUTPUT_DIR / "optimization_summary.json"


def parse_solver_status() -> Dict[str, Any]:
    """Parse GAMS solver status metadata."""
    if not SOLVER_STATUS_PATH.exists():
        return {"solver_status": "NOT_EXECUTED", "model_status": "UNKNOWN", "obj_val": None}
    
    status_dict = {}
    for line in SOLVER_STATUS_PATH.read_text(encoding="utf-8").splitlines():
        if "=" in line:
            k, v = line.strip().split("=", 1)
            status_dict[k.strip()] = float(v.strip()) if "." in v or v.strip().isdigit() else v.strip()
    return status_dict


def process_gams_outputs() -> Tuple[pd.DataFrame, Dict[str, Any], bool]:
    """Process GAMS raw output into canonical dispatch dataset and validate physics."""
    if not RAW_DISPATCH_PATH.exists():
        raise FileNotFoundError(f"GAMS raw output not found at: {RAW_DISPATCH_PATH}")
    
    # 1. Load forecast timestamps
    forecast_json_path = INPUT_DIR / "forecast_24h.json"
    if forecast_json_path.exists():
        with open(forecast_json_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
            timestamps = meta["timestamps"]
    else:
        timestamps = [f"t{i+1}" for i in range(24)]
        
    df_raw = pd.read_csv(RAW_DISPATCH_PATH)
    
    # 2. Build canonical dispatch dataframe
    df_dispatch = pd.DataFrame({
        "timestamp": timestamps,
        "load_forecast_kw": df_raw["load_forecast_kw"],
        "solar_forecast_kw": df_raw["solar_forecast_kw"],
        "wind_forecast_kw": df_raw["wind_forecast_kw"],
        "solar_dispatch_kw": df_raw["solar_dispatch_kw"],
        "wind_dispatch_kw": df_raw["wind_dispatch_kw"],
        "battery_charge_kw": df_raw["battery_charge_kw"],
        "battery_discharge_kw": df_raw["battery_discharge_kw"],
        "soc": df_raw["soc"],
        "diesel_kw": df_raw["diesel_kw"],
        "fuel_consumed_l": df_raw["fuel_consumed_l"],
        "fuel_remaining_l": df_raw["fuel_remaining_l"],
        "curtailment_kw": df_raw["curtailment_kw"],
        "ens_kw": df_raw["ens_kw"]
    })
    df_dispatch.to_csv(CANONICAL_DISPATCH_PATH, index=False)
    
    # 3. Perform exhaustive physical validation
    solver_meta = parse_solver_status()
    
    # Checks
    generation_sum = (
        df_dispatch["solar_dispatch_kw"] +
        df_dispatch["wind_dispatch_kw"] +
        df_dispatch["battery_discharge_kw"] +
        df_dispatch["diesel_kw"] +
        df_dispatch["ens_kw"]
    )
    demand_sum = df_dispatch["load_forecast_kw"] + df_dispatch["battery_charge_kw"]
    power_balance_error = float(np.max(np.abs(generation_sum - demand_sum)))
    
    soc_min_val = float(df_dispatch["soc"].min())
    soc_max_val = float(df_dispatch["soc"].max())
    simultaneous_batt_ops = int(((df_dispatch["battery_charge_kw"] > 1e-3) & (df_dispatch["battery_discharge_kw"] > 1e-3)).sum())
    
    checks = {
        "power_balance_passed": bool(power_balance_error < 1e-2),
        "soc_bounds_passed": bool(soc_min_val >= 0.199 and soc_max_val <= 1.001),
        "diesel_limits_passed": bool((df_dispatch["diesel_kw"] >= 0.0).all() and (df_dispatch["diesel_kw"] <= 200.01).all()),
        "fuel_non_negative": bool((df_dispatch["fuel_remaining_l"] >= 0.0).all()),
        "ens_non_negative": bool((df_dispatch["ens_kw"] >= 0.0).all()),
        "solar_dispatch_valid": bool((df_dispatch["solar_dispatch_kw"] <= df_dispatch["solar_forecast_kw"] + 1e-3).all()),
        "wind_dispatch_valid": bool((df_dispatch["wind_dispatch_kw"] <= df_dispatch["wind_forecast_kw"] + 1e-3).all()),
        "no_simultaneous_charge_discharge": bool(simultaneous_batt_ops == 0)
    }
    all_passed = all(checks.values())
    
    # 4. Generate comprehensive optimization summary JSON
    summary = {
        "total_load_energy_kwh": float(df_dispatch["load_forecast_kw"].sum()),
        "renewable_energy_available_kwh": float(df_dispatch["solar_forecast_kw"].sum() + df_dispatch["wind_forecast_kw"].sum()),
        "renewable_energy_used_kwh": float(df_dispatch["solar_dispatch_kw"].sum() + df_dispatch["wind_dispatch_kw"].sum()),
        "renewable_curtailment_kwh": float(df_dispatch["curtailment_kw"].sum()),
        "diesel_generation_kwh": float(df_dispatch["diesel_kw"].sum()),
        "diesel_fuel_consumed_litres": float(df_dispatch["fuel_consumed_l"].sum()),
        "minimum_soc": soc_min_val,
        "final_soc": float(df_dispatch["soc"].iloc[-1]),
        "total_ens_kwh": float(df_dispatch["ens_kw"].sum()),
        "hours_diesel_operated": int((df_dispatch["diesel_kw"] > 0.1).sum()),
        "optimization_objective_value": solver_meta.get("obj_val"),
        "solver_status": solver_meta.get("solver_status"),
        "model_status": solver_meta.get("model_status"),
        "validation_checks": checks,
        "all_validation_passed": all_passed
    }
    
    with open(SUMMARY_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
        
    return df_dispatch, summary, all_passed


if __name__ == "__main__":
    try:
        df, summary, passed = process_gams_outputs()
        print(f"Processed dispatch output successfully. Validation passed: {passed}")
    except Exception as e:
        print(f"Output processing note: {e}")
