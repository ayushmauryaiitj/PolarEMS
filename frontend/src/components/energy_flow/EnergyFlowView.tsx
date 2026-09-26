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
  ShieldCheck,
  Activity
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
    <div className="space-y-5">
      {/* 1. SCADA CONTROL BAR */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f1d] p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-600/40 text-cyan-700 dark:text-cyan-400">
              <Activity className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
              Interactive Microgrid SCADA Energy Flow
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-700/60 text-cyan-800 dark:text-cyan-300">
              400V AC 3Φ BUS
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2 font-sans">
            <span>Scenario: <strong className="text-slate-800 dark:text-slate-200">{scenario.name.split(':')[0]}</strong></span>
            <span>•</span>
            <span>Strategy: <strong className="text-cyan-700 dark:text-cyan-300">{strategy}</strong></span>
          </p>
        </div>

        {/* Bus Power Balance Health Indicator */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 text-xs font-sans">
          <ShieldCheck className={`w-4 h-4 ${isBalanced ? 'text-emerald-500' : 'text-amber-500'}`} />
          <span className="text-slate-500 dark:text-slate-400 font-medium">Bus Power Balance:</span>
          <span className={`font-mono font-bold tabular-nums ${isBalanced ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
            {isBalanced ? '0.00 kW (CONSERVED)' : `±${balanceDelta.toFixed(2)} kW`}
          </span>
        </div>
      </div>

      {/* 2. MAIN SCADA VISUAL DISPLAY (The Visual Centerpiece) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070b16] p-5 lg:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute inset-0 bg-polar-grid opacity-30 pointer-events-none" />

        {/* Top 4 Generation/Storage Assets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 relative z-10 mb-6">
          {/* Solar PV Block */}
          <div className={`p-4 rounded-xl border transition-all ${
            isSolarActive 
              ? 'bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-400 dark:border-cyan-500/50 shadow-xs' 
              : 'bg-slate-50/70 dark:bg-[#0a0f1d] border-slate-200 dark:border-slate-800/80'
          }`}>
            <div className="flex items-center justify-between text-xs font-sans mb-1">
              <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-semibold">
                <Sun className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Solar PV Array
              </span>
              <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">100 kWp</span>
            </div>
            <div className="text-2xl font-mono tabular-nums font-bold text-cyan-700 dark:text-cyan-300 mt-1">
              {solarKw.toFixed(1)} <span className="text-xs font-sans font-normal text-slate-400">kW</span>
            </div>
            <div className="text-xs font-sans mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">State:</span>
              <span className={isSolarActive ? 'text-cyan-700 dark:text-cyan-400 font-semibold' : 'text-slate-400'}>
                {isSolarActive ? 'Active Generation' : 'Night / Dormant'}
              </span>
            </div>
          </div>

          {/* Wind Turbine Block */}
          <div className={`p-4 rounded-xl border transition-all ${
            isWindActive 
              ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-400 dark:border-blue-500/50 shadow-xs' 
              : 'bg-slate-50/70 dark:bg-[#0a0f1d] border-slate-200 dark:border-slate-800/80'
          }`}>
            <div className="flex items-center justify-between text-xs font-sans mb-1">
              <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-semibold">
                <Wind className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Wind Turbines
              </span>
              <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">150 kW</span>
            </div>
            <div className="text-2xl font-mono tabular-nums font-bold text-blue-700 dark:text-blue-300 mt-1">
              {windKw.toFixed(1)} <span className="text-xs font-sans font-normal text-slate-400">kW</span>
            </div>
            <div className="text-xs font-sans mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">State:</span>
              <span className={isWindActive ? 'text-blue-700 dark:text-blue-400 font-semibold' : 'text-slate-400'}>
                {isWindActive ? 'Rotor Spinning' : 'Sub-Cut-In Lull'}
              </span>
            </div>
          </div>

          {/* Li-ion BESS Block */}
          <div className={`p-4 rounded-xl border transition-all ${
            isBatDischarging || isBatCharging 
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-500/50 shadow-xs' 
              : 'bg-slate-50/70 dark:bg-[#0a0f1d] border-slate-200 dark:border-slate-800/80'
          }`}>
            <div className="flex items-center justify-between text-xs font-sans mb-1">
              <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-semibold">
                <Battery className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Li-Ion BESS
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">{socPct.toFixed(0)}% SOC</span>
            </div>
            <div className="text-2xl font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-300 mt-1">
              {isBatDischarging ? `-${batDischargeKw.toFixed(1)}` : isBatCharging ? `+${batChargeKw.toFixed(1)}` : '0.0'}{' '}
              <span className="text-xs font-sans font-normal text-slate-400">kW</span>
            </div>
            <div className="text-xs font-sans mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Mode:</span>
              <span className={isBatDischarging ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : isBatCharging ? 'text-cyan-700 dark:text-cyan-400 font-semibold' : 'text-slate-400'}>
                {isBatDischarging ? 'Discharging' : isBatCharging ? 'Charging' : 'Standby'}
              </span>
            </div>
          </div>

          {/* Diesel GenSet Block */}
          <div className={`p-4 rounded-xl border transition-all ${
            isDieselActive 
              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-400 dark:border-amber-500/50 shadow-xs' 
              : 'bg-slate-50/70 dark:bg-[#0a0f1d] border-slate-200 dark:border-slate-800/80'
          }`}>
            <div className="flex items-center justify-between text-xs font-sans mb-1">
              <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-semibold">
                <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Diesel GenSet
              </span>
              <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">200 kW</span>
            </div>
            <div className="text-2xl font-mono tabular-nums font-bold text-amber-700 dark:text-amber-300 mt-1">
              {dieselKw.toFixed(1)} <span className="text-xs font-sans font-normal text-slate-400">kW</span>
            </div>
            <div className="text-xs font-sans mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Status:</span>
              <span className={isDieselActive ? 'text-amber-700 dark:text-amber-400 font-semibold' : 'text-slate-400'}>
                {isDieselActive ? 'Prime Running' : 'Standby Reserve'}
              </span>
            </div>
          </div>
        </div>

        {/* Central SCADA Single-Line Diagram */}
        <div className="relative z-10 py-4 sm:py-6 overflow-x-auto w-full">
          <svg className="min-w-[620px] w-full h-44 sm:h-48" viewBox="0 0 800 180" fill="none">
            {/* Central 400V 3-Phase AC Bus Bar */}
            <rect 
              x="380" 
              y="20" 
              width="40" 
              height="140" 
              rx="6" 
              fill={isDark ? '#0d1527' : '#ffffff'} 
              stroke={isDark ? '#38bdf8' : '#0284c7'} 
              strokeWidth="2.5" 
            />
            <text 
              x="400" 
              y="85" 
              fill={isDark ? '#38bdf8' : '#0284c7'} 
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

        {/* Bottom Station Load Sink Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 mt-2">
          {/* Station Electrical Demand */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-[#0c1626] border border-cyan-200 dark:border-cyan-600/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold font-sans text-slate-800 dark:text-slate-200">
                  Station Electrical Demand
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                  Base Living Quarters + Scientific Labs + Space Heating
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                {powerServedKw.toFixed(1)} <span className="text-xs font-sans font-normal text-slate-400">kW</span>
              </div>
              <div className={`text-xs font-sans font-medium ${ensKw > 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-emerald-700 dark:text-emerald-400'}`}>
                {ensKw > 0 ? `ENS: ${ensKw.toFixed(1)} kW unserved` : '100% Demand Met'}
              </div>
            </div>
          </div>

          {/* RE Curtailment / Resistive Dump */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-[#0c1626] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold font-sans text-slate-800 dark:text-slate-200">
                  RE Curtailment / Resistive Dump
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                  Surplus thermal absorption when BESS reaches 100% SOC
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
                {curtailKw.toFixed(1)} <span className="text-xs font-sans font-normal text-slate-400">kW</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-sans font-medium">
                {curtailKw > 0 ? 'Surplus Dump Active' : 'Zero Curtailment'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 24-HOUR TIMELINE SCRUBBER CONSOLE */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f1d] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#0d1527] p-1 rounded-lg border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => onHourChange(Math.max(0, currentHour - 1))}
                className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer focus-ring"
                title="Step Backward"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-semibold text-xs font-sans flex items-center gap-1.5 transition-colors cursor-pointer focus-ring"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
              </button>
              <button
                onClick={() => onHourChange((currentHour + 1) % 24)}
                className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer focus-ring"
                title="Step Forward"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setIsPlaying(false); onHourChange(0); }}
                className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer focus-ring"
                title="Reset to T+00"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-sans">
              <span className="text-slate-500 dark:text-slate-400">Timestep:</span>
              <span className="px-2.5 py-1 rounded bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-600/50 text-cyan-800 dark:text-cyan-300 font-bold text-sm font-mono tabular-nums">
                T+{currentHour < 10 ? `0${currentHour}` : currentHour}:00
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            {[0, 6, 12, 18, 23].map((h) => (
              <button
                key={h}
                onClick={() => onHourChange(h)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer focus-ring tabular-nums ${
                  currentHour === h
                    ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-[#0d1527] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 font-medium'
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

        <div className="flex justify-between text-xs font-sans text-slate-500 dark:text-slate-400 px-1">
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
