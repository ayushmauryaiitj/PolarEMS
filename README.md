# PolarEMS — AI-Assisted Predictive Energy Management for Polar Research Stations

**Team:** Buddhi Quant  
**Hackathon:** Smart India Hackathon (SIH 2026)  
**Project:** PolarEMS (Renewable–Battery–Diesel Microgrid Predictive Energy Management)  

---

## 1. Project Overview

PolarEMS is a software-based predictive energy management system designed for isolated hybrid microgrids in extreme polar research stations. The hybrid microgrid comprises:
- Photovoltaic (PV) solar generation (100 kW rated)
- Wind turbine generation (150 kW rated)
- Battery Energy Storage System (BESS)
- Backup Diesel Generator(s) supplying station critical and baseline electrical loads

### Core Operating Concept
$$\text{Measure} \longrightarrow \text{Forecast} \longrightarrow \text{Optimize} \longrightarrow \text{Dispatch} \longrightarrow \text{Simulate} \longrightarrow \text{Update}$$

> [!NOTE]
> PolarEMS is a **digital decision-support prototype** and simulation testbed. It does not directly control physical hardware.

---

## 2. Data Provenance and Assumptions

### A. Real / Source-Derived
- **Antarctic Monthly Electricity Statistics:** Extracted from Australian Antarctic Data Centre (AADC) State of the Environment metadata `SOE_SFU` (`indicator_59.csv`). Represents 30 years (1986–2016) of empirical electricity consumption across Australian Antarctic stations (Mawson, Davis, Casey, Macquarie Island), establishing the true baseline scale (~150–350 kW continuous demand).
- **Meteorological / NWP Forecast Backbone:** Extracted from `met_data.h5` (`lat63_41_lon10_11`), providing real high-frequency weather observations and numerical weather prediction (NWP) multi-step forecast blocks.

### B. Derived Features
- **Solar Irradiance ($G$, $\text{W/m}^2$):** Derived by differencing consecutive hourly cumulative surface downwelling shortwave radiation flux and dividing by 3600 seconds, with physical non-negative clipping ($G \ge 0$).
- **PV Generation ($P_{\text{pv}}$, $\text{kW}$):** Derived via physical cell conversion with temperature derating:
  $$P_{\text{pv}} = P_{\text{pv,nom}} \cdot \left(\frac{G}{1000}\right) \cdot [1 + \gamma (T_{\text{cell}} - 25)]$$
- **Wind Generation ($P_{\text{wind}}$, $\text{kW}$):** Derived via non-linear turbine power curve with polar air density correction:
  - Cut-in: $3.0\,\text{m/s}$, Rated: $12.0\,\text{m/s}$, Cut-out: $25.0\,\text{m/s}$
- **Hourly Station Load Profile ($P_{\text{load}}$, $\text{kW}$):** Synthesized from Antarctic monthly statistics (`indicator_59.csv`), modulated with diurnal human/station operational schedules, ambient temperature space-heating demand, deterministic harmonics, and small reproducible stochastic noise.

### C. Synthetic
- **Hourly Station Load:** Synthetic hourly time series calibrated to empirical Antarctic monthly statistics.
- **Hourly PV Generation:** Synthetic generation profiles based on physical transduction of NWP solar flux.
- **Hourly Wind Generation:** Synthetic generation profiles based on physical aerodynamic power curves.

### D. Important Limitations & Disclaimers
- PolarEMS uses publicly available Antarctic station electricity statistics to establish the station load scale, while the hourly meteorological backbone and forecast structure are derived from the available NWP dataset.
- The location represented in `met_data.h5` is approximately Lat $63.41^\circ\text{N}$, Lon $10.11^\circ\text{E}$ (sub-polar). It must **NOT** be described as measured Antarctic weather observations.
- Polar-specific operating conditions (e.g., severe blizzards, extreme polar nights, component derating, fuel restriction) are subsequently represented through dedicated scenario parameter engines during digital simulation.

---

## 3. Data Processing & Validation

### Pipeline Execution
```powershell
# 1. Run offline data processing and feature engineering
python data/data_processor.py

# 2. Run visual validation and diagnostic plot generation
python data/validate_processed_data.py
```

### Processed Artifacts
- `data/processed/polar_microgrid_hourly.csv`: 8,784 hourly records (Full Year 2020) with 16 canonical features.
- `data/processed/data_quality_report.json`: Automated data quality & boundary audit report.
- `data/processed/weather_overview.png`: Meteorological overview plot.
- `data/processed/load_profile.png`: Station load time series & seasonal boxplots.
- `data/processed/renewable_generation.png`: PV and wind generation profiles.
- `data/processed/daily_energy_profile.png`: 24-hour diurnal profile and 72-hour operating dispatch snapshot.

---

## 4. Phase 4: GAMS Mixed-Integer Linear Programming (MIP) Optimization

PolarEMS formulates a 24-hour rolling horizon microgrid optimization problem in GAMS (`optimization/polarems.gms`):
- **Objective:** Minimize fuel consumption, unserved load penalty (ENS), and battery degradation cycling costs.
- **Constraints:** Power balance, battery SOC bounds [20%–100%], charge/discharge ramp rates, generator minimum runtimes, and fuel conservation.
- **Solver:** Solved using high-performance MILP solvers (e.g. CPLEX / CBC / SCIP) via GAMS executable.

---

## 5. Phase 5: Digital Microgrid Simulation & Benchmarking

Benchmarking evaluates 3 operational strategies across 4 polar operating scenarios:
1. **Strategies:**
   - **Diesel-Only Baseline:** Traditional remote station generation.
   - **Rule-Based Hybrid:** Heuristic priority dispatch ($RE \to \text{Battery} \to \text{Diesel} \to \text{ENS}$).
   - **PolarEMS Predictive MIP:** 24-hour look-ahead GAMS optimization.
2. **Scenarios:**
   - **Scenario 1:** Normal / High Renewable (Apr 13) — 50.7% fuel savings, zero ENS.
   - **Scenario 2:** Drought / Restricted Fuel (Nov 07) — Emergency fuel rationing ($1,000\,\text{L}$), optimal resilience dispatch.
   - **Scenario 3:** High Demand / Winter Heating (Jul 28) — Mid-winter peak heating demand ($5,431.2\,\text{kWh}$).
   - **Scenario 4:** Severe Storm / Derated RE (10%) — Blizzard turbine furling and snow coverage.

---

## 6. Phase 6: PolarEMS Decision Dashboard (React + FastAPI)

A modern, dark-first polar command center web dashboard providing real-time decision support for polar research station operators.

### Architecture
- **Backend (`backend/`):** FastAPI REST API running on port 8000. Serves real Phase 5 simulation telemetry, 24h ML forecasts, live energy flow graph, and dynamic rules-based alerts.
- **Frontend (`frontend/`):** React 19 + TypeScript + Vite + Tailwind CSS v4 + Recharts + Lucide Icons running on port 5173.
- **Data Integration:** Directly reads `results/phase5/benchmark_results.csv`, `benchmark_summary.json`, `detailed_simulation_cache.json`, and trained ML models in `models/`.

### Core Views
1. **Overview:** Command center HUD with live KPIs, station status pill (NOMINAL / ADVISORY / SHEDDING), and 24h dispatch overview.
2. **Live Energy Flow:** Interactive animated microgrid bus diagram showing Solar PV (100 kW), Wind (150 kW), Battery BESS (200 kWh), and Diesel GenSet (200 kW) power routing with timeline scrubber.
3. **AI Forecast:** 24-hour ML forecast curves (Load, Solar, Wind) vs simulated actuals with deficit hour insights.
4. **Predictive Dispatch:** Stacked generation area chart, battery SOC trajectory, fuel flow rate (L/h), and tabular telemetry log.
5. **Scenario Simulator:** Interactive scenario switcher between the 4 operational stress-tests with live metric recomputation.
6. **Benchmark Matrix:** 3-Strategy comparative matrix with metric filters (Fuel, ENS, RE %, CO2, Cost) and exact Phase 5 tables.
7. **Risk / Alerts:** Derived alarms (HIGH, WARNING, INFO) computed directly from simulation dispatch states.
8. **Reports & Audits:** Executive audit summary, carbon abatement metrics, hardware specifications, and official scientific disclaimer.

### How to Run PolarEMS Decision Dashboard

#### 1. Start the FastAPI Backend
```powershell
# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Start FastAPI backend server
uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
Backend API will be available at `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.

#### 2. Start the React Frontend
```powershell
cd frontend
npm install
npm run dev
```
Frontend web interface will be accessible at `http://localhost:5173`.

### Scientific Scope & Disclaimer
> [!IMPORTANT]
> Simulation results are derived from the project demonstration dataset and are not field validation results. PolarEMS operates as a decision-support prototype evaluating mathematical microgrid optimization models.
