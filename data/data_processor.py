"""PolarEMS Offline Data Processing and Feature Engineering Pipeline.

Processes raw meteorological data (met_data.h5) and historical Antarctic station
electricity statistics (SOE_SFU/indicator_59.csv) to generate a clean, validated
hourly dataset for microgrid AI/ML forecasting and digital simulation.

Outputs:
- data/processed/polar_microgrid_hourly.csv
- data/processed/data_quality_report.json
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

import h5py
import numpy as np
import pandas as pd


# Constants and Paths
BASE_DIR = Path(__file__).resolve().parent
RAW_DIR = BASE_DIR / "raw"
PROCESSED_DIR = BASE_DIR / "processed"

HDF5_PATH = RAW_DIR / "met_data.h5"
INDICATOR_59_PATH = RAW_DIR / "SOE_SFU" / "indicator_59.csv"

OUTPUT_CSV_PATH = PROCESSED_DIR / "polar_microgrid_hourly.csv"
QUALITY_REPORT_PATH = PROCESSED_DIR / "data_quality_report.json"

# Microgrid Configurable Demonstration Capacities & Parameters
PV_CAPACITY_KW = 100.0      # Rated PV capacity
WIND_CAPACITY_KW = 150.0    # Rated Wind Turbine capacity

# Wind Turbine Power Curve Parameters
V_CUT_IN = 3.0              # m/s
V_RATED = 12.0              # m/s
V_CUT_OUT = 25.0            # m/s
RHO_STANDARD = 1.225        # kg/m^3 standard sea-level air density
R_SPEC_AIR = 287.058        # J/(kg*K) specific gas constant for dry air

# PV Physical Model Parameters
G_STC = 1000.0              # W/m^2 Standard Test Conditions Irradiance
NOCT = 45.0                 # Normal Operating Cell Temperature (deg C)
TEMP_COEFF_PV = -0.004      # Power temp coefficient (/deg C)

# Diurnal Station Human Activity Multipliers (24 hours: 00 to 23)
DIURNAL_ACTIVITY_PROFILE = np.array([
    0.88, 0.87, 0.86, 0.86, 0.87, 0.90,  # 00:00 - 05:00 Night baseline
    1.02, 1.08, 1.14, 1.16, 1.18, 1.18,  # 06:00 - 11:00 Morning / scientific ops
    1.17, 1.16, 1.16, 1.15, 1.14, 1.12,  # 12:00 - 17:00 Afternoon / station ops
    1.12, 1.10, 1.05, 0.98, 0.94, 0.90   # 18:00 - 23:00 Evening / wind-down
])


def extract_weather_time_series(hdf5_path: Path) -> pd.DataFrame:
    """Extract continuous hourly meteorological time series from HDF5 forecast blocks and actuals."""
    print("Reading meteorological variables from HDF5...")
    with h5py.File(hdf5_path, "r") as f:
        loc = f["lat63_41_lon10_11"]
        
        # 1. Actual wind speed series
        ws_act_idx = pd.to_datetime(loc["wind_speed_10m"]["actual"]["index"][:])
        ws_act_vals = loc["wind_speed_10m"]["actual"]["values"][:]
        df_actual = pd.DataFrame({
            "timestamp": ws_act_idx,
            "wind_speed_ms": ws_act_vals
        })
        
        # 2. Extract forecast cycles across the year without loading full tree into memory
        cycles = sorted(list(loc["air_temperature_2m"]["forecast"].keys()))
        records = []
        
        for i, c_key in enumerate(cycles):
            c_time = pd.to_datetime(c_key)
            if i < len(cycles) - 1:
                next_time = pd.to_datetime(cycles[i+1])
                hours = int((next_time - c_time).total_seconds() / 3600)
                if hours <= 0 or hours > 24:
                    hours = 6
            else:
                hours = 6
                
            t_group = loc["air_temperature_2m"]["forecast"][c_key]
            axis1 = pd.to_datetime(t_group["axis1"][:hours])
            
            # Primary column 0 represents the core site coordinate
            temp_k = loc["air_temperature_2m"]["forecast"][c_key]["block0_values"][:hours, 0]
            press_pa = loc["air_pressure_at_sea_level"]["forecast"][c_key]["block0_values"][:hours, 0]
            cloud = loc["cloud_area_fraction"]["forecast"][c_key]["block0_values"][:hours, 0]
            wind_dir = loc["wind_direction_10m"]["forecast"][c_key]["block0_values"][:hours, 0]
            wind_spd_fc = loc["wind_speed_10m"]["forecast"][c_key]["block0_values"][:hours, 0]
            
            # Shortwave flux: differencing cumulative J/m^2 over consecutive hours divided by 3600s
            cum_flux = loc["integral_of_surface_downwelling_shortwave_flux_in_air_wrt_time"]["forecast"][c_key]["block0_values"][:hours+1, 0]
            diff_flux = np.diff(cum_flux)
            irradiance = np.maximum(0.0, diff_flux / 3600.0)
            
            for h in range(len(axis1)):
                irr_val = float(irradiance[h]) if h < len(irradiance) else 0.0
                records.append({
                    "timestamp": axis1[h],
                    "temperature_k": float(temp_k[h]),
                    "pressure_pa": float(press_pa[h]),
                    "cloud_fraction": float(np.clip(cloud[h], 0.0, 1.0)),
                    "wind_direction_deg": float(wind_dir[h] % 360.0),
                    "wind_speed_fc": float(np.maximum(0.0, wind_spd_fc[h])),
                    "irradiance_w_m2": irr_val
                })
                
    df_met = pd.DataFrame(records)
    # Deduplicate timestamps in case of forecast issue overlaps
    df_met = df_met.drop_duplicates(subset=["timestamp"]).sort_values("timestamp").reset_index(drop=True)
    
    # Merge with actual wind speed where available, falling back to forecast
    df_merged = pd.merge(df_met, df_actual, on="timestamp", how="left")
    df_merged["wind_speed_ms"] = df_merged["wind_speed_ms"].fillna(df_merged["wind_speed_fc"])
    df_merged["temperature_c"] = df_merged["temperature_k"] - 273.15
    df_merged["pressure_hpa"] = df_merged["pressure_pa"] / 100.0
    
    # Select clean weather columns
    weather_cols = [
        "timestamp", "temperature_c", "wind_speed_ms", "wind_direction_deg",
        "irradiance_w_m2", "cloud_fraction", "pressure_hpa", "pressure_pa"
    ]
    return df_merged[weather_cols].copy()


def compute_pv_generation(irradiance: pd.Series, temperature_c: pd.Series, capacity_kw: float = PV_CAPACITY_KW) -> pd.Series:
    """Compute physical PV demonstration generation with cell temperature derating."""
    # Normalized solar input: G / G_stc
    norm_solar = np.maximum(0.0, irradiance / G_STC)
    
    # Cell temperature estimation
    t_cell = temperature_c + irradiance * ((NOCT - 20.0) / 800.0)
    
    # Temperature derating factor
    temp_derating = 1.0 + TEMP_COEFF_PV * (t_cell - 25.0)
    temp_derating = np.clip(temp_derating, 0.70, 1.25)
    
    # PV Power in kW
    p_pv = capacity_kw * norm_solar * temp_derating
    
    # Physical constraints: 0 <= P_pv <= capacity, and zero when irradiance is zero
    p_pv = np.where(irradiance <= 0.5, 0.0, p_pv)
    p_pv = np.clip(p_pv, 0.0, capacity_kw)
    return pd.Series(p_pv, name="solar_kw")


def compute_wind_generation(wind_speed: pd.Series, temperature_c: pd.Series, pressure_pa: pd.Series, capacity_kw: float = WIND_CAPACITY_KW) -> pd.Series:
    """Compute non-linear wind turbine power curve with polar air density correction."""
    v = np.maximum(0.0, wind_speed.to_numpy())
    t_k = temperature_c.to_numpy() + 273.15
    p_pa = pressure_pa.to_numpy()
    
    # Air density: rho = P / (R_spec * T_k)
    rho = p_pa / (R_SPEC_AIR * t_k)
    density_ratio = np.clip(rho / RHO_STANDARD, 0.85, 1.30)
    
    p_wind = np.zeros_like(v)
    
    # Region 2: Partial power (cubic ramp between cut-in and rated)
    mask_ramp = (v >= V_CUT_IN) & (v < V_RATED)
    cubic_factor = (v[mask_ramp]**3 - V_CUT_IN**3) / (V_RATED**3 - V_CUT_IN**3)
    p_wind[mask_ramp] = capacity_kw * cubic_factor * density_ratio[mask_ramp]
    
    # Region 3: Rated power plateau (between rated and cut-out)
    mask_rated = (v >= V_RATED) & (v < V_CUT_OUT)
    p_wind[mask_rated] = capacity_kw * np.minimum(1.0, density_ratio[mask_rated])
    
    # Region 1 & 4: Cut-in / cut-out (P_wind = 0) handled by zero initialization
    p_wind = np.clip(p_wind, 0.0, capacity_kw)
    return pd.Series(p_wind, name="wind_kw")


def extract_antarctic_load_statistics(indicator_path: Path) -> Dict[int, float]:
    """Extract monthly average electricity load (kW) across Antarctic stations."""
    df_soe = pd.read_csv(indicator_path, skiprows=1)
    df_soe = df_soe.dropna(subset=["Value"])
    # Filter for major mainland Antarctic stations (Casey, Davis, Mawson)
    mainland = df_soe[df_soe["Place"].isin(["Casey", "Davis", "Mawson"])].copy()
    
    parsed_dates = pd.to_datetime(mainland["Date"], format="%b-%y", errors="coerce")
    mainland["Month"] = parsed_dates.dt.month
    
    # Monthly average power in kW = Total monthly kWh / (average days in month * 24)
    monthly_kw = mainland.groupby("Month")["Value"].mean() / (30.4375 * 24.0)
    return monthly_kw.to_dict()


def generate_synthetic_hourly_load(
    timestamps: pd.DatetimeIndex,
    temperature_c: pd.Series,
    monthly_baselines_kw: Dict[int, float],
    seed: int = 42
) -> pd.Series:
    """Synthesize plausible Antarctic station hourly load profile.
    
    Methodology:
    - Base load scale derived from Australian Antarctic Data Centre (AADC) SOE_SFU indicator_59 monthly statistics.
    - Diurnal human/station activity modulation factor (night dip, daytime lab/station ops peak).
    - Thermal space-heating load response proportional to sub-zero ambient temperature.
    - Deterministic harmonics + small reproducible stochastic variation.
    """
    rng = np.random.RandomState(seed)
    n = len(timestamps)
    
    hours = timestamps.hour.to_numpy()
    months = timestamps.month.to_numpy()
    t_c = temperature_c.to_numpy()
    
    # 1. Base seasonal load from Antarctic monthly stats (default fallback ~195 kW)
    base_load = np.array([monthly_baselines_kw.get(m, 195.0) for m in months])
    
    # 2. Diurnal activity factor
    diurnal_factor = DIURNAL_ACTIVITY_PROFILE[hours]
    
    # 3. Ambient temperature heating demand: cold temperatures increase electrical heating load
    # Reference indoor balance temp ~ 5 deg C; heating sensitivity ~ 1.8 kW per deg C below reference
    heating_demand = 1.8 * np.maximum(0.0, 5.0 - t_c)
    
    # 4. Deterministic multi-frequency harmonics (weekly/daily micro-variations)
    day_of_year = timestamps.dayofyear.to_numpy()
    harmonics = 4.0 * np.sin(2 * np.pi * hours / 12.0) + 2.5 * np.cos(2 * np.pi * day_of_year / 7.0)
    
    # 5. Small Gaussian stochastic noise (sigma = 3.5 kW)
    noise = rng.normal(loc=0.0, scale=3.5, size=n)
    
    # Total combined load (kW)
    p_load = (base_load * diurnal_factor) + heating_demand + harmonics + noise
    
    # Ensure physical plausibility: clamped within realistic polar station bounds [100 kW, 400 kW]
    p_load = np.clip(p_load, 100.0, 400.0)
    return pd.Series(p_load, name="load_kw")


def perform_data_quality_audit(df: pd.DataFrame) -> Dict[str, Any]:
    """Execute exhaustive data quality and physical integrity checks."""
    total_rows = len(df)
    
    # 1. Monotonicity & regularity of timestamps
    dt_diffs = df["timestamp"].diff().dropna()
    is_regular_1h = bool((dt_diffs == pd.Timedelta(hours=1)).all())
    duplicate_timestamps = int(df["timestamp"].duplicated().sum())
    
    # 2. Missing values
    missing_by_col = {col: int(df[col].isnull().sum()) for col in df.columns}
    total_missing = sum(missing_by_col.values())
    
    # 3. Physical boundaries validation
    bounds_violations = {
        "negative_irradiance": int((df["irradiance_w_m2"] < 0.0).sum()),
        "negative_load": int((df["load_kw"] < 0.0).sum()),
        "solar_exceeds_capacity": int((df["solar_kw"] > PV_CAPACITY_KW + 1e-4).sum()),
        "solar_negative": int((df["solar_kw"] < 0.0).sum()),
        "wind_exceeds_capacity": int((df["wind_kw"] > WIND_CAPACITY_KW + 1e-4).sum()),
        "wind_negative": int((df["wind_kw"] < 0.0).sum()),
        "invalid_temperature_range": int(((df["temperature_c"] < -60.0) | (df["temperature_c"] > 45.0)).sum()),
        "invalid_pressure_range": int(((df["pressure_hpa"] < 800.0) | (df["pressure_hpa"] > 1100.0)).sum()),
        "cloud_fraction_out_of_bounds": int(((df["cloud_fraction"] < 0.0) | (df["cloud_fraction"] > 1.0)).sum()),
    }
    
    audit_passed = (
        is_regular_1h and
        duplicate_timestamps == 0 and
        total_missing == 0 and
        all(v == 0 for v in bounds_violations.values())
    )
    
    quality_report = {
        "audit_passed": audit_passed,
        "total_rows": total_rows,
        "date_range": {
            "start": str(df["timestamp"].min()),
            "end": str(df["timestamp"].max())
        },
        "is_regular_1h": is_regular_1h,
        "duplicate_timestamps": duplicate_timestamps,
        "total_missing_values": total_missing,
        "missing_by_column": missing_by_col,
        "physical_boundary_violations": bounds_violations,
        "summary_statistics": {
            col: {
                "min": float(df[col].min()),
                "max": float(df[col].max()),
                "mean": float(df[col].mean()),
                "std": float(df[col].std())
            }
            for col in ["load_kw", "solar_kw", "wind_kw", "temperature_c", "wind_speed_ms", "irradiance_w_m2", "pressure_hpa"]
        }
    }
    return quality_report


def build_polar_microgrid_dataset() -> pd.DataFrame:
    """Execute the complete offline data-processing and feature-engineering pipeline."""
    print("=" * 60)
    print("PolarEMS Offline Data Processing & Feature Engineering Pipeline")
    print("=" * 60)
    
    # 1. Extract Weather Backbone
    df_weather = extract_weather_time_series(HDF5_PATH)
    print(f"Extracted {len(df_weather)} hourly weather rows from {df_weather['timestamp'].min()} to {df_weather['timestamp'].max()}.")
    
    # 2. Extract Antarctic Load Statistics
    print("Extracting monthly electricity baseline from SOE_SFU indicator_59.csv...")
    monthly_baselines = extract_antarctic_load_statistics(INDICATOR_59_PATH)
    print("Antarctic monthly baselines (kW):", {m: round(kw, 1) for m, kw in monthly_baselines.items()})
    
    # 3. Synthesize Renewable Generation Models
    print("Computing physical PV generation (100 kW rated capacity)...")
    df_weather["solar_kw"] = compute_pv_generation(df_weather["irradiance_w_m2"], df_weather["temperature_c"])
    
    print("Computing physical Wind turbine power curve (150 kW rated capacity)...")
    df_weather["wind_kw"] = compute_wind_generation(
        df_weather["wind_speed_ms"], df_weather["temperature_c"], df_weather["pressure_pa"]
    )
    
    # 4. Synthesize Antarctic Station Load Profile
    print("Synthesizing Antarctic research-station hourly load profile...")
    df_weather["load_kw"] = generate_synthetic_hourly_load(
        pd.DatetimeIndex(df_weather["timestamp"]),
        df_weather["temperature_c"],
        monthly_baselines
    )
    
    # 5. Engineered Calendar and Cyclical Features
    dt_idx = pd.DatetimeIndex(df_weather["timestamp"])
    df_weather["hour"] = dt_idx.hour
    df_weather["month"] = dt_idx.month
    
    # Cyclical sin/cos encodings
    df_weather["hour_sin"] = np.sin(2 * np.pi * df_weather["hour"] / 24.0)
    df_weather["hour_cos"] = np.cos(2 * np.pi * df_weather["hour"] / 24.0)
    df_weather["month_sin"] = np.sin(2 * np.pi * (df_weather["month"] - 1) / 12.0)
    df_weather["month_cos"] = np.cos(2 * np.pi * (df_weather["month"] - 1) / 12.0)
    
    # Select and order final canonical dataset columns
    final_columns = [
        "timestamp", "hour", "month", "temperature_c", "wind_speed_ms",
        "wind_direction_deg", "irradiance_w_m2", "cloud_fraction", "pressure_hpa",
        "load_kw", "solar_kw", "wind_kw",
        "hour_sin", "hour_cos", "month_sin", "month_cos"
    ]
    df_final = df_weather[final_columns].sort_values("timestamp").reset_index(drop=True)
    
    # 6. Quality Audit
    print("Performing data quality and physical consistency audit...")
    quality_report = perform_data_quality_audit(df_final)
    
    # 7. Save outputs
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    df_final.to_csv(OUTPUT_CSV_PATH, index=False)
    print(f"Saved processed dataset to: {OUTPUT_CSV_PATH}")
    
    with open(QUALITY_REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(quality_report, f, indent=2)
    print(f"Saved data quality report to: {QUALITY_REPORT_PATH}")
    
    # Print Terminal Summary
    print("\n" + "=" * 60)
    print("DATA PROCESSING TERMINAL SUMMARY")
    print("=" * 60)
    print(f"Total Rows: {quality_report['total_rows']}")
    print(f"Date Range: {quality_report['date_range']['start']} to {quality_report['date_range']['end']}")
    print(f"Total Columns: {len(final_columns)} -> {final_columns}")
    print(f"Missing Values: {quality_report['total_missing_values']}")
    print(f"Audit Passed: {quality_report['audit_passed']}")
    print("\nKey Variable Statistics:")
    for var, stats in quality_report["summary_statistics"].items():
        print(f"  {var:<18}: min={stats['min']:>8.2f}, max={stats['max']:>8.2f}, mean={stats['mean']:>8.2f}, std={stats['std']:>8.2f}")
    print("=" * 60 + "\n")
    
    return df_final


if __name__ == "__main__":
    build_polar_microgrid_dataset()
