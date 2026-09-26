import React from 'react';
import { 
  Zap, 
  Battery, 
  Flame, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight,
  ShieldAlert,
  Sun,
  Leaf,
  DollarSign
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { ScenarioMeta, StrategyName, DispatchRecord, BenchmarkRow } from '../../types';
import { MetricCard } from '../common/MetricCard';
import { SimulationBadge } from '../common/SimulationBadge';
import { TabId } from '../layout/Sidebar';
import { useTheme } from '../../context/ThemeContext';

interface OverviewViewProps {
  scenario: ScenarioMeta;
  strategy: StrategyName;
  dispatchRecords: DispatchRecord[];
  benchmarkRows: BenchmarkRow[];
  alerts: any[];
  onNavigateTab: (tab: TabId) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  scenario,
  strategy,
  dispatchRecords,
  benchmarkRows,
  alerts,
  onNavigateTab,
}) => {
  const { isDark } = useTheme();

  const isMatch = (b: BenchmarkRow) =>
    b.scenario === scenario.name ||
    b.scenario === scenario.id ||
    b.scenario.toLowerCase().includes(scenario.id.replace('_', ' ')) ||
    b.scenario.startsWith(scenario.name.split(':')[0]);

  const currentBench = benchmarkRows.find(
    (b) => isMatch(b) && b.strategy === strategy
  );

  const dieselBench = benchmarkRows.find(
    (b) => isMatch(b) && b.strategy === 'Diesel-Only'
  );

  const fuelSavedL = dieselBench && currentBench
    ? Math.max(0, dieselBench.diesel_fuel_consumed_l - currentBench.diesel_fuel_consumed_l)
    : 0;

  const fuelSavedPct = dieselBench && dieselBench.diesel_fuel_consumed_l > 0
    ? (fuelSavedL / dieselBench.diesel_fuel_consumed_l) * 100
    : 0;

  const co2AvoidedKg = fuelSavedL * 2.68;

  const totalLoad = currentBench?.total_load_kwh ?? scenario.total_load_kwh;
  const rePenPct = currentBench?.re_penetration_pct ?? 0;
  const ensKwh = currentBench?.ens_kwh ?? 0;
  const reliability = totalLoad > 0 ? Math.max(0, (1 - ensKwh / totalLoad) * 100) : 100;
  const fuelConsumedL = currentBench?.diesel_fuel_consumed_l ?? 0;
  const finalSoc = (currentBench?.soc_final ?? 0.7) * 100;
  const operatingCost = currentBench?.operating_cost_usd ?? 0;

  return (
    <div className="space-y-6">
      {/* 24-Hour Optimization Outcome Hero Banner */}
      <div className="rounded-2xl border border-cyan-200 dark:border-cyan-500/30 bg-gradient-to-br from-cyan-50/80 via-white to-slate-50 dark:from-[#0c1a2e] dark:via-[#0d1624] dark:to-[#070b12] p-6 shadow-sm dark:shadow-xl relative overflow-hidden transition-all duration-200">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-500/40 text-cyan-800 dark:text-cyan-300">
                24-Hour Optimization Outcome
              </span>
              <SimulationBadge scenarioName={scenario.name} />
            </div>

            <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {strategy.includes('PolarEMS') ? (
                <span>
                  PolarEMS reduced diesel dependence by{' '}
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold font-mono">
                    {fuelSavedPct.toFixed(1)}%
                  </span>{' '}
                  in this simulated horizon.
                </span>
              ) : (
                <span>
                  Active Strategy: <span className="text-cyan-700 dark:text-cyan-300">{strategy}</span>
                </span>
              )}
            </h1>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              Predictive dispatch schedules BESS storage against forward wind & bifacial solar forecasts to maximize renewable penetration while preserving cold-climate thermal and reliability reserves.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-mono text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Fuel Saved: <strong className="text-slate-900 dark:text-slate-100">{fuelSavedL.toFixed(1)} L</strong></span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>CO₂ Avoided: <strong className="text-slate-900 dark:text-slate-100">{co2AvoidedKg.toFixed(1)} kg</strong></span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Grid Reliability: <strong className="text-slate-900 dark:text-slate-100">{reliability.toFixed(1)}%</strong></span>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto">
            <button
              onClick={() => onNavigateTab('energy_flow')}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-medium text-xs font-mono transition-all flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer"
            >
              <span>View Live Energy Flow</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateTab('dispatch')}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 text-xs font-mono transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Inspect MIP Schedule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (High Visual Hierarchy) */}
      <div className="space-y-3">
        <div className="text-[11px] font-mono font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
          Core Operating Telemetry
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Station Demand"
            value={totalLoad.toFixed(1)}
            unit="kWh"
            subValue={`Peak: ${scenario.peak_load_kw.toFixed(1)} kW`}
            statusDot="cyan"
            icon={<Zap className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />}
            isPrimary
          />
          <MetricCard
            label="Renewable Penetration"
            value={rePenPct.toFixed(1)}
            unit="%"
            subValue="Solar PV + Wind Turbine"
            statusDot={rePenPct > 30 ? 'green' : 'amber'}
            trend={rePenPct > 30 ? 'positive' : 'neutral'}
            trendText={`${rePenPct.toFixed(1)}% RE`}
            icon={<Sun className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />}
            isPrimary
          />
          <MetricCard
            label="Diesel Fuel Consumed"
            value={fuelConsumedL.toFixed(1)}
            unit="L"
            subValue={`Initial tank: ${scenario.fuel_init_l} L`}
            statusDot={fuelConsumedL < 1000 ? 'green' : 'amber'}
            trend="positive"
            trendText={`-${fuelSavedPct.toFixed(0)}% vs Base`}
            icon={<Flame className="w-4 h-4 text-amber-500 dark:text-amber-400" />}
            isPrimary
          />
          <MetricCard
            label="Energy Not Served (ENS)"
            value={ensKwh.toFixed(1)}
            unit="kWh"
            subValue={ensKwh === 0 ? '100% Demand Met' : 'Controlled Shedding'}
            statusDot={ensKwh === 0 ? 'green' : 'red'}
            trend={ensKwh === 0 ? 'positive' : 'negative'}
            trendText={ensKwh === 0 ? 'Zero ENS' : 'Stress'}
            icon={<ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />}
            isPrimary
          />
        </div>

        {/* Secondary Subsystem Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          <MetricCard
            label="Final Battery SOC"
            value={finalSoc.toFixed(1)}
            unit="%"
            subValue="20% Reserve Margin"
            statusDot={finalSoc >= 30 ? 'green' : 'amber'}
            icon={<Battery className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />}
          />
          <MetricCard
            label="CO₂ Emissions"
            value={(currentBench?.co2_emissions_kg ?? fuelConsumedL * 2.68).toFixed(1)}
            unit="kg"
            subValue="2.68 kg/L factor"
            statusDot="cyan"
            icon={<Leaf className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />}
          />
          <MetricCard
            label="Operating Cost"
            value={`$${operatingCost.toFixed(0)}`}
            subValue="Fuel & GenSet amort."
            statusDot="slate"
            icon={<DollarSign className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
          />
          <MetricCard
            label="Grid Reliability"
            value={reliability.toFixed(1)}
            unit="%"
            subValue="24h Continuous Power"
            statusDot={reliability >= 99 ? 'green' : 'amber'}
            icon={<ShieldCheck className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />}
          />
        </div>
      </div>

      {/* 24-Hour Multi-Source Generation Mix Chart */}
      <div className="bg-white dark:bg-[#0e1524]/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-none space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              24-Hour Multi-Source Generation Mix (kW)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simulated time-series power dispatch across Solar, Wind, Battery, and Diesel vs Station Load
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800">
            24 Timesteps (1-Hour Resolution)
          </span>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dispatchRecords} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorWind" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorBattery" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorDiesel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
              <XAxis dataKey="hour" stroke="#64748b" tickFormatter={(v) => `T+${v}`} fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} unit=" kW" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#090e1a' : '#ffffff', 
                  borderColor: isDark ? '#334155' : '#cbd5e1', 
                  color: isDark ? '#f1f5f9' : '#0f172a',
                  borderRadius: '8px', 
                  fontSize: '11px', 
                  fontFamily: 'monospace',
                  boxShadow: isDark ? '0 10px 15px -3px rgba(0,0,0,0.5)' : '0 10px 15px -3px rgba(0,0,0,0.1)'
                }} 
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px', fontFamily: 'monospace' }} />
              <Area type="monotone" dataKey="solar_dispatch_kw" stackId="1" stroke="#06b6d4" fill="url(#colorSolar)" name="Solar PV" />
              <Area type="monotone" dataKey="wind_dispatch_kw" stackId="1" stroke="#3b82f6" fill="url(#colorWind)" name="Wind Turbine" />
              <Area type="monotone" dataKey="battery_discharge_kw" stackId="1" stroke="#10b981" fill="url(#colorBattery)" name="Battery Disch." />
              <Area type="monotone" dataKey="diesel_power_kw" stackId="1" stroke="#f59e0b" fill="url(#colorDiesel)" name="Diesel GenSet" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Operational Risk & Action Banner */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 dark:bg-[#0e1524]/90 p-4 rounded-xl border border-amber-200 dark:border-amber-500/30 flex items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-amber-800 dark:text-amber-300 uppercase">
                {alerts.length} Active Operational Advisory Flag{alerts.length > 1 ? 's' : ''}
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 font-sans">
                {alerts[0].title}: {alerts[0].message}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('alerts')}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 transition-colors shadow-sm cursor-pointer"
          >
            Review Alerts
          </button>
        </div>
      )}
    </div>
  );
};
