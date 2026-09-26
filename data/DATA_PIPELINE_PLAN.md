# PolarEMS Data Pipeline Plan

**Project:** PolarEMS — AI-Assisted Predictive Energy Management for Renewable–Battery–Diesel Microgrids in Polar Research Stations  
**Document:** Preprocessing and Feature Engineering Pipeline Architecture  
**Date:** September 18, 2026  

---

## 1. Pipeline Overview

The PolarEMS data pipeline transforms raw meteorological and historical station records into synchronized, validated, and normalized time-series datasets ready for multi-step AI/ML forecasting and microgrid optimization.

```
+-------------------------------------------------------------------------+
|                               RAW DATA                                  |
|   - met_data.h5 (Hourly weather actuals & 60h NWP forecast blocks)      |
|   - SOE_SFU / indicator_59.csv (AADC Monthly Station Load Baseline)     |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                        STAGE 1: RAW VALIDATION                          |
|   - Check schema integrity, missing values, physical bound violations   |
|   - Validate timestamps and time monotonicity                           |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                 STAGE 2: EXTRACTION & UNIT NORMALIZATION                |
|   - Extract actuals & lead-time forecasts from HDF5                     |
|   - Convert Temperature: Kelvin -> Celsius ($T_C = T_K - 273.15$)       |
|   - Convert Radiation: Diff cumulative Joules/m^2 -> W/m^2 Irradiance   |
|   - Convert Pressure: Pa -> hPa ($P_{hPa} = P_{Pa} / 100$)              |
|   - Cloud cover: Verify in [0.0, 1.0]                                   |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                 STAGE 3: LOAD & GENERATION SYNTHESIS                    |
|   - Station Load ($P_{load}$): Scale Antarctic base load (from          |
|     indicator_59: ~180-250 kW) with diurnal schedule & temp heating     |
|   - PV Power ($P_{PV}$): IEC 61724 PV model with temp derating          |
|   - Wind Power ($P_{wind}$): Turbine power curve model (cut-in, rated,  |
|     cut-out speeds, air density correction from pressure/temperature)   |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                   STAGE 4: FEATURE ENGINEERING                          |
|   - Temporal / Calendar: hour_sin, hour_cos, day_of_year_sin/cos,       |
|     is_polar_day, is_polar_night                                        |
|   - Lagged features: $y_{t-1}, y_{t-2}, y_{t-24}$, rolling statistics  |
|   - Weather features: irradiance, temp, wind_speed, wind_dir, pressure  |
|   - NWP Forecast features: direct NWP forecasted wind, temp, radiation  |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|               STAGE 5: TEMPORAL SPLIT (NO DATA LEAKAGE)                 |
|   - Train Set: First 70% of chronological sequence                      |
|   - Validation Set: Next 15% (for hyperparameter tuning & early stop)   |
|   - Test Set: Final 15% strictly unseen (for benchmark evaluation)      |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                     STAGE 6: FORECASTING MODULES                        |
|                                                                         |
|   1. Station Load Forecaster -> Outputs $\hat{P}_{load, t+1:t+H}$       |
|   2. PV Generation Forecaster -> Outputs $\hat{P}_{PV, t+1:t+H}$         |
|   3. Wind Generation Forecaster -> Outputs $\hat{P}_{wind, t+1:t+H}$     |
+-------------------------------------------------------------------------+
```

---

## 2. Detailed Pipeline Stages

### Stage 1: Validation & Cleaning
- **Boundary Checks:**
  - Wind speed: $0 \le v \le 60\,	ext{m/s}$
  - Temperature: $-60^\circ	ext{C} \le T \le +25^\circ	ext{C}$
  - Irradiance: $0 \le G \le 1200\,	ext{W/m}^2$
  - Surface pressure: $850\,	ext{hPa} \le P \le 1060\,	ext{hPa}$
- **Missing Data Handling:** Forward-fill short gaps ($\le 2\,	ext{hrs}$), spline interpolation for smooth atmospheric state variables.

### Stage 2: Unit Normalization & Derivations
- **Irradiance Calculation:**
  $$G_t = \max\left(0, rac{\Phi_{	ext{sw}, t} - \Phi_{	ext{sw}, t-1}}{\Delta t}ight)$$
- **Air Density Calculation:**
  $$ho = rac{P}{R_{	ext{spec}} \cdot T}$$
  (where $R_{	ext{spec}} = 287.058\,	ext{J/(kg}\cdot	ext{K)}$).

### Stage 3: Physical Transduction Models
- **PV Model:**
  $$P_{	ext{PV}}(t) = P_{	ext{PV,nom}} \cdot rac{G_t}{G_{	ext{STC}}} \cdot \left[1 + \gamma (T_{	ext{cell}}(t) - 25)ight]$$
  $$T_{	ext{cell}}(t) = T_{	ext{amb}}(t) + G_t \cdot rac{	ext{NOCT} - 20}{800}$$
- **Wind Model:**
  Standard piecewise turbine power curve:
  $$P_{	ext{wind}}(v) = egin{cases} 
  0 & v < v_{	ext{in}} 	ext{ or } v > v_{	ext{out}} \
  P_{	ext{rated}} \cdot rac{v^3 - v_{	ext{in}}^3}{v_{	ext{rated}}^3 - v_{	ext{in}}^3} \cdot \left(rac{ho}{ho_0}ight) & v_{	ext{in}} \le v < v_{	ext{rated}} \
  P_{	ext{rated}} \cdot \left(rac{ho}{ho_0}ight) & v_{	ext{rated}} \le v \le v_{	ext{out}}
  \end{cases}$$
- **Station Load Model:**
  $$P_{	ext{load}}(t) = P_{	ext{base}} \cdot f_{	ext{diurnal}}(t) \cdot \left[1 + k_{	ext{heat}} \max(0, T_{	ext{set}} - T_{	ext{amb}}(t))ight] + \epsilon(t)$$
  calibrated to match Mawson/Casey average levels ($150 - 250\,	ext{kW}$).

### Stage 4: Feature Engineering
- **Cyclical Temporal Encodings:**
  - $\sin\left(rac{2\pi \cdot 	ext{hour}}{24}ight), \cos\left(rac{2\pi \cdot 	ext{hour}}{24}ight)$
  - $\sin\left(rac{2\pi \cdot 	ext{day}}{365.25}ight), \cos\left(rac{2\pi \cdot 	ext{day}}{365.25}ight)$
- **Atmospheric & Solar Features:**
  - Solar zenith angle / extraterrestrial solar index
  - Wind speed cube ($v^3$), wind shear estimate
  - Rolling mean, standard deviation, min, max (window sizes: 3h, 6h, 24h)
- **Lag Features:**
  - $y_{t-1}, y_{t-2}, y_{t-3}, y_{t-24}, y_{t-48}$

### Stage 5: Train / Validation / Test Splitting
- **Strict Chronological Ordering:** No random shuffling to prevent future information leakage into historical training windows.
- **Split Ratio:**
  - Train: 70% (Jan – Aug)
  - Validation: 15% (Aug – Sep)
  - Test: 15% (Oct – Nov)

### Stage 6: Independent Forecasting Models
Per Section 5 of the PolarEMS Student Implementation Guide, three distinct forecasting tasks will be established:
1. **Station Load Forecaster:** $\hat{P}_{	ext{load}, t+1:t+H}$
2. **PV Generation Forecaster:** $\hat{P}_{	ext{PV}, t+1:t+H}$
3. **Wind Generation Forecaster:** $\hat{P}_{	ext{wind}, t+1:t+H}$

Evaluation will use standard metrics: **MAE**, **RMSE**, and **MAPE**, comparing baseline models (Persistence, Ridge/Linear, Tree-based GBDT) with sequence models.
