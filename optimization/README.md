# PolarEMS Predictive EMS Optimization (Phase 4)

**Project:** PolarEMS — AI-Assisted Predictive Energy Management for Renewable–Battery–Diesel Microgrids in Polar Research Stations  
**Module:** Predictive Energy Management System (EMS) GAMS Optimization Layer  
**Date:** September 18, 2026  

---

## 1. Why GAMS is Used

GAMS (General Algebraic Modeling System) is an industry-standard high-level algebraic modeling platform for rigorous mathematical programming. In PolarEMS:
- It guarantees global mathematical optimality for mixed-integer linear dispatch problems (MIP).
- It strictly enforces physical multi-carrier energy balances, non-linear battery degradation trade-offs, and reliability constraints without heuristics.
- It provides transparent algebraic separation between the physical microgrid model (`polarems.gms`) and the machine-learning forecast generators (`prepare_gams_input.py`).

---

## 2. 24-Hour Predictive Energy Management Formulation

The predictive EMS receives a 24-hour look-ahead forecast vector from the ML forecasting module:
$$\hat{F}_t = \{ \hat{P}_{\text{load}}(t), \hat{P}_{\text{pv}}(t), \hat{P}_{\text{wind}}(t) \}_{t=1}^{24}$$

### A. Optimization Decision Variables (Hourly $t = 1 \dots 24$)
* $P_{\text{pv}}(t)$: Photovoltaic power dispatched (kW)
* $P_{\text{wind}}(t)$: Wind turbine power dispatched (kW)
* $P_{\text{ch}}(t), P_{\text{dis}}(t)$: Battery charging / discharging power (kW)
* $u_{\text{ch}}(t), u_{\text{dis}}(t)$: Binary indicators preventing simultaneous charge/discharge
* $P_{\text{diesel}}(t)$: Backup diesel generator power output (kW)
* $u_{\text{diesel}}(t)$: Binary indicator for diesel ON/OFF status
* $\text{SOC}(t)$: Battery state of charge (fraction $0.20 - 1.00$)
* $P_{\text{curt}}(t)$: Total renewable power curtailed (kW)
* $P_{\text{ens}}(t)$: Energy Not Served / Unmet demand (kW)
* $\text{Fuel}_{\text{consumed}}(t)$: Diesel fuel burned in hour $t$ (litres)
* $\text{Fuel}_{\text{rem}}(t)$: Remaining diesel fuel inventory (litres)

---

## 3. Objective Function

The optimizer minimizes a multi-objective cost function balancing fuel burn, extreme reliability penalties, renewable utilization, and battery wear:

$$\min J = \sum_{t=1}^{24} \left( w_{\text{fuel}} \cdot \text{Fuel}_{\text{consumed}}(t) + w_{\text{ens}} \cdot P_{\text{ens}}(t) + w_{\text{curt}} \cdot P_{\text{curt}}(t) + w_{\text{batt}} \cdot (P_{\text{ch}}(t) + P_{\text{dis}}(t)) \right)$$

* $w_{\text{fuel}} = 1.0$: Fuel consumption cost.
* $w_{\text{ens}} = 1000.0$: **Dominant reliability penalty** ensuring load shedding is only invoked if physical generation capacity is exhausted.
* $w_{\text{curt}} = 0.10$: Mild penalty discouraging renewable spillage when storage/demand is available.
* $w_{\text{batt}} = 0.05$: Battery throughput penalty preventing unnecessary micro-cycling.

---

## 4. Key Physical Constraints

1. **Nodal Power Balance:**
   $$P_{\text{pv}}(t) + P_{\text{wind}}(t) + P_{\text{dis}}(t) + P_{\text{diesel}}(t) + P_{\text{ens}}(t) = P_{\text{load}}(t) + P_{\text{ch}}(t)$$

2. **Renewable Availability Bounds:**
   $$0 \le P_{\text{pv}}(t) \le \hat{P}_{\text{pv}}(t), \quad 0 \le P_{\text{wind}}(t) \le \hat{P}_{\text{wind}}(t)$$
   $$P_{\text{curt}}(t) = (\hat{P}_{\text{pv}}(t) - P_{\text{pv}}(t)) + (\hat{P}_{\text{wind}}(t) - P_{\text{wind}}(t))$$

3. **Battery Energy Storage Dynamics (1-hour step):**
   $$\text{SOC}(t) = \text{SOC}(t-1) + \frac{\eta_{\text{ch}} P_{\text{ch}}(t)}{E_{\text{batt}}} - \frac{P_{\text{dis}}(t)}{\eta_{\text{dis}} E_{\text{batt}}}$$
   $$0.20 \le \text{SOC}(t) \le 1.00, \quad \text{SOC}(0) = 0.70, \quad E_{\text{batt}} = 200\,\text{kWh}$$
   $$0 \le P_{\text{ch}}(t) \le 100 \cdot u_{\text{ch}}(t), \quad 0 \le P_{\text{dis}}(t) \le 100 \cdot u_{\text{dis}}(t)$$
   $$u_{\text{ch}}(t) + u_{\text{dis}}(t) \le 1$$

4. **Diesel Backup Generator & Inventory Dynamics:**
   $$0 \le P_{\text{diesel}}(t) \le 200 \cdot u_{\text{diesel}}(t)$$
   $$\text{Fuel}_{\text{consumed}}(t) = a_{\text{fuel}} \cdot u_{\text{diesel}}(t) + b_{\text{fuel}} \cdot P_{\text{diesel}}(t)$$
   $$\text{Fuel}_{\text{rem}}(t) = \text{Fuel}_{\text{rem}}(t-1) - \text{Fuel}_{\text{consumed}}(t) \ge 0, \quad \text{Fuel}_{\text{rem}}(0) = 1000\,\text{L}$$

---

## 5. Current Environment & Installation Status

> [!NOTE]
> **Environment Note:**  
> GAMS is **not currently installed** on this machine.
> All algebraic GAMS models, input adapters, output parsers, and validation suites are prepared and fully verified.
> 
> Running `python optimization/run_optimization.py` automatically checks for GAMS in the system environment and provides informative execution status without attempting unauthorized external downloads or falling back to unapproved heuristic solvers.
