# PolarEMS Dataset Report

**Project:** PolarEMS — AI-Assisted Predictive Energy Management for Renewable–Battery–Diesel Microgrids in Polar Research Stations  
**Team:** Buddhi Quant (SIH 2026)  
**Date:** September 18, 2026  

---

## 1. SOE_SFU Dataset Inspection

The `data/raw/SOE_SFU/` directory contains historical operational reports archived by the **Australian Antarctic Data Centre (AADC)** under metadata entry `SOE_SFU` (*Monthly electricity usage at Australian Antarctic Stations*). The data covers 4 primary Australian Antarctic / sub-Antarctic stations: **Casey**, **Davis**, **Mawson**, and **Macquarie Island** (plus vehicle fuel tracking at **Wilkins Runway**).

### Summary Table

| File | Meaning / Description | Resolution | Date Range | Unit | Missing Records | Useful For |
|---|---|---|---|---|---|---|
| `indicator_56.csv` | Monthly fuel usage of the generator sets and boilers | Monthly | Jan 1993 – Feb 2016 | litres | 0 / 916 | Fuel inventory sizing, diesel generator specific fuel consumption baseline, seasonal fuel burn calibration |
| `indicator_57.csv` | Monthly incinerator fuel usage of Antarctic stations | Monthly | Jan 1995 – Feb 2016 | litres | 14 / 936 | Non-generation station auxiliary thermal fuel baseline |
| `indicator_58.csv` | Monthly total vehicle fuel usage | Monthly | Jan 1993 – Feb 2016 | litres | 6 / 1013 | Mobile station fuel logistics & inventory management |
| `indicator_59.csv` | **Monthly electricity usage at Australian Antarctic Stations** | **Monthly** | **Jan 1986 – Feb 2016** | **kWh** | **22 / 1432** | **Station electrical load baseline, seasonal demand profile calibration, station microgrid load sizing** |

> **Key Finding:** `indicator_59.csv` is the confirmed Antarctic station electricity/load dataset. Station monthly electricity demands range from ~30,000 kWh/month (Macquarie Island) to ~130,000–259,000 kWh/month (Mawson/Davis/Casey), representing an average continuous electrical power load of **150 kW – 350 kW**.

---

## 2. met_data.h5 Dataset Inspection

The `data/raw/met_data.h5` file contains high-resolution numerical weather prediction (NWP) model forecasts and surface observations for a polar/sub-polar location (`lat63_41_lon10_11`: Lat 63.41°N, Lon 10.11°E).

- **Root Group:** `lat63_41_lon10_11` (single spatial coordinate node)
- **Forecast Structure:** 1,445 forecast issue cycles across year 2020 (issued 4 times daily at 00Z, 06Z, 12Z, 18Z), each cycle providing a **61-hour prediction horizon** ($t = 0\text{h}$ to $t = 60\text{h}$) at **1-hour discrete steps**.
- **Spatial / Ensemble Dimensions:** 4 grid columns for scalar parameters; 9 grid columns ($3 \times 3$ spatial grid) for vector wind fields.

### Summary Table

| Variable Name in HDF5 | Available? | Unit in File | Time Resolution | Date Range | Potential Use |
|---|---|---|---|---|---|
| `wind_speed_10m` | **YES** (Actuals + Forecasts) | m/s | Hourly (60h horizon) | Actuals: 2020-01-01 to 2020-11-01 (7,321 hrs)<br>Forecasts: 2020-01-01 to 2020-12-31 (1,445 cycles) | **Wind power forecasting**, wind generation simulation, high-wind variability scenario |
| `wind_direction_10m` | **YES** (Forecasts only) | Degrees ($0^\circ-360^\circ$) | Hourly (60h horizon) | Forecasts: 2020-01-01 to 2020-12-31 (1,445 cycles, 9 grid points) | **Wind power forecasting** (wake loss / directional turbine efficiency) |
| `integral_of_surface_downwelling_shortwave_flux_in_air_wrt_time` | **YES** (Forecasts only) | $\text{J/m}^2$ (cumulative flux) | Hourly (60h horizon) | Forecasts: 2020-01-01 to 2020-12-31 (1,445 cycles, 4 grid points) | **PV power forecasting** & solar irradiance calculation ($\text{W/m}^2$ via hourly differencing) |
| `air_temperature_2m` | **YES** (Forecasts only) | Kelvin ($\text{K}$) | Hourly (60h horizon) | Forecasts: 2020-01-01 to 2020-12-31 (1,445 cycles, 4 grid points) | **Load forecasting** (heating load correlation), PV cell efficiency derating, battery thermal derating |
| `cloud_area_fraction` | **YES** (Forecasts only) | Fraction ($0.0 - 1.0$) | Hourly (60h horizon) | Forecasts: 2020-01-01 to 2020-12-31 (1,445 cycles, 4 grid points) | **PV power forecasting**, extreme weather / blizzard scenario detection |
| `air_pressure_at_sea_level` | **YES** (Forecasts only) | $\text{Pa}$ ($\approx 10^5\,\text{Pa}$) | Hourly (60h horizon) | Forecasts: 2020-01-01 to 2020-12-31 (1,445 cycles, 4 grid points) | Air density calculation for wind turbine aerodynamic power, storm detection |
| `relative_humidity` | **NO** | N/A | N/A | N/A | Not present in HDF5 |

---

## 3. Recommended Unified ML Schema

| Column Name | Status | Source / Derivation Method | Unit |
|---|---|---|---|
| `timestamp` | **AVAILABLE** | Primary time index from `met_data.h5` | ISO 8601 UTC |
| `wind_speed_ms` | **AVAILABLE** | Directly extracted from `wind_speed_10m` (`actual` and `forecast`) | $\text{m/s}$ |
| `wind_direction_deg` | **AVAILABLE** | Directly extracted from `wind_direction_10m` `forecast` ($t=0$ or center grid) | $\text{deg}$ ($^\circ$) |
| `temperature_c` | **DERIVABLE** | Converted from `air_temperature_2m`: $T_{\text{°C}} = T_{\text{K}} - 273.15$ | $^{\circ}\text{C}$ |
| `irradiance_w_m2` | **DERIVABLE** | Differencing hourly cumulative shortwave flux: $G = \frac{\Delta \Phi_{\text{sw}}}{3600\,\text{s}}$ (clamped $\ge 0$) | $\text{W/m}^2$ |
| `pressure_hpa` | **DERIVABLE** | Converted from `air_pressure_at_sea_level`: $P_{\text{hPa}} = P_{\text{Pa}} / 100$ | $\text{hPa}$ |
| `cloud_cover` | **AVAILABLE** | Directly extracted from `cloud_area_fraction` ($0.0 \text{ to } 1.0$) | fraction |
| `solar_kw` | **DERIVABLE / SIMULATED** | Standard PV physical model: $P_{\text{PV}} = P_{\text{rated}} \cdot \frac{G}{1000} \cdot [1 + \gamma (T_{\text{cell}} - 25)]$ | $\text{kW}$ |
| `wind_kw` | **DERIVABLE / SIMULATED** | Standard Wind Turbine power curve: $P_{\text{wind}}(v)$ from $v_{\text{cut-in}}$ to $v_{\text{cut-out}}$ | $\text{kW}$ |
| `load_kw` | **DERIVABLE / SIMULATED** | Antarctic station demand calibrated using `indicator_59.csv` monthly profile modulated with hourly temperature and activity cycles | $\text{kW}$ |
| `humidity` | **NOT AVAILABLE** | Not present in raw datasets; set to polar standard reference if needed | $\%$ |

---

## 4. Dataset Compatibility & Integration Architecture

### Why SOE_SFU and met_data.h5 Cannot Be Joined Directly:
1. **Temporal Discrepancy:** `SOE_SFU` is aggregated at **monthly** resolution; `met_data.h5` is at **hourly** resolution.
2. **Date Range Mismatch:** `SOE_SFU` covers **1986–2016**; `met_data.h5` covers **2020**.
3. **Geographic Differences:** `SOE_SFU` represents Australian Antarctic stations (Mawson $-67.6^\circ$, Davis $-68.5^\circ$, Casey $-66.2^\circ$), while `met_data.h5` is from a subpolar station grid ($63.41^\circ\text{N}, 10.11^\circ\text{E}$).

### Correct Multi-Tier Architecture:
- **Tier 1 (NWP Meteorological Backbone):** `met_data.h5` serves as the high-frequency temporal engine providing realistic weather dynamics (wind speeds, solar irradiation, temperatures, pressures) and genuine NWP multi-step forecasts ($H = 24\text{h} - 48\text{h}$).
- **Tier 2 (Antarctic Macro Ground-Truth):** `indicator_59.csv` provides empirical Antarctic load scales and seasonal modulation factors (winter peak load vs summer baseline).
- **Tier 3 (Physical Transduction Layer):** Standard physical microgrid generation models transduce weather actuals/forecasts into renewable generation ($P_{\text{PV}}$, $P_{\text{wind}}$), and thermal-load models synthesize station load ($P_{\text{load}}$) aligned with Antarctic historical norms.
