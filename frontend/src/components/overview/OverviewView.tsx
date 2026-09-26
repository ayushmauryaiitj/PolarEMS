import React from 'react';
import { 
  Zap, 
  Battery, 
  Flame, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight,
  ShieldAlert, 
  Leaf,
  Sun,
  Wind
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
  const totalSolar = dispatchRecords.reduce((acc, r) => acc + r.solar_dispatch_kw, 0);
  const totalWind = dispatchRecords.reduce((acc, r) => acc + r.wind_dispatch_kw, 0);
  const totalDieselKw = dispatchRecords.reduce((acc, r) => acc + r.diesel_power_kw, 0);

  const tooltipStyle = {
    backgroundColor: isDark ? '#070d18' : '#ffffff',
    borderColor: isDark ? '#334155' : '#cbd5e1',
    color: isDark ? '#f1f5f9' : '#0f172a',
    borderRadius: '8px',
    fontSize: '11px',
    fontFamily: 'monospace',
    boxShadow: isDark ? '0 10px 15px -3px rgba(0,0,0,0.5)' : '0 10px 15px -3px rgba(0,0,0,0.1)'
  };

  return (
    <div className="space-y-5">
      {/* 1. PRIMARY OPERATIONAL STATUS HEADER */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f1d] p-5 lg:p-6 transition-all shadow-xs relative overflow-hidden">
        {/* Subtle background radar/glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-sans font-semibold bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-600/40 text-cyan-800 dark:text-cyan-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.8)] animate-pulse" />
                POLAREMS // SYSTEM STATUS
              </span>
              <span className="text-xs font-sans font-medium text-slate-500 dark:text-slate-400">
                {scenario.name.split(':')[0]}
              </span>
            </div>

            <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
              {strategy.includes('PolarEMS') ? (
                <span>
                  Microgrid operating within optimal bounds · Reduced diesel dependence by{' '}
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold font-mono tabular-nums">
                    {fuelSavedPct.toFixed(1)}%
                  </span>
                </span>
              ) : (
                <span>
                  Active Baseline Strategy: <span className="text-cyan-700 dark:text-cyan-300">{strategy}</span>
                </span>
              )}
            </h1>

            <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
              Predictive dispatch schedules BESS storage against forward wind & bifacial solar forecasts to maximize renewable penetration while preserving cold-climate thermal and reliability reserves.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-sans text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Fuel Saved: <strong className="text-slate-900 dark:text-slate-100 font-mono tabular-nums font-bold">{fuelSavedL.toFixed(1)}</strong> L</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                <span>CO₂ Avoided: <strong className="text-slate-900 dark:text-slate-100 font-mono tabular-nums font-bold">{co2AvoidedKg.toFixed(1)}</strong> kg</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
                <span>Grid Reliability: <strong className="text-slate-900 dark:text-slate-100 font-mono tabular-nums font-bold">{reliability.toFixed(1)}%</strong></span>
              </span>
            </div>
          </div>

          {/* Quick Action Navigation CTAs */}
          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto">
            <button
              onClick={() => onNavigateTab('energy_flow')}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-semibold text-xs font-sans transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer focus-ring"
            >
              <span>View Live Energy Flow</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateTab('dispatch')}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#111b32] dark:hover:bg-[#16223f] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-sans font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer focus-ring"
            >
              <span>Inspect MIP Schedule</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. UNIFIED COMPACT TELEMETRY STRIP (Not identical floating cards) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f1d] p-3 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800/80">
          {/* 1. Station Demand */}
          <div className="p-3">
            <div className="flex items-center justify-between text-xs font-sans font-medium text-slate-500 dark:text-slate-400 mb-1">
              <span>Station Demand</span>
              <Zap className="w-3.5 h-3.5 text-cyan-500" />
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
              {totalLoad.toFixed(1)} <span className="text-xs font-sans font-normal text-slate-400">kWh</span>
            </div>
            <div className="text-xs font-sans text-slate-500 dark:text-slate-400 mt-1 truncate">
              Peak: <span className="font-mono tabular-nums">{scenario.peak_load_kw.toFixed(1)}</span> kW
            </div>
          </div>

          {/* 2. Renewable Share */}
          <div className="p-3">
            <div className="flex items-center justify-between text-xs font-sans font-medium text-slate-500 dark:text-slate-400 mb-1">
              <span>Renewable Share</span>
              <Sun className="w-3.5 h-3.5 text-cyan-500" />
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold tabular-nums text-cyan-700 dark:text-cyan-300">
              {rePenPct.toFixed(1)} <span className="text-xs font-sans font-normal text-slate-400">%</span>
            </div>
            <div className="text-xs font-sans text-slate-500 dark:text-slate-400 mt-1 truncate">
              PV + Wind Generation
            </div>
          </div>

          {/* 3. Battery SOC */}
          <div className="p-3">
            <div className="flex items-center justify-between text-xs font-sans font-medium text-slate-500 dark:text-slate-400 mb-1">
              <span>Battery SOC</span>
              <Battery className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
              {finalSoc.toFixed(1)} <span className="text-xs font-sans font-normal text-slate-400">%</span>
            </div>
            <div className="text-xs font-sans text-slate-500 dark:text-slate-400 mt-1 truncate">
              20% Reserve Guard
            </div>
          </div>

          {/* 4. Diesel Consumed */}
          <div className="p-3">
            <div className="flex items-center justify-between text-xs font-sans font-medium text-slate-500 dark:text-slate-400 mb-1">
              <span>Diesel Consumed</span>
              <Flame className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold tabular-nums text-amber-700 dark:text-amber-300">
              {fuelConsumedL.toFixed(1)} <span className="text-xs font-sans font-normal text-slate-400">L</span>
            </div>
            <div className="text-xs font-sans font-medium text-emerald-700 dark:text-emerald-400 mt-1 truncate">
              -{fuelSavedPct.toFixed(0)}% vs Base
            </div>
          </div>

          {/* 5. CO2 Emissions */}
          <div className="p-3">
            <div className="flex items-center justify-between text-xs font-sans font-medium text-slate-500 dark:text-slate-400 mb-1">
              <span>CO₂ Emissions</span>
              <Leaf className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
              {(currentBench?.co2_emissions_kg ?? fuelConsumedL * 2.68).toFixed(1)} <span className="text-xs font-sans font-normal text-slate-400">kg</span>
            </div>
            <div className="text-xs font-sans text-slate-500 dark:text-slate-400 mt-1 truncate">
              2.68 kg/L Factor
            </div>
          </div>

          {/* 6. Energy Not Served */}
          <div className="p-3">
            <div className="flex items-center justify-between text-xs font-sans font-medium text-slate-500 dark:text-slate-400 mb-1">
              <span>Unserved (ENS)</span>
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
            </div>
            <div className={`text-xl sm:text-2xl font-mono font-bold tabular-nums ${ensKwh > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-300'}`}>
              {ensKwh.toFixed(1)} <span className="text-xs font-sans font-normal text-slate-400">kWh</span>
            </div>
            <div className="text-xs font-sans text-slate-500 dark:text-slate-400 mt-1 truncate">
              {ensKwh === 0 ? '100% Demand Met' : 'Load Shedding Active'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. DOMINANT 24-HOUR MULTI-SOURCE GENERATION MIX CHART */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f1d] p-5 transition-all shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              24-Hour Multi-Source Generation & Load Trajectory (kW)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simulated time-series power dispatch across Solar, Wind, Battery, and Diesel vs Station Load
            </p>
          </div>
          <span className="text-[10.5px] font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#111b32] px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800 shrink-0">
            24 Timesteps · 1-Hour Step
          </span>
        </div>

        <div className="h-80 w-full min-w-0">
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
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', fontFamily: 'monospace' }} />
              <Area type="monotone" dataKey="solar_dispatch_kw" stackId="1" stroke="#06b6d4" fill="url(#colorSolar)" name="Solar PV" />
              <Area type="monotone" dataKey="wind_dispatch_kw" stackId="1" stroke="#3b82f6" fill="url(#colorWind)" name="Wind Turbine" />
              <Area type="monotone" dataKey="battery_discharge_kw" stackId="1" stroke="#10b981" fill="url(#colorBattery)" name="Battery Disch." />
              <Area type="monotone" dataKey="diesel_power_kw" stackId="1" stroke="#f59e0b" fill="url(#colorDiesel)" name="Diesel GenSet" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. ASYMMETRIC SECONDARY ANALYTICS (Generation Breakdown vs Risk Advisory) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left (2/3 width): Subsystem Power Breakdown */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f1d] p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-semibold font-sans text-slate-800 dark:text-slate-200">
              Subsystem Dispatch & Energy Balance
            </h4>
            <span className="text-xs font-sans text-cyan-700 dark:text-cyan-400">
              Total Generation: <strong className="font-mono tabular-nums">{(totalSolar + totalWind + totalDieselKw).toFixed(1)}</strong> kWh
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Solar Block */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-sans text-cyan-600 dark:text-cyan-400 mb-1">
                <span className="flex items-center gap-1 font-semibold"><Sun className="w-3.5 h-3.5" /> Solar PV</span>
                <span className="font-mono tabular-nums text-[11px]">100 kWp</span>
              </div>
              <div className="text-lg font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {totalSolar.toFixed(1)} <span className="text-xs font-sans font-normal text-slate-400">kWh</span>
              </div>
              <p className="text-xs font-sans text-slate-500 dark:text-slate-400 mt-1">
                Bifacial albedo reflection contribution
              </p>
            </div>

            {/* Wind Block */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-sans text-blue-600 dark:text-blue-400 mb-1">
                <span className="flex items-center gap-1 font-semibold"><Wind className="w-3.5 h-3.5" /> Wind Farm</span>
                <span className="font-mono tabular-nums text-[11px]">150 kW</span>
              </div>
              <div className="text-lg font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {totalWind.toFixed(1)} <span className="text-xs font-sans font-normal text-slate-400">kWh</span>
              </div>
              <p className="text-xs font-sans text-slate-500 dark:text-slate-400 mt-1">
                Arctic katabatic wind turbine yield
              </p>
            </div>

            {/* Diesel GenSet Block */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-sans text-amber-600 dark:text-amber-400 mb-1">
                <span className="flex items-center gap-1 font-semibold"><Flame className="w-3.5 h-3.5" /> Diesel GenSet</span>
                <span className="font-mono tabular-nums text-[11px]">200 kW</span>
              </div>
              <div className="text-lg font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {totalDieselKw.toFixed(1)} <span className="text-xs font-sans font-normal text-slate-400">kWh</span>
              </div>
              <p className="text-xs font-sans text-slate-500 dark:text-slate-400 mt-1">
                Displaced {fuelSavedL.toFixed(0)} L via predictive storage
              </p>
            </div>
          </div>
        </div>

        {/* Right (1/3 width): Operational Advisory & Grid Security */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f1d] p-5 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-semibold font-sans text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Operational Security
            </h4>
            <span className="text-xs font-sans text-emerald-700 dark:text-emerald-400 font-semibold">
              <span className="font-mono tabular-nums">{reliability.toFixed(1)}%</span> Reliable
            </span>
          </div>

          {alerts.length > 0 ? (
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
                <div className="text-xs font-sans font-semibold text-amber-800 dark:text-amber-300">
                  {alerts[0].title}
                </div>
                <p className="text-xs font-sans text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                  {alerts[0].message}
                </p>
                <div className="mt-2 text-xs font-sans font-medium text-cyan-800 dark:text-cyan-400">
                  Action: {alerts[0].action}
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('alerts')}
                className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#0d1527] dark:hover:bg-[#111a2d] border border-slate-200 dark:border-slate-800 text-xs font-sans font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus-ring"
              >
                <span>View All {alerts.length} System Advisories</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-center space-y-1">
              <ShieldCheck className="w-6 h-6 text-emerald-500 mx-auto" />
              <div className="text-xs font-sans font-semibold text-emerald-800 dark:text-emerald-300">
                All Systems Nominal
              </div>
              <p className="text-xs font-sans text-slate-600 dark:text-slate-400">
                Zero load shedding or emergency generator tripping detected.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
