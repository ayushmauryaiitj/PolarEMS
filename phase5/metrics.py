"""Performance evaluation metrics for PolarEMS microgrid benchmarking."""

from __future__ import annotations

from typing import Any, Dict
import numpy as np
import pandas as pd

# Standard Emission & Economic Parameters
CO2_EMISSION_FACTOR_KG_PER_L = 2.68    # kg CO2 per litre of diesel (EPA / IPCC standard)
FUEL_PRICE_USD_PER_L = 1.50            # USD per litre delivered to polar station
ENS_PENALTY_USD_PER_KWH = 10.00        # USD per kWh of unserved essential load
BATT_DEGRADATION_USD_PER_KWH = 0.02    # USD per kWh throughput degradation cost
RE_OM_USD_PER_KWH = 0.01               # USD per kWh renewable operation & maintenance


def calculate_microgrid_metrics(
    df_dispatch: pd.DataFrame,
    strategy_name: str,
    scenario_name: str,
    fuel_init: float,
    soc_init: float
) -> Dict[str, Any]:
    """Calculate comprehensive technical, environmental, and economic metrics."""
    load_total = float(df_dispatch["load_kw"].sum())
    re_avail = float((df_dispatch["solar_avail_kw"] + df_dispatch["wind_avail_kw"]).sum())
    re_used = float((df_dispatch["solar_dispatch_kw"] + df_dispatch["wind_dispatch_kw"]).sum())
    curtailment = float(df_dispatch["curtailment_kw"].sum())
    
    diesel_gen = float(df_dispatch["diesel_kw"].sum())
    fuel_consumed = float(df_dispatch["fuel_consumed_l"].sum())
    fuel_remaining = float(df_dispatch["fuel_remaining_l"].iloc[-1])
    
    ens_total = float(df_dispatch["ens_kw"].sum())
    hours_diesel = int((df_dispatch["diesel_kw"] > 0.1).sum())
    
    soc_min = float(df_dispatch["soc"].min())
    soc_max = float(df_dispatch["soc"].max())
    soc_final = float(df_dispatch["soc"].iloc[-1])
    
    batt_throughput = float((df_dispatch["battery_charge_kw"] + df_dispatch["battery_discharge_kw"]).sum())
    
    # Renewable penetration (%)
    re_penetration_pct = (re_used / load_total * 100.0) if load_total > 0 else 0.0
    
    # CO2 Emissions (kg)
    co2_emissions_kg = fuel_consumed * CO2_EMISSION_FACTOR_KG_PER_L
    
    # Operating Cost (USD)
    operating_cost_usd = (
        fuel_consumed * FUEL_PRICE_USD_PER_L +
        ens_total * ENS_PENALTY_USD_PER_KWH +
        batt_throughput * BATT_DEGRADATION_USD_PER_KWH +
        re_used * RE_OM_USD_PER_KWH
    )
    
    return {
        "scenario": scenario_name,
        "strategy": strategy_name,
        "total_load_kwh": round(load_total, 2),
        "re_available_kwh": round(re_avail, 2),
        "re_used_kwh": round(re_used, 2),
        "re_curtailment_kwh": round(curtailment, 2),
        "re_penetration_pct": round(re_penetration_pct, 2),
        "diesel_generation_kwh": round(diesel_gen, 2),
        "diesel_fuel_consumed_l": round(fuel_consumed, 2),
        "diesel_fuel_remaining_l": round(fuel_remaining, 2),
        "hours_diesel_operated": hours_diesel,
        "ens_kwh": round(ens_total, 2),
        "min_soc_pct": round(soc_min * 100.0, 2),
        "final_soc_pct": round(soc_final * 100.0, 2),
        "battery_throughput_kwh": round(batt_throughput, 2),
        "co2_emissions_kg": round(co2_emissions_kg, 2),
        "operating_cost_usd": round(operating_cost_usd, 2)
    }
