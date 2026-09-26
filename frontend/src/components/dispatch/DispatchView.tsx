import React from 'react';
import { 
  Cpu, 
  Zap, 
  Battery, 
  Flame, 
  Download,
  CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { ScenarioMeta, StrategyName, DispatchRecord } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface DispatchViewProps {
  scenario: ScenarioMeta;
  strategy: StrategyName;
  dispatchRecords: DispatchRecord[];
}

export const DispatchView: React.FC<DispatchViewProps> = ({
  scenario,
  strategy,
  dispatchRecords,
}) => {
  const { isDark } = useTheme();

  const exportCSV = () => {
    if (!dispatchRecords.length) return;
    const headers = Object.keys(dispatchRecords[0]).join(',');
    const rows = dispatchRecords.map(r => Object.values(r).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `polarems_dispatch_${scenario.id}_${strategy.replace(/\s+/g, '_')}.csv`;
    a.click();
  };

  const totalLoad = dispatchRecords.reduce((acc, r) => acc + r.load_kw, 0);
  const totalSolar = dispatchRecords.reduce((acc, r) => acc + r.solar_dispatch_kw, 0);
  const totalWind = dispatchRecords.reduce((acc, r) => acc + r.wind_dispatch_kw, 0);
  const totalDiesel = dispatchRecords.reduce((acc, r) => acc + r.diesel_power_kw, 0);
  const totalFuel = dispatchRecords.reduce((acc, r) => acc + r.diesel_fuel_flow_l_h, 0);
  const totalENS = dispatchRecords.reduce((acc, r) => acc + r.ens_kw, 0);

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
      {/* 1. DISPATCH CONSOLE HEADER */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f1d] p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-600/40 text-cyan-700 dark:text-cyan-400">
              <Cpu className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
              Predictive Energy Dispatch Console
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-700/60 text-cyan-800 dark:text-cyan-300">
              GAMS MIP OPTIMIZED
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2 font-sans">
            <span>Scenario: <strong className="text-slate-800 dark:text-slate-200">{scenario.name.split(':')[0]}</strong></span>
            <span>•</span>
            <span>Strategy: <strong className="text-cyan-700 dark:text-cyan-300">{strategy}</strong></span>
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#0d1527] dark:hover:bg-[#111a2d] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-sans font-semibold transition-all cursor-pointer shadow-xs focus-ring"
        >
          <Download className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Export Dispatch CSV</span>
        </button>
      </div>

      {/* 2. DISPATCH RECOMMENDATION BANNER */}
      <div className="p-4 rounded-xl bg-cyan-50/70 dark:bg-[#0c182b] border border-cyan-200 dark:border-cyan-600/40 flex items-start gap-3 shadow-xs">
        <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 shrink-0 mt-0.5">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <div className="text-xs font-sans font-semibold text-cyan-900 dark:text-cyan-200 uppercase tracking-wider">
            Optimized Dispatch Schedule & Advisory Directive
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
            {strategy.includes('PolarEMS') 
              ? 'MIP optimization has solved with zero unserved load, buffering solar and wind surpluses into the 200 kWh battery. Generator runtime is restricted strictly to high-efficiency operation windows, ensuring maximum diesel conservation.'
              : strategy.includes('Rule-Based')
              ? 'Rule-Based heuristic controller is managing generation on instantaneous thresholds. Battery charging occurs whenever renewable power exceeds base load.'
              : 'Diesel-Only baseline generator running continuously at partial load to cover station demand, without renewable storage absorption.'}
          </p>
        </div>
      </div>

      {/* 3. CURRENT OPERATING STATE // COMPACT TELEMETRY STRIP */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f1d] p-3 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800/80">
          <div className="p-2.5">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-sans font-medium mb-1">Total Demand</div>
            <div className="text-xl font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {totalLoad.toFixed(1)} <span className="text-xs font-sans font-normal text-slate-400">kWh</span>
            </div>
          </div>
          <div className="p-2.5">
            <div className="text-xs text-cyan-600 dark:text-cyan-400 font-sans font-medium mb-1">Solar Dispatched</div>
            <div className="text-xl font-mono tabular-nums font-bold text-cyan-700 dark:text-cyan-300 mt-0.5">
              {totalSolar.toFixed(1)} <span className="text-xs font-sans font-normal text-slate-400">kWh</span>
            </div>
          </div>
          <div className="p-2.5">
            <div className="text-xs text-blue-600 dark:text-blue-400 font-sans font-medium mb-1">Wind Dispatched</div>
            <div className="text-xl font-mono tabular-nums font-bold text-blue-700 dark:text-blue-300 mt-0.5">
              {totalWind.toFixed(1)} <span className="text-xs font-sans font-normal text-slate-400">kWh</span>
            </div>
          </div>
          <div className="p-2.5">
            <div className="text-xs text-amber-600 dark:text-amber-400 font-sans font-medium mb-1">Diesel Power</div>
            <div className="text-xl font-mono tabular-nums font-bold text-amber-700 dark:text-amber-300 mt-0.5">
              {totalDiesel.toFixed(1)} <span className="text-xs font-sans font-normal text-slate-400">kWh</span>
            </div>
          </div>
          <div className="p-2.5">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-sans font-medium mb-1">Fuel Consumed</div>
            <div className="text-xl font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {totalFuel.toFixed(1)} <span className="text-xs font-sans font-normal text-slate-400">L</span>
            </div>
          </div>
          <div className="p-2.5">
            <div className="text-xs text-rose-600 dark:text-rose-400 font-sans font-medium mb-1">Unserved (ENS)</div>
            <div className={`text-xl font-mono tabular-nums font-bold mt-0.5 ${totalENS > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
              {totalENS.toFixed(1)} <span className="text-xs font-sans font-normal text-slate-400">kWh</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PRIMARY GENERATION MIX STACKED CHART */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f1d] p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Generation Dispatch by Source vs Station Demand (kW)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">1-Hour Resolution</span>
        </div>
        <div className="h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dispatchRecords} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="dispSolar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="dispWind" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="dispBat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="dispDiesel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
              <XAxis dataKey="hour" stroke="#64748b" tickFormatter={(v) => `T+${v}`} fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} unit=" kW" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px', fontFamily: 'monospace' }} />
              <Area type="monotone" dataKey="solar_dispatch_kw" stackId="1" stroke="#06b6d4" fill="url(#dispSolar)" name="Solar PV" />
              <Area type="monotone" dataKey="wind_dispatch_kw" stackId="1" stroke="#3b82f6" fill="url(#dispWind)" name="Wind Turbine" />
              <Area type="monotone" dataKey="battery_discharge_kw" stackId="1" stroke="#10b981" fill="url(#dispBat)" name="Battery Disch." />
              <Area type="monotone" dataKey="diesel_power_kw" stackId="1" stroke="#f59e0b" fill="url(#dispDiesel)" name="Diesel GenSet" />
              <Line type="monotone" dataKey="load_kw" stroke={isDark ? '#ffffff' : '#0f172a'} strokeWidth={2} strokeDasharray="3 3" dot={false} name="Station Demand" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. SECONDARY DIAGNOSTICS: BATTERY SOC & FUEL RATE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f1d] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                BESS Battery State of Charge (%)
              </h3>
            </div>
            <span className="text-[10.5px] font-mono text-emerald-700 dark:text-emerald-400">20% Minimum Buffer</span>
          </div>
          <div className="h-56 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dispatchRecords} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="hour" stroke="#64748b" tickFormatter={(v) => `T+${v}`} fontSize={11} />
                <YAxis stroke="#64748b" domain={[0, 100]} fontSize={11} unit="%" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px', fontFamily: 'monospace' }} />
                <Line type="monotone" dataKey="soc_pct" stroke="#10b981" strokeWidth={2.5} dot={false} name="Battery SOC %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f1d] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Diesel Generator Fuel Flow Rate (L/h)
              </h3>
            </div>
            <span className="text-[10.5px] font-mono text-amber-700 dark:text-amber-400">Optimal Load Band</span>
          </div>
          <div className="h-56 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dispatchRecords} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="hour" stroke="#64748b" tickFormatter={(v) => `T+${v}`} fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit=" L/h" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px', fontFamily: 'monospace' }} />
                <Bar dataKey="diesel_fuel_flow_l_h" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Fuel Flow Rate (L/h)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 6. HOURLY NUMERICAL DISPATCH TELEMETRY LOG */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f1d] p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold font-sans text-slate-900 dark:text-slate-100">
            Hourly Numerical Dispatch Telemetry Log
          </h3>
          <span className="text-xs font-sans text-slate-500 dark:text-slate-400">24 Timesteps</span>
        </div>
        <div className="max-h-80 overflow-y-auto overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="w-full min-w-[720px] text-left text-xs font-sans">
            <thead className="bg-slate-100 dark:bg-[#070b12] text-slate-600 dark:text-slate-400 sticky top-0 border-b border-slate-200 dark:border-slate-800 z-10 font-sans">
              <tr>
                <th className="p-3 font-semibold">Hour</th>
                <th className="p-3 font-semibold">Load (kW)</th>
                <th className="p-3 font-semibold text-cyan-600 dark:text-cyan-400">Solar (kW)</th>
                <th className="p-3 font-semibold text-blue-600 dark:text-blue-400">Wind (kW)</th>
                <th className="p-3 font-semibold text-slate-500 dark:text-slate-400">Bat Ch (kW)</th>
                <th className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">Bat Dis (kW)</th>
                <th className="p-3 font-semibold text-amber-600 dark:text-amber-400">Diesel (kW)</th>
                <th className="p-3 font-semibold text-emerald-700 dark:text-emerald-300">SOC %</th>
                <th className="p-3 font-semibold text-amber-700 dark:text-amber-300">Fuel (L/h)</th>
                <th className="p-3 font-semibold text-rose-600 dark:text-rose-400">ENS (kW)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300 font-mono">
              {dispatchRecords.map((r) => (
                <tr key={r.hour} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 text-cyan-700 dark:text-cyan-400 font-bold tabular-nums">T+{r.hour}</td>
                  <td className="p-3 text-slate-900 dark:text-slate-100 tabular-nums">{r.load_kw.toFixed(1)}</td>
                  <td className="p-3 text-cyan-700 dark:text-cyan-300 tabular-nums">{r.solar_dispatch_kw.toFixed(1)}</td>
                  <td className="p-3 text-blue-700 dark:text-blue-400 tabular-nums">{r.wind_dispatch_kw.toFixed(1)}</td>
                  <td className="p-3 text-slate-500 dark:text-slate-400 tabular-nums">{r.battery_charge_kw.toFixed(1)}</td>
                  <td className="p-3 text-emerald-700 dark:text-emerald-400 tabular-nums">{r.battery_discharge_kw.toFixed(1)}</td>
                  <td className="p-3 text-amber-700 dark:text-amber-400 font-bold tabular-nums">{r.diesel_power_kw.toFixed(1)}</td>
                  <td className="p-3 text-slate-800 dark:text-slate-200 tabular-nums">{r.soc_pct.toFixed(1)}%</td>
                  <td className="p-3 text-slate-800 dark:text-slate-200 tabular-nums">{r.diesel_fuel_flow_l_h.toFixed(1)}</td>
                  <td className={`p-3 font-bold tabular-nums ${r.ens_kw > 0 ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20' : 'text-slate-400 dark:text-slate-500'}`}>
                    {r.ens_kw.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
