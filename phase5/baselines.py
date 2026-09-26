"""Implementation of baseline energy management strategies (Diesel-Only & Rule-Based Hybrid)."""

from __future__ import annotations

import pandas as pd
import numpy as np
from typing import Dict, Any

from phase5.scenarios import MICROGRID_CONFIG


def simulate_diesel_only(df_scenario: pd.DataFrame, fuel_init: float) -> pd.DataFrame:
    """Strategy A: Diesel-Only Baseline.
    
    Meets load purely using diesel generation up to 200 kW, subject to fuel inventory.
    No renewables or battery storage are utilized.
    """
    cfg = MICROGRID_CONFIG
    n = len(df_scenario)
    
    records = []
    fuel_rem = fuel_init
    
    for i in range(n):
        row = df_scenario.iloc[i]
        load = float(row["load_kw"])
        
        # Diesel dispatches up to max power or remaining load
        p_diesel_desired = min(cfg["diesel_p_max_kw"], load)
        
        # Calculate fuel needed
        if p_diesel_desired > 0:
            fuel_needed = cfg["a_fuel"] + cfg["b_fuel"] * p_diesel_desired
        else:
            fuel_needed = 0.0
            
        if fuel_rem >= fuel_needed and fuel_needed > 0:
            p_diesel = p_diesel_desired
            fuel_consumed = fuel_needed
            fuel_rem -= fuel_consumed
        elif fuel_rem > 0 and fuel_needed > 0:
            # Partial fuel remaining
            p_diesel = max(0.0, (fuel_rem - cfg["a_fuel"]) / cfg["b_fuel"])
            p_diesel = min(p_diesel, p_diesel_desired)
            fuel_consumed = fuel_rem
            fuel_rem = 0.0
        else:
            p_diesel = 0.0
            fuel_consumed = 0.0
            fuel_rem = 0.0
            
        ens = max(0.0, load - p_diesel)
        
        records.append({
            "timestamp": row["timestamp"],
            "load_kw": load,
            "solar_avail_kw": float(row["solar_kw"]),
            "wind_avail_kw": float(row["wind_kw"]),
            "solar_dispatch_kw": 0.0,
            "wind_dispatch_kw": 0.0,
            "curtailment_kw": float(row["solar_kw"] + row["wind_kw"]),
            "battery_charge_kw": 0.0,
            "battery_discharge_kw": 0.0,
            "soc": 0.0,
            "diesel_kw": p_diesel,
            "fuel_consumed_l": fuel_consumed,
            "fuel_remaining_l": fuel_rem,
            "ens_kw": ens
        })
        
    return pd.DataFrame(records)


def simulate_rule_based_hybrid(df_scenario: pd.DataFrame, fuel_init: float, soc_init: float) -> pd.DataFrame:
    """Strategy B: Rule-Based Hybrid Baseline.
    
    Priority Logic:
    1. Renewable power (PV + Wind) directly serves station load.
    2. Renewable surplus charges BESS (up to P_ch_max and SOC=1.0); excess is curtailed.
    3. Renewable deficit is supplied by BESS discharging (up to P_dis_max and down to SOC=0.20).
    4. Remaining deficit starts diesel generator (up to P_diesel_max=200 kW) subject to fuel inventory.
    5. Any residual deficit is recorded as Energy Not Served (ENS).
    """
    cfg = MICROGRID_CONFIG
    n = len(df_scenario)
    
    records = []
    soc = soc_init
    fuel_rem = fuel_init
    
    for i in range(n):
        row = df_scenario.iloc[i]
        load = float(row["load_kw"])
        pv_avail = float(row["solar_kw"])
        wind_avail = float(row["wind_kw"])
        re_total = pv_avail + wind_avail
        
        # 1. Renewable directly serves load
        re_used = min(load, re_total)
        pv_dispatch = (pv_avail / re_total * re_used) if re_total > 0 else 0.0
        wind_dispatch = (wind_avail / re_total * re_used) if re_total > 0 else 0.0
        
        re_surplus = re_total - re_used
        load_deficit = load - re_used
        
        p_ch = 0.0
        p_dis = 0.0
        curtailment = 0.0
        
        # 2. Handle Surplus -> Charge Battery
        if re_surplus > 0:
            max_energy_room = (cfg["soc_max"] - soc) * cfg["battery_energy_kwh"] / cfg["eta_ch"]
            max_ch_power = min(cfg["battery_p_ch_max_kw"], max_energy_room)
            p_ch = min(re_surplus, max_ch_power)
            
            # Additional PV/wind dispatched into battery
            re_to_batt = p_ch
            pv_dispatch += (pv_avail / re_total * re_to_batt) if re_total > 0 else 0.0
            wind_dispatch += (wind_avail / re_total * re_to_batt) if re_total > 0 else 0.0
            
            curtailment = re_total - (pv_dispatch + wind_dispatch)
            soc += (cfg["eta_ch"] * p_ch / cfg["battery_energy_kwh"])
            
        # 3. Handle Deficit -> Discharge Battery
        elif load_deficit > 0:
            max_energy_avail = (soc - cfg["soc_min"]) * cfg["battery_energy_kwh"] * cfg["eta_dis"]
            max_dis_power = min(cfg["battery_p_dis_max_kw"], max_energy_avail)
            p_dis = min(load_deficit, max_dis_power)
            
            soc -= (p_dis / (cfg["eta_dis"] * cfg["battery_energy_kwh"]))
            load_deficit -= p_dis
            
        # 4. Handle Remaining Deficit -> Diesel Generation
        p_diesel = 0.0
        fuel_consumed = 0.0
        if load_deficit > 0 and fuel_rem > 0:
            p_diesel_desired = min(cfg["diesel_p_max_kw"], load_deficit)
            fuel_needed = cfg["a_fuel"] + cfg["b_fuel"] * p_diesel_desired
            
            if fuel_rem >= fuel_needed:
                p_diesel = p_diesel_desired
                fuel_consumed = fuel_needed
                fuel_rem -= fuel_consumed
            else:
                p_diesel = max(0.0, (fuel_rem - cfg["a_fuel"]) / cfg["b_fuel"])
                p_diesel = min(p_diesel, p_diesel_desired)
                fuel_consumed = fuel_rem
                fuel_rem = 0.0
                
            load_deficit -= p_diesel
            
        ens = max(0.0, load_deficit)
        soc = float(np.clip(soc, cfg["soc_min"], cfg["soc_max"]))
        
        records.append({
            "timestamp": row["timestamp"],
            "load_kw": load,
            "solar_avail_kw": pv_avail,
            "wind_avail_kw": wind_avail,
            "solar_dispatch_kw": pv_dispatch,
            "wind_dispatch_kw": wind_dispatch,
            "curtailment_kw": max(0.0, curtailment),
            "battery_charge_kw": p_ch,
            "battery_discharge_kw": p_dis,
            "soc": soc,
            "diesel_kw": p_diesel,
            "fuel_consumed_l": fuel_consumed,
            "fuel_remaining_l": fuel_rem,
            "ens_kw": ens
        })
        
    return pd.DataFrame(records)
