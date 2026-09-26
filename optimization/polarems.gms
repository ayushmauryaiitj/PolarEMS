* ==============================================================================
* PolarEMS — AI-Assisted Predictive Energy Management System for Polar Stations
* GAMS Optimization Model (24-Hour Predictive Dispatch Horizon)
* Team: Buddhi Quant (SIH 2026)
* ==============================================================================

$Title PolarEMS 24-Hour Predictive Dispatch Optimization Model

$ontext
This model determines the optimal hourly dispatch schedule of Photovoltaic (PV),
Wind turbine, Battery Energy Storage System (BESS), and Backup Diesel Generation
for an isolated polar research station hybrid microgrid over a 24-hour horizon.
$offtext

* --- SETS ---
Set
    t / t1*t24 / ;

Alias (t, tp) ;

* --- MODEL PARAMETERS ---
* Microgrid System Capacities and Technical Parameters
Scalar
    PV_cap          'Rated PV generation capacity (kW)'             / 100.0 /
    Wind_cap        'Rated Wind turbine generation capacity (kW)'   / 150.0 /
    E_batt          'Battery rated energy storage capacity (kWh)'   / 200.0 /
    SOC_init        'Initial Battery State of Charge (fraction)'    / 0.70  /
    SOC_min         'Minimum allowable Battery SOC (fraction)'      / 0.20  /
    SOC_max         'Maximum allowable Battery SOC (fraction)'      / 1.00  /
    P_ch_max        'Maximum Battery charging power (kW)'           / 100.0 /
    P_dis_max       'Maximum Battery discharging power (kW)'        / 100.0 /
    eta_ch          'Battery charging efficiency (fraction)'        / 0.95  /
    eta_dis         'Battery discharging efficiency (fraction)'     / 0.95  /
    P_diesel_min    'Minimum diesel generator power when ON (kW)'   / 0.0   /
    P_diesel_max    'Maximum diesel generator rated power (kW)'     / 200.0 /
    Fuel_init       'Initial diesel fuel inventory (litres)'        / 1000.0 /
    a_fuel          'Diesel no-load standby fuel burn rate (L/h)'   / 5.0   /
    b_fuel          'Diesel incremental specific fuel curve (L/kWh)' / 0.25 /
    
* Objective Function Penalty Weights (Reliability penalty dominates)
    w_fuel          'Weight for diesel fuel consumption ($/L or penalty)' / 1.0     /
    w_ens           'Penalty for unserved load ENS ($/kWh)'               / 1000.0  /
    w_curt          'Penalty for renewable power curtailment ($/kWh)'     / 0.10    /
    w_batt          'Battery cycling / degradation throughput penalty'    / 0.05    /
;

* --- TIME-SERIES INPUT PARAMETERS (Loaded from ML Forecasting Interface) ---
Parameter
    P_load(t)       'Forecast station electrical demand (kW)'
    P_pv_avail(t)   'Forecast PV generation availability (kW)'
    P_wind_avail(t) 'Forecast Wind generation availability (kW)'
;

* Include the generated 24-hour forecasting data
$if exist input/forecast_data.inc $include input/forecast_data.inc

* Default fallback parameters if include file is absent
$if not exist input/forecast_data.inc P_load(t) = 200.0;
$if not exist input/forecast_data.inc P_pv_avail(t) = 10.0;
$if not exist input/forecast_data.inc P_wind_avail(t) = 20.0;

* --- DECISION VARIABLES ---
Variables
    Total_Cost      'Total weighted optimization objective value'
;

Positive Variables
    P_pv(t)         'Dispatched PV generation power (kW)'
    P_wind(t)       'Dispatched Wind turbine power (kW)'
    P_ch(t)         'Battery charging power (kW)'
    P_dis(t)        'Battery discharging power (kW)'
    P_diesel(t)     'Diesel generator output power (kW)'
    SOC(t)          'Battery state of charge at end of hour t (fraction)'
    P_curt(t)       'Total renewable power curtailed (kW)'
    P_curt_pv(t)    'PV power curtailed (kW)'
    P_curt_wind(t)  'Wind power curtailed (kW)'
    P_ens(t)        'Energy Not Served / Unmet electrical demand (kW)'
    Fuel_consumed(t)'Diesel fuel consumed in hour t (litres)'
    Fuel_rem(t)     'Remaining diesel fuel inventory at end of hour t (litres)'
;

Binary Variables
    u_ch(t)         '1 if battery is charging in hour t, 0 otherwise'
    u_dis(t)        '1 if battery is discharging in hour t, 0 otherwise'
    u_diesel(t)     '1 if diesel generator is running in hour t, 0 otherwise'
;

* --- EQUATION DECLARATIONS ---
Equations
    Eq_Objective            'Minimize total operational and reliability costs'
    Eq_PowerBalance(t)      'Microgrid nodal power balance at every hour'
    Eq_PVDispatch(t)        'Dispatched PV plus curtailment equals PV availability'
    Eq_WindDispatch(t)      'Dispatched Wind plus curtailment equals Wind availability'
    Eq_TotalCurtailment(t)  'Total curtailment calculation'
    Eq_ChargePowerLimit(t)  'Battery charging power upper bound'
    Eq_DischPowerLimit(t)   'Battery discharging power upper bound'
    Eq_SimultaneousChargeDischarge(t) 'Prevent simultaneous battery charging and discharging'
    Eq_SOCDynamics_Init     'Battery SOC update for the first hour (t=1)'
    Eq_SOCDynamics(t)       'Battery SOC transition dynamics for subsequent hours (t>1)'
    Eq_SOCMin(t)            'Battery SOC minimum operational limit'
    Eq_SOCMax(t)            'Battery SOC maximum operational limit'
    Eq_DieselMin(t)         'Diesel generator minimum output limit when ON'
    Eq_DieselMax(t)         'Diesel generator maximum output limit'
    Eq_FuelBurn(t)          'Hourly diesel fuel consumption model'
    Eq_FuelInventory_Init   'Diesel fuel inventory balance for the first hour (t=1)'
    Eq_FuelInventory(t)     'Diesel fuel inventory evolution for subsequent hours (t>1)'
    Eq_ENSLimit(t)          'Unserved energy upper bound'
;

* --- EQUATION FORMULATION ---

* 1. Multi-Objective Function (Fuel + Extreme ENS Penalty + Curtailment + Battery Degradation)
Eq_Objective ..
    Total_Cost =e= sum(t,
        w_fuel * Fuel_consumed(t) +
        w_ens  * P_ens(t) +
        w_curt * P_curt(t) +
        w_batt * (P_ch(t) + P_dis(t))
    );

* 2. Microgrid Power Balance Coupling
Eq_PowerBalance(t) ..
    P_pv(t) + P_wind(t) + P_dis(t) + P_diesel(t) + P_ens(t) =e= P_load(t) + P_ch(t);

* 3. Renewable Dispatch & Curtailment Limits
Eq_PVDispatch(t) ..
    P_pv(t) + P_curt_pv(t) =e= P_pv_avail(t);

Eq_WindDispatch(t) ..
    P_wind(t) + P_curt_wind(t) =e= P_wind_avail(t);

Eq_TotalCurtailment(t) ..
    P_curt(t) =e= P_curt_pv(t) + P_curt_wind(t);

* 4. Battery Power Limits & Complementarity
Eq_ChargePowerLimit(t) ..
    P_ch(t) =l= P_ch_max * u_ch(t);

Eq_DischPowerLimit(t) ..
    P_dis(t) =l= P_dis_max * u_dis(t);

Eq_SimultaneousChargeDischarge(t) ..
    u_ch(t) + u_dis(t) =l= 1;

* 5. Battery State of Charge (SOC) Dynamics (Delta_t = 1 hour)
Eq_SOCDynamics_Init ..
    SOC('t1') =e= SOC_init + (eta_ch * P_ch('t1') / E_batt) - (P_dis('t1') / (eta_dis * E_batt));

Eq_SOCDynamics(t)$(ord(t) > 1) ..
    SOC(t) =e= SOC(t-1) + (eta_ch * P_ch(t) / E_batt) - (P_dis(t) / (eta_dis * E_batt));

Eq_SOCMin(t) ..
    SOC(t) =g= SOC_min;

Eq_SOCMax(t) ..
    SOC(t) =l= SOC_max;

* 6. Diesel Generator Operational Bounds
Eq_DieselMin(t) ..
    P_diesel(t) =g= P_diesel_min * u_diesel(t);

Eq_DieselMax(t) ..
    P_diesel(t) =l= P_diesel_max * u_diesel(t);

* 7. Diesel Fuel Consumption and Inventory Tracking
Eq_FuelBurn(t) ..
    Fuel_consumed(t) =e= a_fuel * u_diesel(t) + b_fuel * P_diesel(t);

Eq_FuelInventory_Init ..
    Fuel_rem('t1') =e= Fuel_init - Fuel_consumed('t1');

Eq_FuelInventory(t)$(ord(t) > 1) ..
    Fuel_rem(t) =e= Fuel_rem(t-1) - Fuel_consumed(t);

* 8. Energy Not Served Upper Bound (cannot exceed actual demand)
Eq_ENSLimit(t) ..
    P_ens(t) =l= P_load(t);

* --- MODEL DEFINITION & SOLVE STATEMENT ---
Model polarems / all / ;

* Set solver options for fast MIP convergence
polarems.optfile = 0;
polarems.reslim  = 30;

Solve polarems using mip minimizing Total_Cost;

* --- EXPORT STRUCTURED RESULTS VIA GAMS PUT FACILITY ---
File f_out  / 'output/raw_dispatch.csv' / ;
put f_out;
put 't,load_forecast_kw,solar_forecast_kw,wind_forecast_kw,solar_dispatch_kw,wind_dispatch_kw,battery_charge_kw,battery_discharge_kw,soc,diesel_kw,fuel_consumed_l,fuel_remaining_l,curtailment_kw,ens_kw' / ;
loop(t,
    put t.tl:0 ',',
        P_load(t):0:4 ',',
        P_pv_avail(t):0:4 ',',
        P_wind_avail(t):0:4 ',',
        P_pv.l(t):0:4 ',',
        P_wind.l(t):0:4 ',',
        P_ch.l(t):0:4 ',',
        P_dis.l(t):0:4 ',',
        SOC.l(t):0:4 ',',
        P_diesel.l(t):0:4 ',',
        Fuel_consumed.l(t):0:4 ',',
        Fuel_rem.l(t):0:4 ',',
        P_curt.l(t):0:4 ',',
        P_ens.l(t):0:4 / ;
);
putclose f_out;

File f_meta / 'output/solver_status.txt' / ;
put f_meta;
put 'model_status=' polarems.modelstat / ;
put 'solver_status=' polarems.solvestat / ;
put 'obj_val=' Total_Cost.l:0:4 / ;
putclose f_meta;
