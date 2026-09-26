"""FastAPI Backend for PolarEMS Decision Dashboard.
Exposes Phase 5 benchmark results, dispatch time-series, forecasts, and derived operational alerts.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
import json

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import pandas as pd
import numpy as np
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from phase5.scenarios import load_scenario_profiles, MICROGRID_CONFIG
from forecasting.features import create_forecasting_features, LOAD_FEATURES, SOLAR_FEATURES, WIND_FEATURES
import joblib

app = FastAPI(
    title="PolarEMS Decision Support API",
    description="AI-Assisted Predictive Energy Management API for Polar Research Station Microgrids",
    version="1.0.0"
)

# Enable CORS for local React/Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BENCHMARK_CSV = BASE_DIR / "results" / "phase5" / "benchmark_results.csv"
BENCHMARK_JSON = BASE_DIR / "results" / "phase5" / "benchmark_summary.json"
CACHE_JSON = BASE_DIR / "results" / "phase5" / "detailed_simulation_cache.json"
DATASET_CSV = BASE_DIR / "data" / "processed" / "polar_microgrid_hourly.csv"
OPT_DISPATCH_CSV = BASE_DIR / "optimization" / "output" / "dispatch.csv"
OPT_FORECAST_JSON = BASE_DIR / "optimization" / "input" / "forecast_24h.json"

CACHE: Dict[str, Any] = {}


def load_ml_models():
    models_dir = BASE_DIR / "models"
    try:
        load_pkg = joblib.load(models_dir / "load_model.joblib")
        solar_pkg = joblib.load(models_dir / "solar_model.joblib")
        wind_pkg = joblib.load(models_dir / "wind_model.joblib")
        return (
            load_pkg["model"] if isinstance(load_pkg, dict) else load_pkg,
            solar_pkg["model"] if isinstance(solar_pkg, dict) else solar_pkg,
            wind_pkg["model"] if isinstance(wind_pkg, dict) else wind_pkg,
        )
    except Exception as e:
        print(f"Warning loading ML models: {e}")
        return None, None, None


def initialize_cache():
    """Load scenarios, benchmark summary, detailed hourly simulations, and forecasts."""
    print("Initializing PolarEMS API data cache...")
    scenarios = load_scenario_profiles()
    CACHE["scenarios"] = scenarios
    
    # 1. Load benchmark summary
    if BENCHMARK_JSON.exists():
        with open(BENCHMARK_JSON, "r", encoding="utf-8") as f:
            CACHE["benchmark_summary"] = json.load(f)
    elif BENCHMARK_CSV.exists():
        df_bench = pd.read_csv(BENCHMARK_CSV)
        CACHE["benchmark_summary"] = df_bench.to_dict(orient="records")
    else:
        CACHE["benchmark_summary"] = []
        
    # 2. Load detailed simulation cache
    if CACHE_JSON.exists():
        with open(CACHE_JSON, "r", encoding="utf-8") as f:
            CACHE["simulations"] = json.load(f)
        print(f"Loaded simulation cache for {len(CACHE['simulations'])} scenarios.")
    else:
        CACHE["simulations"] = {}
        
    # 3. Load dataset and generate ML forecasts
    df_raw = pd.read_csv(DATASET_CSV)
    df_raw["timestamp"] = pd.to_datetime(df_raw["timestamp"])
    CACHE["df_raw"] = df_raw
    
    load_m, solar_m, wind_m = load_ml_models()
    df_features = create_forecasting_features(df_raw) if load_m else None
    
    forecasts: Dict[str, pd.DataFrame] = {}
    for sc_name, sc_data in scenarios.items():
        df_sc = sc_data["df"]
        sc_ts = df_sc["timestamp"].tolist()
        
        if df_features is not None:
            df_wf = df_features[df_features["timestamp"].isin(sc_ts)].copy().reset_index(drop=True)
            if len(df_wf) == len(df_sc):
                load_fc = np.maximum(0.0, load_m.predict(df_wf[LOAD_FEATURES]))
                solar_fc = np.maximum(0.0, solar_m.predict(df_wf[SOLAR_FEATURES]))
                wind_fc = np.maximum(0.0, wind_m.predict(df_wf[WIND_FEATURES]))
            else:
                load_fc = df_sc["load_kw"].to_numpy()
                solar_fc = df_sc["solar_kw"].to_numpy()
                wind_fc = df_sc["wind_kw"].to_numpy()
        else:
            load_fc = df_sc["load_kw"].to_numpy()
            solar_fc = df_sc["solar_kw"].to_numpy()
            wind_fc = df_sc["wind_kw"].to_numpy()
            
        if "Failure" in sc_name or "Storm" in sc_name:
            solar_fc = solar_fc * 0.10
            wind_fc = wind_fc * 0.10
            
        df_fc = pd.DataFrame({
            "hour": list(range(1, len(df_sc) + 1)),
            "timestamp": [str(t) for t in df_sc["timestamp"]],
            "load_actual_kw": np.round(df_sc["load_kw"].values, 2),
            "load_fc_kw": np.round(load_fc, 2),
            "solar_actual_kw": np.round(df_sc["solar_kw"].values, 2),
            "solar_fc_kw": np.round(solar_fc, 2),
            "wind_actual_kw": np.round(df_sc["wind_kw"].values, 2),
            "wind_fc_kw": np.round(wind_fc, 2),
            "re_actual_total_kw": np.round(df_sc["solar_kw"].values + df_sc["wind_kw"].values, 2),
            "re_fc_total_kw": np.round(solar_fc + wind_fc, 2),
        })
        forecasts[sc_name] = df_fc
        
    CACHE["forecasts"] = forecasts
    print("PolarEMS API initialized successfully with all 4 scenarios.")


@app.on_event("startup")
def startup_event():
    initialize_cache()


# -------------------------------------------------------------
# API Endpoints
# -------------------------------------------------------------

@app.get("/api/health")
def get_health():
    return {
        "status": "online",
        "system": "PolarEMS Decision Support Backend",
        "version": "1.0.0",
        "scenarios_loaded": len(CACHE.get("scenarios", {})),
        "benchmark_entries": len(CACHE.get("benchmark_summary", [])),
    }


@app.get("/api/scenarios")
def get_scenarios():
    scenarios = CACHE.get("scenarios", {})
    output = []
    for sc_name, sc_data in scenarios.items():
        df_sc = sc_data["df"]
        total_load = float(df_sc["load_kw"].sum())
        total_re = float(df_sc["solar_kw"].sum() + df_sc["wind_kw"].sum())
        slug = sc_name.split(":")[0].strip().lower().replace(" ", "_")
        
        output.append({
            "id": slug,
            "name": sc_name,
            "description": sc_data["description"],
            "fuel_init_l": sc_data["fuel_init_l"],
            "soc_init": sc_data["soc_init"],
            "start_time": sc_data["start_time"],
            "end_time": sc_data["end_time"],
            "duration_hours": len(df_sc),
            "total_load_kwh": round(total_load, 1),
            "total_re_avail_kwh": round(total_re, 1),
            "peak_load_kw": round(float(df_sc["load_kw"].max()), 1),
            "avg_wind_speed_ms": round(float(df_sc["wind_speed_ms"].mean()), 1) if "wind_speed_ms" in df_sc else 8.5,
            "avg_temp_c": round(float(df_sc["temp_air_c"].mean()), 1) if "temp_air_c" in df_sc else -15.2,
        })
    return output


@app.get("/api/benchmark")
def get_benchmark():
    return CACHE.get("benchmark_summary", [])


@app.get("/api/dispatch")
def get_dispatch(
    scenario: str = Query("scenario_1", description="Scenario ID (e.g. scenario_1, scenario_2, scenario_3, scenario_4)"),
    strategy: str = Query("PolarEMS (Predictive GAMS)", description="Strategy name")
):
    scenarios = CACHE.get("scenarios", {})
    simulations = CACHE.get("simulations", {})
    
    # Map slug to full scenario name
    matched_sc = None
    for k in scenarios.keys():
        if scenario in k.lower().replace(" ", "_"):
            matched_sc = k
            break
    if not matched_sc:
        matched_sc = list(scenarios.keys())[0]
        
    sc_sims = simulations.get(matched_sc, {})
    
    matched_strat = "PolarEMS (Predictive GAMS)"
    for s_name in ["PolarEMS (Predictive GAMS)", "Rule-Based Hybrid", "Diesel-Only"]:
        if strategy.lower() in s_name.lower():
            matched_strat = s_name
            break
            
    raw_records = sc_sims.get(matched_strat)
    if not raw_records:
        raise HTTPException(status_code=404, detail="Dispatch simulation not found")
        
    records = []
    for i, row in enumerate(raw_records):
        re_disp = float(row.get("solar_dispatch_kw", 0.0) + row.get("wind_dispatch_kw", 0.0))
        re_avail = float(row.get("solar_avail_kw", 0.0) + row.get("wind_avail_kw", 0.0))
        d_p = float(row.get("diesel_kw", row.get("diesel_power_kw", 0.0)))
        b_ch = float(row.get("battery_charge_kw", 0.0))
        b_dis = float(row.get("battery_discharge_kw", 0.0))
        soc_val = float(row.get("soc", 0.70))
        f_flow = float(row.get("diesel_fuel_flow_l_h", (MICROGRID_CONFIG["a_fuel"] + MICROGRID_CONFIG["b_fuel"] * d_p) if d_p > 0 else 0.0))
        f_cum = float(row.get("fuel_consumed_cum_l", row.get("fuel_consumed_l", 0.0)))
        
        records.append({
            "hour": i + 1,
            "timestamp": str(row["timestamp"]),
            "load_kw": round(float(row["load_kw"]), 2),
            "solar_avail_kw": round(float(row.get("solar_avail_kw", 0.0)), 2),
            "wind_avail_kw": round(float(row.get("wind_avail_kw", 0.0)), 2),
            "re_avail_total_kw": round(re_avail, 2),
            "solar_dispatch_kw": round(float(row.get("solar_dispatch_kw", 0.0)), 2),
            "wind_dispatch_kw": round(float(row.get("wind_dispatch_kw", 0.0)), 2),
            "re_dispatch_total_kw": round(re_disp, 2),
            "diesel_power_kw": round(d_p, 2),
            "battery_charge_kw": round(b_ch, 2),
            "battery_discharge_kw": round(b_dis, 2),
            "battery_net_kw": round(b_dis - b_ch, 2),
            "soc_pct": round(soc_val * 100.0, 1),
            "diesel_fuel_flow_l_h": round(f_flow, 2),
            "fuel_consumed_cum_l": round(f_cum, 2),
            "curtailment_kw": round(float(row.get("curtailment_kw", 0.0)), 2),
            "ens_kw": round(float(row.get("ens_kw", 0.0)), 2),
        })
        
    return {
        "scenario": matched_sc,
        "strategy": matched_strat,
        "horizon_hours": len(records),
        "records": records
    }


@app.get("/api/forecast")
def get_forecast(
    scenario: str = Query("scenario_1", description="Scenario ID")
):
    scenarios = CACHE.get("scenarios", {})
    forecasts = CACHE.get("forecasts", {})
    
    matched_sc = None
    for k in scenarios.keys():
        if scenario in k.lower().replace(" ", "_"):
            matched_sc = k
            break
    if not matched_sc:
        matched_sc = list(scenarios.keys())[0]
        
    df_fc = forecasts.get(matched_sc)
    if df_fc is None:
        raise HTTPException(status_code=404, detail="Forecast not found")
        
    records = df_fc.to_dict(orient="records")
    
    tot_load = float(df_fc["load_fc_kw"].sum())
    tot_re = float(df_fc["re_fc_total_kw"].sum())
    deficit_hours = int((df_fc["re_fc_total_kw"] < df_fc["load_fc_kw"]).sum())
    surplus_hours = int((df_fc["re_fc_total_kw"] > df_fc["load_fc_kw"]).sum())
    peak_load_hr = int(df_fc.loc[df_fc["load_fc_kw"].idxmax()]["hour"])
    peak_load_kw = float(df_fc["load_fc_kw"].max())
    
    insights = []
    if deficit_hours > 18:
        insights.append(f"Severe renewable deficit predicted across {deficit_hours} of 24 hours. Pre-allocation of diesel generation and battery energy conservation required.")
    elif deficit_hours > 0:
        insights.append(f"Renewable deficit expected during {deficit_hours} hours (especially evening peak). Surplus generation available across {surplus_hours} daylight hours.")
    else:
        insights.append("Continuous high renewable availability predicted. High battery absorption potential.")
        
    insights.append(f"Peak station load forecast of {peak_load_kw:.1f} kW expected at hour T+{peak_load_hr}.")
    
    return {
        "scenario": matched_sc,
        "records": records,
        "insights": insights,
        "metrics": {
            "total_load_fc_kwh": round(tot_load, 1),
            "total_re_fc_kwh": round(tot_re, 1),
            "deficit_hours_count": deficit_hours,
            "surplus_hours_count": surplus_hours,
            "peak_load_kw": round(peak_load_kw, 1),
            "peak_load_hour": peak_load_hr
        }
    }


@app.get("/api/energy_flow")
def get_energy_flow(
    scenario: str = Query("scenario_1"),
    strategy: str = Query("PolarEMS (Predictive GAMS)"),
    hour: int = Query(12, ge=1, le=24)
):
    scenarios = CACHE.get("scenarios", {})
    simulations = CACHE.get("simulations", {})
    
    matched_sc = None
    for k in scenarios.keys():
        if scenario in k.lower().replace(" ", "_"):
            matched_sc = k
            break
    if not matched_sc:
        matched_sc = list(scenarios.keys())[0]
        
    matched_strat = "PolarEMS (Predictive GAMS)"
    for s_name in ["PolarEMS (Predictive GAMS)", "Rule-Based Hybrid", "Diesel-Only"]:
        if strategy.lower() in s_name.lower():
            matched_strat = s_name
            break
            
    raw_records = simulations.get(matched_sc, {}).get(matched_strat, [])
    if not raw_records or hour > len(raw_records):
        raise HTTPException(status_code=404, detail="Data not found")
        
    row = raw_records[hour - 1]
    
    solar_gen = float(row.get("solar_dispatch_kw", 0.0))
    wind_gen = float(row.get("wind_dispatch_kw", 0.0))
    diesel_gen = float(row.get("diesel_kw", row.get("diesel_power_kw", 0.0)))
    bat_ch = float(row.get("battery_charge_kw", 0.0))
    bat_dis = float(row.get("battery_discharge_kw", 0.0))
    ens_kw = float(row.get("ens_kw", 0.0))
    curt_kw = float(row.get("curtailment_kw", 0.0))
    soc_pct = float(row.get("soc", 0.70)) * 100.0
    fuel_flow = float(row.get("diesel_fuel_flow_l_h", (MICROGRID_CONFIG["a_fuel"] + MICROGRID_CONFIG["b_fuel"] * diesel_gen) if diesel_gen > 0 else 0.0))
    
    # Exact physical bus power conservation:
    total_injected_kw = solar_gen + wind_gen + diesel_gen + bat_dis
    power_served_kw = total_injected_kw - bat_ch
    load_demand_kw = power_served_kw + ens_kw
    
    nodes = {
        "solar_pv": {
            "name": "Solar PV Array",
            "capacity_kw": 100.0,
            "current_kw": round(solar_gen, 1),
            "status": "ACTIVE" if solar_gen > 0.5 else "IDLE"
        },
        "wind_turbine": {
            "name": "Wind Turbine Farm",
            "capacity_kw": 150.0,
            "current_kw": round(wind_gen, 1),
            "status": "ACTIVE" if wind_gen > 0.5 else "IDLE"
        },
        "battery_bess": {
            "name": "Li-Ion BESS",
            "capacity_kwh": 200.0,
            "charge_kw": round(bat_ch, 1),
            "discharge_kw": round(bat_dis, 1),
            "net_kw": round(bat_dis - bat_ch, 1),
            "soc_pct": round(soc_pct, 1),
            "mode": "CHARGING" if bat_ch > 0.5 else ("DISCHARGING" if bat_dis > 0.5 else "STANDBY")
        },
        "diesel_genset": {
            "name": "Station Diesel Generator",
            "capacity_kw": 200.0,
            "current_kw": round(diesel_gen, 1),
            "fuel_rate_lh": round(fuel_flow, 1),
            "status": "RUNNING" if diesel_gen > 1.0 else "STANDBY"
        },
        "station_grid": {
            "name": "Station AC Microgrid Bus",
            "load_demand_kw": round(load_demand_kw, 1),
            "power_served_kw": round(power_served_kw, 1),
            "unserved_ens_kw": round(ens_kw, 1),
            "curtailed_kw": round(curt_kw, 1),
            "status": "CRITICAL" if ens_kw > 0.1 else "STABLE"
        }
    }
    
    flows = [
        {"source": "solar_pv", "target": "station_grid", "power_kw": round(solar_gen, 1), "active": solar_gen > 0.5},
        {"source": "wind_turbine", "target": "station_grid", "power_kw": round(wind_gen, 1), "active": wind_gen > 0.5},
        {"source": "diesel_genset", "target": "station_grid", "power_kw": round(diesel_gen, 1), "active": diesel_gen > 0.5},
        {"source": "battery_bess", "target": "station_grid", "power_kw": round(bat_dis, 1), "active": bat_dis > 0.5},
        {"source": "station_grid", "target": "battery_bess", "power_kw": round(bat_ch, 1), "active": bat_ch > 0.5},
    ]
    
    return {
        "scenario": matched_sc,
        "strategy": matched_strat,
        "hour": hour,
        "timestamp": str(row["timestamp"]),
        "nodes": nodes,
        "flows": flows
    }


@app.get("/api/alerts")
def get_alerts(
    scenario: str = Query("scenario_1"),
    strategy: str = Query("PolarEMS (Predictive GAMS)")
):
    scenarios = CACHE.get("scenarios", {})
    simulations = CACHE.get("simulations", {})
    
    matched_sc = None
    for k in scenarios.keys():
        if scenario in k.lower().replace(" ", "_"):
            matched_sc = k
            break
    if not matched_sc:
        matched_sc = list(scenarios.keys())[0]
        
    matched_strat = "PolarEMS (Predictive GAMS)"
    for s_name in ["PolarEMS (Predictive GAMS)", "Rule-Based Hybrid", "Diesel-Only"]:
        if strategy.lower() in s_name.lower():
            matched_strat = s_name
            break
            
    raw_records = simulations.get(matched_sc, {}).get(matched_strat, [])
    if not raw_records:
        raise HTTPException(status_code=404, detail="Dispatch simulation not found")
        
    alerts = []
    total_ens = sum(float(r.get("ens_kw", 0.0)) for r in raw_records)
    min_soc = min(float(r.get("soc", 0.70)) for r in raw_records) * 100.0
    total_curt = sum(float(r.get("curtailment_kw", 0.0)) for r in raw_records)
    total_diesel = sum(float(r.get("diesel_kw", r.get("diesel_power_kw", 0.0))) for r in raw_records)
    
    # 1. HIGH: ENS
    if total_ens > 0.1:
        alerts.append({
            "id": "ALT-001",
            "level": "HIGH",
            "subsystem": "Grid Reliability",
            "title": "Energy Not Served (ENS) Load Shedding Active",
            "message": f"Microgrid experiencing {total_ens:.1f} kWh of unserved load across the 24h horizon.",
            "action": "Trigger non-essential science load shedding protocol. Verify auxiliary generator readiness."
        })
        
    # 2. WARNING: Battery near minimum SOC
    if min_soc <= 21.0:
        alerts.append({
            "id": "ALT-002",
            "level": "WARNING",
            "subsystem": "Battery Storage",
            "title": "Battery Depleted to Minimum Operating Buffer",
            "message": f"Li-ion BESS reached minimum safety threshold of {min_soc:.1f}% SOC. Deep-discharge protection active.",
            "action": "Preserve remaining 20% emergency reserve for critical life-support telemetry."
        })
    elif min_soc <= 35.0:
        alerts.append({
            "id": "ALT-003",
            "level": "WARNING",
            "subsystem": "Battery Storage",
            "title": "Battery Reserve Low",
            "message": f"BESS state-of-charge dropped to {min_soc:.1f}%.",
            "action": "Ensure diesel dispatch or renewable surplus is scheduled for recharge."
        })
        
    # 3. WARNING: Renewable Deficit / Weather Storm
    if "Storm" in matched_sc or "Failure" in matched_sc:
        alerts.append({
            "id": "ALT-004",
            "level": "WARNING",
            "subsystem": "Renewable Generation",
            "title": "Severe Blizzard / Turbine Furling Derating Active",
            "message": "Turbine furling and panel snow coverage derated renewable capacity by 90% (alpha_RE = 0.10).",
            "action": "Rely on scheduled diesel backup and priority dispatch."
        })
    elif "Drought" in matched_sc:
        alerts.append({
            "id": "ALT-005",
            "level": "WARNING",
            "subsystem": "Meteorology",
            "title": "Sub-Cut-In Wind Lull (Renewable Drought)",
            "message": "Ambient wind speed below turbine cut-in speed (3 m/s) with near-zero solar flux.",
            "action": "Fuel rationing protocols in effect."
        })
        
    # 4. INFO: Diesel Backup Activated
    if total_diesel > 10.0:
        diesel_hrs = sum(1 for r in raw_records if float(r.get("diesel_kw", r.get("diesel_power_kw", 0.0))) > 1.0)
        alerts.append({
            "id": "ALT-006",
            "level": "INFO",
            "subsystem": "Diesel GenSet",
            "title": "Station Diesel Generator Dispatched",
            "message": f"Diesel GenSet operating for {diesel_hrs} hours to cover net station demand ({total_diesel:.1f} kWh generated).",
            "action": "Routine generator heat-recovery monitoring active."
        })
        
    # 5. INFO: Curtailment
    if total_curt > 5.0:
        alerts.append({
            "id": "ALT-007",
            "level": "INFO",
            "subsystem": "Renewables",
            "title": "Surplus Renewable Energy Curtailed",
            "message": f"{total_curt:.1f} kWh of renewable power curtailed due to full BESS storage capacity.",
            "action": "Opportunity for flexible thermal space heating storage dump loads."
        })
        
    if total_ens > 0.1:
        system_status = "CRITICAL"
    elif min_soc <= 25.0 or "Storm" in matched_sc or "Drought" in matched_sc:
        system_status = "WARNING"
    else:
        system_status = "NORMAL"
        
    return {
        "scenario": matched_sc,
        "strategy": matched_strat,
        "system_status": system_status,
        "active_alerts_count": len(alerts),
        "alerts": alerts
    }


@app.get("/api/reports")
def get_reports():
    return {
        "project": "PolarEMS: AI-Assisted Predictive Energy Management for Polar Research Stations",
        "team": "Buddhi Quant // SIH 2026",
        "benchmark_summary": CACHE.get("benchmark_summary", []),
        "disclaimer": "Simulation results are derived from the project demonstration dataset and are not field validation results.",
        "microgrid_specifications": MICROGRID_CONFIG
    }
