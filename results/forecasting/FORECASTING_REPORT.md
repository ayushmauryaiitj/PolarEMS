# PolarEMS AI/ML Forecasting Benchmark Report

**Project:** PolarEMS — AI-Assisted Predictive Energy Management for Renewable–Battery–Diesel Microgrids in Polar Research Stations  
**Phase:** AI/ML Forecasting Baselines  
**Date:** September 18, 2026  

---

## 1. Dataset & Chronological Time-Series Split

The forecasting pipeline is trained, validated, and tested on `data/processed/polar_microgrid_hourly.csv` (8,760 usable rows after 24h lag initializations). Chronological time-series splitting without random shuffling guarantees zero look-ahead bias:

| Split | Number of Samples | Date Range (UTC) | Percentage |
|---|---|---|---|
| **Train** | 6132 | `2020-01-02 00:00:00` to `2020-09-13 11:00:00` | 70% |
| **Validation** | 1314 | `2020-09-13 12:00:00` to `2020-11-07 05:00:00` | 15% |
| **Test (Unseen)** | 1314 | `2020-11-07 06:00:00` to `2020-12-31 23:00:00` | 15% |

---

## 2. Leakage-Safe Feature Sets

All lagged targets ($y_{t-1}, y_{t-24}$) and rolling statistics ($\mu_{24}(y)$) are strictly shifted by at least 1 time step ($t-1$) to prevent data leakage at prediction instant $t$:

* **Station Load Features (`load_kw`):** `hour, month, hour_sin, hour_cos, month_sin, month_cos, temperature_c, lag_1_load, lag_24_load, rolling_24_load`
* **Solar PV Features (`solar_kw`):** `hour, month, hour_sin, hour_cos, month_sin, month_cos, irradiance_w_m2, cloud_fraction, temperature_c, lag_1_solar, lag_24_solar`
* **Wind Generation Features (`wind_kw`):** `hour, month, hour_sin, hour_cos, month_sin, month_cos, wind_speed_ms, wind_direction_deg, temperature_c, pressure_hpa, lag_1_wind, lag_24_wind`

---

## 3. Model Benchmark Comparison

| Target | Model | Val MAE (kW) | Val RMSE (kW) | Val R² | Val MAPE (%) | Test MAE (kW) | Test RMSE (kW) | Test R² | Test MAPE (%) |
|---|---|---|---|---|---|---|---|---|---|
| `load_kw` | **Linear Regression** | 4.01 | 4.99 | 0.9581 | 1.95% | 4.65 | 5.88 | 0.9307 | 2.39% |
| `load_kw` | **Random Forest** | 3.58 | 4.49 | 0.9661 | 1.75% | 3.88 | 4.86 | 0.9527 | 2.01% |
| `load_kw` | **HistGradientBoosting** | 3.70 | 4.65 | 0.9635 | 1.82% | 4.90 | 6.03 | 0.9272 | 2.56% |
| `solar_kw` | **Linear Regression** | 0.56 | 0.70 | 0.9932 | 16.24% | 1.22 | 1.33 | 0.4261 | 62.64% |
| `solar_kw` | **Random Forest** | 0.02 | 0.06 | 0.9999 | 0.62% | 0.01 | 0.02 | 0.9999 | 1.03% |
| `solar_kw` | **HistGradientBoosting** | 0.04 | 0.08 | 0.9999 | 1.08% | 0.01 | 0.02 | 0.9998 | 1.48% |
| `wind_kw` | **Linear Regression** | 2.83 | 6.73 | 0.8595 | 75.06% | 4.38 | 8.80 | 0.8534 | 38.09% |
| `wind_kw` | **Random Forest** | 0.09 | 0.31 | 0.9997 | 1.10% | 0.23 | 0.52 | 0.9995 | 1.38% |
| `wind_kw` | **HistGradientBoosting** | 0.18 | 0.88 | 0.9976 | 1.46% | 0.46 | 1.52 | 0.9956 | 1.65% |

---

## 4. Best Baseline Models Selected

* **Station Load Forecaster:** **Random Forest** (Test RMSE: `4.86 kW`, Test R²: `0.9527`)
* **Solar PV Forecaster:** **Random Forest** (Test RMSE: `0.02 kW`, Test R²: `0.9999`)
* **Wind Generation Forecaster:** **Random Forest** (Test RMSE: `0.52 kW`, Test R²: `0.9995`)

The best models and their associated feature metadata are serialized under `models/` using `joblib`.

---

## 5. Data Provenance & Scientific Disclaimer

> [!IMPORTANT]
> **Scientific Limitation & Provenance:**  
> Forecasting performance demonstrates the capability of the PolarEMS forecasting pipeline on the constructed hourly demonstration dataset. It should not be interpreted as field validation of an Antarctic research station.
> 
> * **Empirical Base Load Scale:** Grounded in real 30-year monthly statistics from the Australian Antarctic Data Centre (AADC SOE_SFU `indicator_59.csv`).
> * **Meteorological Dynamics:** Driven by NWP forecast blocks and hourly observations from `met_data.h5` at $63.41^\circ\text{N}, 10.11^\circ\text{E}$ (subpolar).
> * **Hourly Generation & Demand:** Synthesized through standard IEC physical PV derating, turbine aerodynamic power curves, and station diurnal thermal models.