import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Sun, 
  Wind, 
  Battery, 
  Flame, 
  Zap, 
  ShieldCheck
} from 'lucide-react';
import { ScenarioMeta, StrategyName, EnergyFlowResponse } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface EnergyFlowViewProps {
  scenario: ScenarioMeta;
  strategy: StrategyName;
  energyFlow: EnergyFlowResponse | null;
  currentHour: number;
  onHourChange: (hour: number) => void;
}

export const EnergyFlowView: React.FC<EnergyFlowViewProps> = ({
  scenario,
  strategy,
  energyFlow,
  currentHour,
  onHourChange,
}) => {
  const { isDark } = useTheme();
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);

  React.useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        onHourChange((currentHour + 1) % 24);
      }, 1200);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, currentHour, onHourChange]);

  const nodes = energyFlow?.nodes;
  const solarKw = nodes?.solar_pv.current_kw ?? 0;
  const windKw = nodes?.wind_turbine.current_kw ?? 0;
  const dieselKw = nodes?.diesel_genset.current_kw ?? 0;
  const batDischargeKw = nodes?.battery_bess.discharge_kw ?? 0;
  const batChargeKw = nodes?.battery_bess.charge_kw ?? 0;
  const socPct = nodes?.battery_bess.soc_pct ?? 70;
  const loadDemandKw = nodes?.station_grid.load_demand_kw ?? 200;
  const powerServedKw = nodes?.station_grid.power_served_kw ?? 200;
  const ensKw = nodes?.station_grid.unserved_ens_kw ?? 0;
  const curtailKw = (nodes?.solar_pv.curtailed_kw ?? 0) + (nodes?.wind_turbine.curtailed_kw ?? 0);

  const totalGenDischarge = solarKw + windKw + dieselKw + batDischargeKw + ensKw;
  const totalLoadChargeCurtail = loadDemandKw + batChargeKw + curtailKw;
  const balanceDelta = Math.abs(totalGenDischarge - totalLoadChargeCurtail);
  const isBalanced = balanceDelta < 0.1;

  const isSolarActive = solarKw > 0.1;
  const isWindActive = windKw > 0.1;
  const isDieselActive = dieselKw > 0.1;
  const isBatDischarging = batDischargeKw > 0.1;
  const isBatCharging = batChargeKw > 0.1;

  return (
    <div className="space-y-6">
      {/* Top SCADA Control Header */}
      <div className="bg-white dark:bg-[#0e1524]/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-none backdrop-blur flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Interactive Microgrid Energy Flow
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-100 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800/40 text-cyan-800 dark:text-cyan-300">
              SCADA Bus Model
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
            <span>Scenario: <strong className="text-slate-800 dark:text-slate-200">{scenario.name}</strong></span>
            <span>•</span>
            <span>Strategy: <strong className="text-slate-800 dark:text-slate-200">{strategy}</strong></span>
          </p>
        </div>

        {/* Bus Power Balance Indicator */}
        <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className={`w-4 h-4 ${isBalanced ? 'text-emerald-500 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'}`} />
            <span className="text-slate-600 dark:text-slate-400">Power Balance:</span>
          </div>
          <span className={`font-bold tabular-nums ${isBalanced ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
            {isBalanced ? '0.00 kW (STABLE)' : `±${balanceDelta.toFixed(2)} kW`}
          </span>
        </div>
      </div>

      {/* Main SCADA Interactive SVG Canvas */}
      <div className="bg-slate-50 dark:bg-[#0a0f1d] rounded-2xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm dark:shadow-2xl relative overflow-hidden transition-colors">
        <div className="absolute inset-0 bg-polar-grid opacity-20 dark:opacity-30 pointer-events-none" />

        {/* Top Asset Cards Grid Overlay */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10 mb-8">
          {/* Solar PV Asset */}
          <div className={`p-4 rounded-xl border transition-all ${
            isSolarActive 
              ? 'bg-cyan-50/70 dark:bg-cyan-950/20 border-cyan-400 dark:border-cyan-500/40 shadow-sm' 
              : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Solar PV
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">100 kWp</span>
            </div>
            <div className="text-2xl font-mono tabular-nums font-bold text-cyan-700 dark:text-cyan-300">
              {solarKw.toFixed(1)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">kW</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
              <span>Status:</span>
              <span className={isSolarActive ? 'text-cyan-700 dark:text-cyan-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}>
                {isSolarActive ? 'GENERATING' : 'NIGHT / DORMANT'}
              </span>
            </div>
          </div>

          {/* Wind Turbine Asset */}
          <div className={`p-4 rounded-xl border transition-all ${
            isWindActive 
              ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-400 dark:border-blue-500/40 shadow-sm' 
              : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Wind Turbine
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">150 kW</span>
            </div>
            <div className="text-2xl font-mono tabular-nums font-bold text-blue-700 dark:text-blue-300">
              {windKw.toFixed(1)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">kW</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
              <span>Status:</span>
              <span className={isWindActive ? 'text-blue-700 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}>
                {isWindActive ? 'ONLINE' : 'LOW WIND'}
              </span>
            </div>
          </div>

          {/* BESS Battery Storage Asset */}
          <div className={`p-4 rounded-xl border transition-all ${
            isBatDischarging || isBatCharging 
              ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-500/40 shadow-sm' 
              : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Battery className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> BESS (200 kWh)
              </span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">{socPct.toFixed(0)}% SOC</span>
            </div>
            <div className="text-2xl font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-300">
              {isBatDischarging ? `-${batDischargeKw.toFixed(1)}` : isBatCharging ? `+${batChargeKw.toFixed(1)}` : '0.0'}{' '}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">kW</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
              <span>Mode:</span>
              <span className={isBatDischarging ? 'text-emerald-700 dark:text-emerald-400 font-bold' : isBatCharging ? 'text-cyan-700 dark:text-cyan-400 font-bold' : 'text-slate-500 dark:text-slate-400'}>
                {isBatDischarging ? 'DISCHARGING' : isBatCharging ? 'CHARGING' : 'STANDBY'}
              </span>
            </div>
          </div>

          {/* Diesel GenSet Asset */}
          <div className={`p-4 rounded-xl border transition-all ${
            isDieselActive 
              ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-400 dark:border-amber-500/40 shadow-sm' 
              : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Diesel GenSet
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">200 kW</span>
            </div>
            <div className="text-2xl font-mono tabular-nums font-bold text-amber-700 dark:text-amber-300">
              {dieselKw.toFixed(1)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">kW</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
              <span>Status:</span>
              <span className={isDieselActive ? 'text-amber-700 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400'}>
                {isDieselActive ? 'DISPATCHED' : 'STANDBY'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic SVG Single-Line Flow Bus Diagram */}
        <div className="relative z-10 py-6">
          <svg className="w-full h-48" viewBox="0 0 800 180" fill="none">
            {/* Central 400V 3-Phase AC Microgrid Bus */}
            <rect 
              x="380" 
              y="20" 
              width="40" 
              height="140" 
              rx="8" 
              fill={isDark ? '#111827' : '#ffffff'} 
              stroke={isDark ? '#334155' : '#cbd5e1'} 
              strokeWidth="2" 
            />
            <text 
              x="400" 
              y="85" 
              fill={isDark ? '#94a3b8' : '#475569'} 
              fontSize="10" 
              fontFamily="monospace" 
              fontWeight="bold"
              textAnchor="middle" 
              transform="rotate(-90 400 85)"
            >
              400V AC BUS
            </text>

            {/* Solar conduit -> Bus */}
            <path
              d="M 100 45 L 380 45"
              stroke={isSolarActive ? (isDark ? '#06b6d4' : '#0891b2') : (isDark ? '#1e293b' : '#cbd5e1')}
              strokeWidth={isSolarActive ? 3.5 : 2}
              className={isSolarActive ? 'animate-flow-active' : ''}
            />
            {isSolarActive && <circle cx="240" cy="45" r="3" fill={isDark ? '#06b6d4' : '#0891b2'} />}

            {/* Wind conduit -> Bus */}
            <path
              d="M 100 80 L 380 80"
              stroke={isWindActive ? (isDark ? '#3b82f6' : '#2563eb') : (isDark ? '#1e293b' : '#cbd5e1')}
              strokeWidth={isWindActive ? 3.5 : 2}
              className={isWindActive ? 'animate-flow-active' : ''}
            />
            {isWindActive && <circle cx="240" cy="80" r="3" fill={isDark ? '#3b82f6' : '#2563eb'} />}

            {/* Battery conduit <-> Bus (Bidirectional) */}
            <path
              d="M 100 115 L 380 115"
              stroke={isBatDischarging ? (isDark ? '#10b981' : '#059669') : isBatCharging ? (isDark ? '#06b6d4' : '#0891b2') : (isDark ? '#1e293b' : '#cbd5e1')}
              strokeWidth={isBatDischarging || isBatCharging ? 3.5 : 2}
              className={isBatDischarging ? 'animate-flow-active' : isBatCharging ? 'animate-flow-reverse' : ''}
            />
            {(isBatDischarging || isBatCharging) && <circle cx="240" cy="115" r="3" fill={isDark ? '#10b981' : '#059669'} />}

            {/* Diesel conduit -> Bus */}
            <path
              d="M 100 150 L 380 150"
              stroke={isDieselActive ? (isDark ? '#f59e0b' : '#d97706') : (isDark ? '#1e293b' : '#cbd5e1')}
              strokeWidth={isDieselActive ? 3.5 : 2}
              className={isDieselActive ? 'animate-flow-active' : ''}
            />
            {isDieselActive && <circle cx="240" cy="150" r="3" fill={isDark ? '#f59e0b' : '#d97706'} />}

            {/* Bus -> Station Load conduit */}
            <path
              d="M 420 85 L 680 85"
              stroke={isDark ? '#ffffff' : '#0f172a'}
              strokeWidth="4"
              className="animate-flow-active"
            />
            <circle cx="550" cy="85" r="3.5" fill={isDark ? '#ffffff' : '#0f172a'} />
          </svg>
        </div>

        {/* Bottom Station Load & Sinks Overlay */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 mt-2">
          {/* Station Load Sink */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  Station Load Demand
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Base Living Quarters + Labs + Thermal Heating
                </div>
              </div>
            </div>
            <div className="text-right font-mono">
              <div className="text-2xl tabular-nums font-bold text-slate-900 dark:text-slate-100">{powerServedKw.toFixed(1)} <span className="text-xs text-slate-500 dark:text-slate-400">kW</span></div>
              <div className={`text-[11px] ${ensKw > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {ensKw > 0 ? `ENS: ${ensKw.toFixed(1)} kW unserved` : '100% Demand Served'}
              </div>
            </div>
          </div>

          {/* Curtailment / Dump Sink */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-300">
                  RE Curtailment / Resistive Dump
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Thermal sink when generation exceeds BESS charge limits
                </div>
              </div>
            </div>
            <div className="text-right font-mono">
              <div className="text-2xl tabular-nums font-bold text-slate-800 dark:text-slate-300">{curtailKw.toFixed(1)} <span className="text-xs text-slate-500 dark:text-slate-400">kW</span></div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {curtailKw > 0 ? 'Surplus Dumped' : 'Zero Curtailment'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 24-Hour Timeline Scrubber Bar */}
      <div className="bg-white dark:bg-[#0e1524]/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-none space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => onHourChange(Math.max(0, currentHour - 1))}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Step Backward"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
              </button>
              <button
                onClick={() => onHourChange((currentHour + 1) % 24)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Step Forward"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setIsPlaying(false); onHourChange(0); }}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Reset to T+00"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-500 dark:text-slate-400">Timestep:</span>
              <span className="px-2.5 py-1 rounded bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-700/50 text-cyan-800 dark:text-cyan-300 font-bold text-sm tabular-nums">
                T+{currentHour < 10 ? `0${currentHour}` : currentHour}:00
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            {[0, 6, 12, 18, 23].map((h) => (
              <button
                key={h}
                onClick={() => onHourChange(h)}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  currentHour === h
                    ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold'
                    : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                }`}
              >
                T+{h < 10 ? `0${h}` : h}
              </button>
            ))}
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={23}
          value={currentHour}
          onChange={(e) => onHourChange(parseInt(e.target.value, 10))}
          className="w-full accent-cyan-600 dark:accent-cyan-400 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
        />

        <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 px-1">
          <span>T+00:00 (Start)</span>
          <span>T+06:00 (Morning)</span>
          <span>T+12:00 (Solar Peak)</span>
          <span>T+18:00 (Evening Wind)</span>
          <span>T+23:00 (End Horizon)</span>
        </div>
      </div>
    </div>
  );
};
