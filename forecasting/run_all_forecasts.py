from __future__ import annotations

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

"""Orchestrator for PolarEMS AI/ML Forecasting Baselines.

Executes:
1. Loading processed dataset.
2. Leakage-safe feature preparation.
3. Chronological train/val/test splitting (70% / 15% / 15%).
4. Training Linear Regression, Random Forest, and HistGradientBoosting for Load, Solar, and Wind.
5. Evaluation across Validation and Test sets.
6. Saving best models and metadata via joblib into models/.
7. Exporting predictions to results/forecasting/*_predictions.csv.
8. Generating actual vs predicted diagnostic plots using matplotlib.
9. Generating model_comparison.csv and FORECASTING_REPORT.md.
"""

import sys
from pathlib import Path


import json
from pathlib import Path
import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from forecasting.features import (
    LOAD_FEATURES,
    SOLAR_FEATURES,
    WIND_FEATURES,
    create_forecasting_features,
    chronological_split
)
from forecasting.train_load import train_and_evaluate_load_models
from forecasting.train_solar import train_and_evaluate_solar_models
from forecasting.train_wind import train_and_evaluate_wind_models

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_PATH = BASE_DIR / "data" / "processed" / "polar_microgrid_hourly.csv"
MODELS_DIR = BASE_DIR / "models"
RESULTS_DIR = BASE_DIR / "results" / "forecasting"


def plot_forecast_diagnostics(
    timestamps: pd.Series,
    y_true: np.ndarray,
    y_pred: np.ndarray,
    target_title: str,
    unit: str,
    output_path: Path
) -> None:
    """Generate actual vs predicted full test-horizon plot and representative 72h snapshot."""
    fig, axes = plt.subplots(2, 1, figsize=(14, 9), gridspec_kw={"height_ratios": [1.5, 1]})
    
    # 1. Full Test Horizon Comparison
    axes[0].plot(timestamps, y_true, color="#2c3e50", linewidth=1.0, alpha=0.85, label="Actual Ground Truth")
    axes[0].plot(timestamps, y_pred, color="#e74c3c", linewidth=1.0, alpha=0.85, linestyle="--", label="Model Forecast")
    axes[0].set_title(f"PolarEMS Test Period Forecast: {target_title}", fontsize=13, fontweight="bold")
    axes[0].set_ylabel(f"Power ({unit})", fontsize=11, fontweight="bold")
    axes[0].legend(loc="upper right", framealpha=0.9)
    axes[0].grid(True, linestyle=":", alpha=0.6)
    
    # 2. Representative 72-Hour Detailed Window (first 72 hours of test set)
    n_sample = min(72, len(timestamps))
    axes[1].plot(timestamps.iloc[:n_sample], y_true[:n_sample], color="#2c3e50", marker="o", linewidth=1.8, label="Actual Ground Truth")
    axes[1].plot(timestamps.iloc[:n_sample], y_pred[:n_sample], color="#e74c3c", marker="^", linewidth=1.8, linestyle="--", label="Model Forecast")
    axes[1].set_title(f"Representative 72-Hour High-Resolution Tracking ({target_title})", fontsize=11, fontweight="bold")
    axes[1].set_ylabel(f"Power ({unit})", fontsize=11, fontweight="bold")
    axes[1].set_xlabel("Timeline (UTC)", fontsize=11, fontweight="bold")
    axes[1].legend(loc="upper right", framealpha=0.9)
    axes[1].grid(True, linestyle=":", alpha=0.6)
    
    fig.tight_layout()
    fig.savefig(output_path, dpi=200)
    plt.close(fig)
    print(f"Generated forecast plot: {output_path.name}")


def generate_forecasting_report(
    df_comparison: pd.DataFrame,
    split_info: dict,
    best_models: dict,
    output_path: Path
) -> None:
    """Generate Markdown forecasting report including data provenance and scientific disclaimer."""
    lines = [
        "# PolarEMS AI/ML Forecasting Benchmark Report",
        "",
        "**Project:** PolarEMS — AI-Assisted Predictive Energy Management for Renewable–Battery–Diesel Microgrids in Polar Research Stations  ",
        "**Phase:** AI/ML Forecasting Baselines  ",
        "**Date:** September 18, 2026  ",
        "",
        "---",
        "",
        "## 1. Dataset & Chronological Time-Series Split",
        "",
        "The forecasting pipeline is trained, validated, and tested on `data/processed/polar_microgrid_hourly.csv` (8,760 usable rows after 24h lag initializations). Chronological time-series splitting without random shuffling guarantees zero look-ahead bias:",
        "",
        "| Split | Number of Samples | Date Range (UTC) | Percentage |",
        "|---|---|---|---|",
        f"| **Train** | {split_info['train']['rows']} | `{split_info['train']['start']}` to `{split_info['train']['end']}` | 70% |",
        f"| **Validation** | {split_info['validation']['rows']} | `{split_info['validation']['start']}` to `{split_info['validation']['end']}` | 15% |",
        f"| **Test (Unseen)** | {split_info['test']['rows']} | `{split_info['test']['start']}` to `{split_info['test']['end']}` | 15% |",
        "",
        "---",
        "",
        "## 2. Leakage-Safe Feature Sets",
        "",
        "All lagged targets ($y_{t-1}, y_{t-24}$) and rolling statistics ($\\mu_{24}(y)$) are strictly shifted by at least 1 time step ($t-1$) to prevent data leakage at prediction instant $t$:",
        "",
        f"* **Station Load Features (`load_kw`):** `{', '.join(LOAD_FEATURES)}`",
        f"* **Solar PV Features (`solar_kw`):** `{', '.join(SOLAR_FEATURES)}`",
        f"* **Wind Generation Features (`wind_kw`):** `{', '.join(WIND_FEATURES)}`",
        "",
        "---",
        "",
        "## 3. Model Benchmark Comparison",
        "",
        "| Target | Model | Val MAE (kW) | Val RMSE (kW) | Val R² | Val MAPE (%) | Test MAE (kW) | Test RMSE (kW) | Test R² | Test MAPE (%) |",
        "|---|---|---|---|---|---|---|---|---|---|"
    ]
    
    for _, row in df_comparison.iterrows():
        line = (
            f"| `{row['target']}` | **{row['model']}** | {row['val_MAE']:.2f} | "
            f"{row['val_RMSE']:.2f} | {row['val_R2']:.4f} | {row['val_MAPE']:.2f}% | "
            f"{row['test_MAE']:.2f} | {row['test_RMSE']:.2f} | {row['test_R2']:.4f} | "
            f"{row['test_MAPE']:.2f}% |"
        )
        lines.append(line)
        
    lines.extend([
        "",
        "---",
        "",
        "## 4. Best Baseline Models Selected",
        "",
        f"* **Station Load Forecaster:** **{best_models['load_kw']['name']}** (Test RMSE: `{best_models['load_kw']['test_rmse']:.2f} kW`, Test R²: `{best_models['load_kw']['test_r2']:.4f}`)",
        f"* **Solar PV Forecaster:** **{best_models['solar_kw']['name']}** (Test RMSE: `{best_models['solar_kw']['test_rmse']:.2f} kW`, Test R²: `{best_models['solar_kw']['test_r2']:.4f}`)",
        f"* **Wind Generation Forecaster:** **{best_models['wind_kw']['name']}** (Test RMSE: `{best_models['wind_kw']['test_rmse']:.2f} kW`, Test R²: `{best_models['wind_kw']['test_r2']:.4f}`)",
        "",
        "The best models and their associated feature metadata are serialized under `models/` using `joblib`.",
        "",
        "---",
        "",
        "## 5. Data Provenance & Scientific Disclaimer",
        "",
        "> [!IMPORTANT]",
        "> **Scientific Limitation & Provenance:**  ",
        "> Forecasting performance demonstrates the capability of the PolarEMS forecasting pipeline on the constructed hourly demonstration dataset. It should not be interpreted as field validation of an Antarctic research station.",
        "> ",
        "> * **Empirical Base Load Scale:** Grounded in real 30-year monthly statistics from the Australian Antarctic Data Centre (AADC SOE_SFU `indicator_59.csv`).",
        "> * **Meteorological Dynamics:** Driven by NWP forecast blocks and hourly observations from `met_data.h5` at $63.41^\\circ\\text{N}, 10.11^\\circ\\text{E}$ (subpolar).",
        "> * **Hourly Generation & Demand:** Synthesized through standard IEC physical PV derating, turbine aerodynamic power curves, and station diurnal thermal models."
    ])
    
    output_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Generated forecasting report: {output_path.name}")


def main() -> None:
    print("=" * 70)
    print("PolarEMS AI/ML Forecasting Baselines Pipeline")
    print("=" * 70)
    
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    
    # 1. Load Dataset
    print(f"Loading canonical dataset from: {DATASET_PATH}")
    df_raw = pd.read_csv(DATASET_PATH)
    print(f"Raw rows: {len(df_raw)}")
    
    # 2. Feature Engineering
    print("Creating leakage-safe lag and rolling features...")
    df_features = create_forecasting_features(df_raw)
    print(f"Clean rows after 24h lag initialization: {len(df_features)}")
    
    # 3. Chronological Time-Series Split
    print("Performing chronological Train (70%) / Validation (15%) / Test (15%) split...")
    df_train, df_val, df_test, split_info = chronological_split(df_features)
    for s_name, s_meta in split_info.items():
        print(f"  {s_name.upper():<10}: {s_meta['rows']} rows | {s_meta['start']} to {s_meta['end']}")
        
    # 4. Train & Evaluate Models for Each Target
    print("\nTraining models for Target: Station Load (load_kw)...")
    load_models, load_df, best_load_model, best_load_name = train_and_evaluate_load_models(df_train, df_val, df_test)
    
    print("Training models for Target: Solar PV (solar_kw)...")
    solar_models, solar_df, best_solar_model, best_solar_name = train_and_evaluate_solar_models(df_train, df_val, df_test)
    
    print("Training models for Target: Wind Generation (wind_kw)...")
    wind_models, wind_df, best_wind_model, best_wind_name = train_and_evaluate_wind_models(df_train, df_val, df_test)
    
    # Combine Comparison Results
    df_comparison = pd.concat([load_df, solar_df, wind_df], ignore_index=True)
    comparison_csv_path = RESULTS_DIR / "model_comparison.csv"
    df_comparison.to_csv(comparison_csv_path, index=False)
    print(f"\nSaved model comparison table to: {comparison_csv_path}")
    
    # 5. Save Best Models & Metadata
    print("\nSaving best models to models/ directory...")
    joblib.dump({"model": best_load_model, "features": LOAD_FEATURES, "target": "load_kw"}, MODELS_DIR / "load_model.joblib")
    joblib.dump({"model": best_solar_model, "features": SOLAR_FEATURES, "target": "solar_kw"}, MODELS_DIR / "solar_model.joblib")
    joblib.dump({"model": best_wind_model, "features": WIND_FEATURES, "target": "wind_kw"}, MODELS_DIR / "wind_model.joblib")
    
    # 6. Generate Test Predictions
    print("\nGenerating test-set predictions and prediction CSVs...")
    test_timestamps = df_test["timestamp"]
    
    load_test_pred = np.maximum(0.0, best_load_model.predict(df_test[LOAD_FEATURES]))
    solar_test_pred = np.maximum(0.0, best_solar_model.predict(df_test[SOLAR_FEATURES]))
    wind_test_pred = np.maximum(0.0, best_wind_model.predict(df_test[WIND_FEATURES]))
    
    df_load_pred = pd.DataFrame({"timestamp": test_timestamps, "actual": df_test["load_kw"], "predicted": load_test_pred})
    df_solar_pred = pd.DataFrame({"timestamp": test_timestamps, "actual": df_test["solar_kw"], "predicted": solar_test_pred})
    df_wind_pred = pd.DataFrame({"timestamp": test_timestamps, "actual": df_test["wind_kw"], "predicted": wind_test_pred})
    
    df_load_pred.to_csv(RESULTS_DIR / "load_predictions.csv", index=False)
    df_solar_pred.to_csv(RESULTS_DIR / "solar_predictions.csv", index=False)
    df_wind_pred.to_csv(RESULTS_DIR / "wind_predictions.csv", index=False)
    
    # 7. Generate Diagnostic Plots
    print("\nGenerating visual forecast comparison plots...")
    plot_forecast_diagnostics(test_timestamps, df_test["load_kw"].to_numpy(), load_test_pred,
                              f"Station Load ({best_load_name})", "kW", RESULTS_DIR / "load_forecast.png")
    plot_forecast_diagnostics(test_timestamps, df_test["solar_kw"].to_numpy(), solar_test_pred,
                              f"Solar PV Generation ({best_solar_name})", "kW", RESULTS_DIR / "solar_forecast.png")
    plot_forecast_diagnostics(test_timestamps, df_test["wind_kw"].to_numpy(), wind_test_pred,
                              f"Wind Generation ({best_wind_name})", "kW", RESULTS_DIR / "wind_forecast.png")
    
    # 8. Generate Final Forecasting Report
    best_models_meta = {
        "load_kw": {
            "name": best_load_name,
            "test_rmse": float(df_comparison[(df_comparison["target"] == "load_kw") & (df_comparison["model"] == best_load_name)]["test_RMSE"].iloc[0]),
            "test_r2": float(df_comparison[(df_comparison["target"] == "load_kw") & (df_comparison["model"] == best_load_name)]["test_R2"].iloc[0])
        },
        "solar_kw": {
            "name": best_solar_name,
            "test_rmse": float(df_comparison[(df_comparison["target"] == "solar_kw") & (df_comparison["model"] == best_solar_name)]["test_RMSE"].iloc[0]),
            "test_r2": float(df_comparison[(df_comparison["target"] == "solar_kw") & (df_comparison["model"] == best_solar_name)]["test_R2"].iloc[0])
        },
        "wind_kw": {
            "name": best_wind_name,
            "test_rmse": float(df_comparison[(df_comparison["target"] == "wind_kw") & (df_comparison["model"] == best_wind_name)]["test_RMSE"].iloc[0]),
            "test_r2": float(df_comparison[(df_comparison["target"] == "wind_kw") & (df_comparison["model"] == best_wind_name)]["test_R2"].iloc[0])
        }
    }
    generate_forecasting_report(df_comparison, split_info, best_models_meta, RESULTS_DIR / "FORECASTING_REPORT.md")
    
    # Print Terminal Comparison Table
    print("\n" + "=" * 80)
    print("FORECASTING BASELINE BENCHMARK SUMMARY")
    print("=" * 80)
    print(f"{'Target':<10} | {'Model':<22} | {'Val RMSE':<9} | {'Val R2':<7} | {'Test RMSE':<9} | {'Test R2':<7} | {'Test MAPE':<9}")
    print("-" * 80)
    for _, row in df_comparison.iterrows():
        print(f"{row['target']:<10} | {row['model']:<22} | {row['val_RMSE']:>9.2f} | {row['val_R2']:>7.4f} | {row['test_RMSE']:>9.2f} | {row['test_R2']:>7.4f} | {row['test_MAPE']:>8.2f}%")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()