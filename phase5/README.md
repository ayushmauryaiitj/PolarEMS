# PolarEMS Phase 5: Digital Microgrid Simulation & Benchmarking

**Project:** PolarEMS — AI-Assisted Predictive Energy Management for Renewable–Battery–Diesel Microgrids in Polar Research Stations  
**Module:** Digital Simulation & Benchmark Evaluation  
**Date:** September 18, 2026  

---

## 1. Overview & Architecture

Phase 5 evaluates the PolarEMS predictive optimization framework against traditional industrial dispatch baselines across 4 comprehensive polar operating scenarios.

### Strategies Compared
1. **Strategy A (Diesel-Only Baseline):** Traditional diesel-only generation without renewables or battery storage.
2. **Strategy B (Rule-Based Hybrid Baseline):** Instantaneous heuristic priority dispatch:
   $$\text{Renewable} \longrightarrow \text{Battery Surplus/Deficit} \longrightarrow \text{Diesel Backup} \longrightarrow \text{Load Shedding (ENS)}$$
3. **Strategy C (PolarEMS Predictive GAMS):** 24-hour predictive dispatch using multi-step ML forecasts and Mixed-Integer Linear Programming (MIP).

---

## 2. The 4 Benchmark Scenarios

1. **Scenario 1 (Normal / High Renewable):** Representative high solar and wind window ($~2,780\,\text{kWh}$ RE available) with standard $2,000\,\text{L}$ fuel reserve.
2. **Scenario 2 (Renewable Drought / Restricted Fuel):** Extreme sub-cut-in wind lull ($v < 3\,\text{m/s}$) and low solar ($22.8\,\text{kWh}$ RE available) under emergency $1,000\,\text{L}$ fuel restriction.
3. **Scenario 3 (High Demand Operation):** Peak mid-winter heating demand ($5,431.2\,\text{kWh}$) under extreme cold and continuous base load.
4. **Scenario 4 (Renewable Failure / Severe Storm):** Sudden 90% renewable capacity loss ($\alpha_{\text{RE}} = 0.10$) caused by severe blizzard icing and turbine cut-out.

---

## 3. Standardized Metrics
* **Total Load & Renewable Energy (kWh):** Energy demand, available renewable generation, and renewable energy utilized.
* **Renewable Penetration (%):** Percentage of total electrical load supplied directly by solar and wind.
* **Diesel Fuel Consumption (L):** Total litres of fuel burned by backup generators.
* **Energy Not Served / ENS (kWh):** Unmet electrical demand.
* **CO2 Emissions (kg):** Estimated carbon emissions based on $2.68\,\text{kg } CO_2 / \text{L}$ diesel fuel.
* **Operating Cost ($):** Total cost including fuel ($$1.50/\text{L}$), ENS penalty ($$10.00/\text{kWh}$), and battery degradation ($$0.02/\text{kWh}$).

---

## 4. Execution Command
```powershell
python phase5/run_benchmark.py
```
