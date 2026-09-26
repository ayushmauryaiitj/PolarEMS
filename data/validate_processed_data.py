"""PolarEMS Visual Validation Script.

Generates 4 high-quality diagnostic plots from data/processed/polar_microgrid_hourly.csv
using Matplotlib only (no Seaborn):
1. data/processed/weather_overview.png
2. data/processed/load_profile.png
3. data/processed/renewable_generation.png
4. data/processed/daily_energy_profile.png
"""

from __future__ import annotations

from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
PROCESSED_DIR = BASE_DIR / "processed"
CSV_PATH = PROCESSED_DIR / "polar_microgrid_hourly.csv"


def plot_weather_overview(df: pd.DataFrame, output_path: Path) -> None:
    """Plot 1: Meteorological Overview (Temperature, Wind Speed, Solar Irradiance)."""
    fig, axes = plt.subplots(3, 1, figsize=(14, 10), sharex=True)
    
    # 1. Temperature
    axes[0].plot(df["timestamp"], df["temperature_c"], color="#e74c3c", linewidth=0.8, alpha=0.85)
    axes[0].axhline(0, color="gray", linestyle="--", linewidth=0.8, alpha=0.7)
    axes[0].set_ylabel("Air Temp (°C)", fontsize=11, fontweight="bold")
    axes[0].set_title("PolarEMS Meteorological Backbone Overview (Full Year)", fontsize=13, fontweight="bold")
    axes[0].grid(True, linestyle=":", alpha=0.6)
    
    # 2. Wind Speed
    axes[1].plot(df["timestamp"], df["wind_speed_ms"], color="#2980b9", linewidth=0.8, alpha=0.85)
    axes[1].axhline(3.0, color="green", linestyle="--", linewidth=0.8, label="Cut-in (3 m/s)")
    axes[1].axhline(12.0, color="orange", linestyle="--", linewidth=0.8, label="Rated (12 m/s)")
    axes[1].set_ylabel("Wind Speed (m/s)", fontsize=11, fontweight="bold")
    axes[1].legend(loc="upper right", framealpha=0.9)
    axes[1].grid(True, linestyle=":", alpha=0.6)
    
    # 3. Solar Irradiance
    axes[2].plot(df["timestamp"], df["irradiance_w_m2"], color="#f39c12", linewidth=0.8, alpha=0.85)
    axes[2].set_ylabel("Irradiance (W/m²)", fontsize=11, fontweight="bold")
    axes[2].set_xlabel("Timeline (UTC)", fontsize=11, fontweight="bold")
    axes[2].grid(True, linestyle=":", alpha=0.6)
    
    fig.tight_layout()
    fig.savefig(output_path, dpi=200)
    plt.close(fig)
    print(f"Generated plot: {output_path.name}")


def plot_load_profile(df: pd.DataFrame, output_path: Path) -> None:
    """Plot 2: Station Hourly Load Time Series & Monthly Boxplot."""
    fig, axes = plt.subplots(2, 1, figsize=(14, 9), gridspec_kw={"height_ratios": [2, 1.2]})
    
    # 1. Full Hourly Load Time Series
    axes[0].plot(df["timestamp"], df["load_kw"], color="#2c3e50", linewidth=0.7, alpha=0.8)
    axes[0].axhline(df["load_kw"].mean(), color="#e74c3c", linestyle="--", linewidth=1.5,
                   label=f"Annual Mean Load ({df['load_kw'].mean():.1f} kW)")
    axes[0].set_ylabel("Station Demand (kW)", fontsize=11, fontweight="bold")
    axes[0].set_title("Polar Research Station Electrical Load Profile (Derived from AADC SOE_SFU Indicator 59)",
                      fontsize=13, fontweight="bold")
    axes[0].legend(loc="upper right", framealpha=0.9)
    axes[0].grid(True, linestyle=":", alpha=0.6)
    
    # 2. Monthly Load Distribution
    monthly_data = [df[df["month"] == m]["load_kw"].values for m in range(1, 13)]
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    bp = axes[1].boxplot(monthly_data, tick_labels=month_names, patch_artist=True,
                         boxprops=dict(facecolor="#3498db", color="#1b4f72", alpha=0.7),
                         medianprops=dict(color="#e74c3c", linewidth=1.5))
    axes[1].set_ylabel("Demand (kW)", fontsize=11, fontweight="bold")
    axes[1].set_xlabel("Month of Year", fontsize=11, fontweight="bold")
    axes[1].set_title("Seasonal Load Distribution by Month", fontsize=11, fontweight="bold")
    axes[1].grid(True, linestyle=":", alpha=0.6)
    
    fig.tight_layout()
    fig.savefig(output_path, dpi=200)
    plt.close(fig)
    print(f"Generated plot: {output_path.name}")


def plot_renewable_generation(df: pd.DataFrame, output_path: Path) -> None:
    """Plot 3: PV vs Wind Generation Over the Year."""
    fig, axes = plt.subplots(2, 1, figsize=(14, 9), sharex=True)
    
    # 1. Solar PV Generation
    axes[0].plot(df["timestamp"], df["solar_kw"], color="#e67e22", linewidth=0.8, alpha=0.85)
    axes[0].axhline(100.0, color="gray", linestyle="--", linewidth=0.8, label="Rated PV (100 kW)")
    axes[0].set_ylabel("PV Output (kW)", fontsize=11, fontweight="bold")
    axes[0].set_title("PolarEMS Renewable Generation Profiles (100 kW PV, 150 kW Wind)", fontsize=13, fontweight="bold")
    axes[0].legend(loc="upper right", framealpha=0.9)
    axes[0].grid(True, linestyle=":", alpha=0.6)
    
    # 2. Wind Turbine Generation
    axes[1].plot(df["timestamp"], df["wind_kw"], color="#16a085", linewidth=0.8, alpha=0.85)
    axes[1].axhline(150.0, color="gray", linestyle="--", linewidth=0.8, label="Rated Wind (150 kW)")
    axes[1].set_ylabel("Wind Output (kW)", fontsize=11, fontweight="bold")
    axes[1].set_xlabel("Timeline (UTC)", fontsize=11, fontweight="bold")
    axes[1].legend(loc="upper right", framealpha=0.9)
    axes[1].grid(True, linestyle=":", alpha=0.6)
    
    fig.tight_layout()
    fig.savefig(output_path, dpi=200)
    plt.close(fig)
    print(f"Generated plot: {output_path.name}")


def plot_daily_energy_profile(df: pd.DataFrame, output_path: Path) -> None:
    """Plot 4: Representative 24-Hour Daily Profile (Average & Representative Polar Day)."""
    # Compute average 24h diurnal profiles
    diurnal = df.groupby("hour")[["load_kw", "solar_kw", "wind_kw"]].mean()
    
    fig, axes = plt.subplots(2, 1, figsize=(12, 10))
    hours = np.arange(24)
    
    # 1. Annual Diurnal Averages
    axes[0].plot(hours, diurnal["load_kw"], color="#2c3e50", marker="o", linewidth=2.0, label="Station Load (kW)")
    axes[0].plot(hours, diurnal["wind_kw"], color="#16a085", marker="s", linewidth=2.0, label="Wind Generation (kW)")
    axes[0].plot(hours, diurnal["solar_kw"], color="#f39c12", marker="^", linewidth=2.0, label="Solar PV Generation (kW)")
    axes[0].set_title("Annual Average 24-Hour Diurnal Energy Profile", fontsize=13, fontweight="bold")
    axes[0].set_ylabel("Power (kW)", fontsize=11, fontweight="bold")
    axes[0].set_xticks(hours)
    axes[0].set_xticklabels([f"{h:02d}:00" for h in hours], rotation=45)
    axes[0].grid(True, linestyle=":", alpha=0.6)
    axes[0].legend(loc="upper right", framealpha=0.9)
    
    # 2. Representative 72-Hour Operating Window (e.g. March equinox 2020-03-20 to 2020-03-22)
    sample_window = df[(df["timestamp"] >= "2020-03-20") & (df["timestamp"] < "2020-03-23")]
    axes[1].plot(sample_window["timestamp"], sample_window["load_kw"], color="#2c3e50", linewidth=1.8, label="Station Load (kW)")
    axes[1].plot(sample_window["timestamp"], sample_window["wind_kw"], color="#16a085", linewidth=1.5, label="Wind Generation (kW)")
    axes[1].plot(sample_window["timestamp"], sample_window["solar_kw"], color="#f39c12", linewidth=1.5, label="Solar PV Generation (kW)")
    axes[1].set_title("Representative 72-Hour Microgrid Dispatch Snapshot (March Equinox)", fontsize=12, fontweight="bold")
    axes[1].set_ylabel("Power (kW)", fontsize=11, fontweight="bold")
    axes[1].set_xlabel("Time (UTC)", fontsize=11, fontweight="bold")
    axes[1].grid(True, linestyle=":", alpha=0.6)
    axes[1].legend(loc="upper right", framealpha=0.9)
    
    fig.tight_layout()
    fig.savefig(output_path, dpi=200)
    plt.close(fig)
    print(f"Generated plot: {output_path.name}")


def main() -> None:
    print("=" * 60)
    print("PolarEMS Processed Data Visual Validation")
    print("=" * 60)
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"Processed file not found: {CSV_PATH}. Run data_processor.py first.")
    
    df = pd.read_csv(CSV_PATH)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    print(f"Loaded {len(df)} rows from {CSV_PATH}")
    
    plot_weather_overview(df, PROCESSED_DIR / "weather_overview.png")
    plot_load_profile(df, PROCESSED_DIR / "load_profile.png")
    plot_renewable_generation(df, PROCESSED_DIR / "renewable_generation.png")
    plot_daily_energy_profile(df, PROCESSED_DIR / "daily_energy_profile.png")
    print("All validation plots successfully generated in data/processed/.")
    print("=" * 60)


if __name__ == "__main__":
    main()
