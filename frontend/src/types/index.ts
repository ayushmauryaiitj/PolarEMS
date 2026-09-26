export type ScenarioId = 'scenario_1' | 'scenario_2' | 'scenario_3' | 'scenario_4';
export type StrategyName = 'Diesel-Only' | 'Rule-Based Hybrid' | 'PolarEMS (Predictive GAMS)';
export type SystemStatus = 'NORMAL' | 'WARNING' | 'CRITICAL';

export interface ScenarioMeta {
  id: string;
  name: string;
  description: string;
  fuel_init_l: number;
  soc_init: number;
  start_time: string;
  end_time: string;
  duration_hours: number;
  total_load_kwh: number;
  total_re_avail_kwh: number;
  peak_load_kw: number;
  avg_wind_speed_ms: number;
  avg_temp_c: number;
}

export interface BenchmarkRow {
  scenario: string;
  strategy: string;
  total_load_kwh: number;
  re_used_kwh: number;
  re_curtailed_kwh: number;
  re_penetration_pct: number;
  diesel_fuel_consumed_l: number;
  diesel_fuel_remaining_l: number;
  ens_kwh: number;
  co2_emissions_kg: number;
  operating_cost_usd: number;
  soc_final: number;
  physical_validation_passed: boolean;
}

export interface DispatchRecord {
  hour: number;
  timestamp: string;
  load_kw: number;
  solar_avail_kw: number;
  wind_avail_kw: number;
  re_avail_total_kw: number;
  solar_dispatch_kw: number;
  wind_dispatch_kw: number;
  re_dispatch_total_kw: number;
  diesel_power_kw: number;
  battery_charge_kw: number;
  battery_discharge_kw: number;
  battery_net_kw: number;
  soc_pct: number;
  diesel_fuel_flow_l_h: number;
  fuel_consumed_cum_l: number;
  curtailment_kw: number;
  ens_kw: number;
}

export interface ForecastRecord {
  hour: number;
  timestamp: string;
  load_actual_kw: number;
  load_fc_kw: number;
  solar_actual_kw: number;
  solar_fc_kw: number;
  wind_actual_kw: number;
  wind_fc_kw: number;
  re_actual_total_kw: number;
  re_fc_total_kw: number;
}

export interface ForecastResponse {
  scenario: string;
  records: ForecastRecord[];
  insights: string[];
  metrics: {
    total_load_fc_kwh: number;
    total_re_fc_kwh: number;
    deficit_hours_count: number;
    surplus_hours_count: number;
    peak_load_kw: number;
    peak_load_hour: number;
  };
}

export interface AlertItem {
  id: string;
  level: 'HIGH' | 'WARNING' | 'INFO';
  subsystem: string;
  title: string;
  message: string;
  action: string;
}

export interface AlertsResponse {
  scenario: string;
  strategy: string;
  system_status: SystemStatus;
  active_alerts_count: number;
  alerts: AlertItem[];
}

export interface EnergyFlowNode {
  name: string;
  capacity_kw?: number;
  capacity_kwh?: number;
  current_kw?: number;
  charge_kw?: number;
  discharge_kw?: number;
  net_kw?: number;
  soc_pct?: number;
  mode?: string;
  fuel_rate_lh?: number;
  load_demand_kw?: number;
  power_served_kw?: number;
  unserved_ens_kw?: number;
  curtailed_kw?: number;
  status: string;
}

export interface EnergyFlowResponse {
  scenario: string;
  strategy: string;
  hour: number;
  timestamp: string;
  nodes: {
    solar_pv: EnergyFlowNode;
    wind_turbine: EnergyFlowNode;
    battery_bess: EnergyFlowNode;
    diesel_genset: EnergyFlowNode;
    station_grid: EnergyFlowNode;
  };
  flows: Array<{
    source: string;
    target: string;
    power_kw: number;
    active: boolean;
  }>;
}
