import React from 'react';
import { 
  Cpu, 
  Zap, 
  Battery, 
  Flame, 
  Download
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
    backgroundColor: isDark ? '#090e1a' : '#ffffff',
    borderColor: isDark ? '#334155' : '#cbd5e1',
    color: isDark ? '#f1f5f9' : '#0f172a',
    borderRadius: '8px',
    fontSize: '11px',
    fontFamily: 'monospace',
    boxShadow: isDark ? '0 10px 15px -3px rgba(0,0,0,0.5)' : '0 10px 15px -3px rgba(0,0,0,0.1)'
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white dark:bg-[#0e1524]/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-none backdrop-blur flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20">
              <Cpu className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              24-Hour Predictive Dispatch Schedule
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-100 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800/40 text-cyan-800 dark:text-cyan-300">
              GAMS MIP
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
            <span>Strategy: <strong className="text-slate-800 dark:text-slate-200">{strategy}</strong></span>
            <span>•</span>
            <span>Scenario: <strong className="text-slate-800 dark:text-slate-200">{scenario.name}</strong></span>
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700/80 text-xs font-mono transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Export Dispatch CSV</span>
        </button>
      </div>

      {/* Mini summary badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-[#0e1524]/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">Total Load</div>
          <div className="text-base font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100 mt-0.5">{totalLoad.toFixed(1)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">kWh</span></div>
        </div>
        <div className="bg-white dark:bg-[#0e1524]/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono uppercase tracking-wider">Solar PV</div>
          <div className="text-base font-mono tabular-nums font-bold text-cyan-700 dark:text-cyan-300 mt-0.5">{totalSolar.toFixed(1)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">kWh</span></div>
        </div>
        <div className="bg-white dark:bg-[#0e1524]/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono uppercase tracking-wider">Wind Turbine</div>
          <div className="text-base font-mono tabular-nums font-bold text-blue-700 dark:text-blue-300 mt-0.5">{totalWind.toFixed(1)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">kWh</span></div>
        </div>
        <div className="bg-white dark:bg-[#0e1524]/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono uppercase tracking-wider">Diesel GenSet</div>
          <div className="text-base font-mono tabular-nums font-bold text-amber-700 dark:text-amber-300 mt-0.5">{totalDiesel.toFixed(1)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">kWh</span></div>
        </div>
        <div className="bg-white dark:bg-[#0e1524]/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">Total Fuel</div>
          <div className="text-base font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200 mt-0.5">{totalFuel.toFixed(1)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">L</span></div>
        </div>
        <div className="bg-white dark:bg-[#0e1524]/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-mono uppercase tracking-wider">Unserved (ENS)</div>
          <div className={`text-base font-mono tabular-nums font-bold mt-0.5 ${totalENS > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
            {totalENS.toFixed(1)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">kWh</span>
          </div>
        </div>
      </div>

      {/* Primary Generation Stack Chart */}
      <div className="bg-white dark:bg-[#0e1524]/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-none space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
              Generation Dispatch by Source (kW)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Stacked Generation vs Station Demand</span>
        </div>
        <div className="h-72">
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
              <Line type="monotone" dataKey="load_kw" stroke={isDark ? '#ffffff' : '#0f172a'} strokeWidth={2} strokeDasharray="3 3" dot={false} name="Station Load" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary split charts: SOC and Fuel Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#0e1524]/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-none space-y-2 transition-colors">
          <div className="flex items-center gap-2">
            <Battery className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
              BESS State of Charge (%)
            </h3>
          </div>
          <div className="h-56">
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

        <div className="bg-white dark:bg-[#0e1524]/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-none space-y-2 transition-colors">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
              Fuel Flow Rate (L/h)
            </h3>
          </div>
          <div className="h-56">
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

      {/* Hourly Dispatch Log Table with Sticky Header */}
      <div className="bg-white dark:bg-[#0e1524]/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-none space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
            Hourly Numerical Dispatch Telemetry Log
          </h3>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">24 Timesteps</span>
        </div>
        <div className="max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-800/80 rounded-xl">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100 dark:bg-[#070b12] text-slate-600 dark:text-slate-400 sticky top-0 border-b border-slate-200 dark:border-slate-800 z-10">
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
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
