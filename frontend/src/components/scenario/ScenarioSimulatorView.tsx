import React from 'react';
import { 
  Sliders, 
  Sun, 
  Flame, 
  Thermometer, 
  CloudSnow, 
  ArrowRight,
  Activity,
  CheckCircle2,
  Check
} from 'lucide-react';
import { ScenarioMeta, StrategyName } from '../../types';
import { TabId } from '../layout/Sidebar';

interface ScenarioSimulatorViewProps {
  scenarios: ScenarioMeta[];
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
  onSelectStrategy: (strat: StrategyName) => void;
  onNavigateTab: (tab: TabId) => void;
}

export const ScenarioSimulatorView: React.FC<ScenarioSimulatorViewProps> = ({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  onSelectStrategy,
  onNavigateTab,
}) => {
  const activeScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];

  const getScenarioIcon = (id: string) => {
    switch (id) {
      case 'scenario_1': return <Sun className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />;
      case 'scenario_2': return <Flame className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'scenario_3': return <Thermometer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'scenario_4': return <CloudSnow className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      default: return <Sliders className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />;
    }
  };

  const getScenarioStress = (id: string) => {
    switch (id) {
      case 'scenario_1': return { text: 'High Renewables', color: 'text-cyan-800 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/60 border-cyan-300 dark:border-cyan-800/40' };
      case 'scenario_2': return { text: 'Drought / Fuel Limit', color: 'text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800/40' };
      case 'scenario_3': return { text: 'Peak Polar Winter', color: 'text-indigo-800 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800/40' };
      case 'scenario_4': return { text: 'Blizzard / Turbine Cutoff', color: 'text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800/40' };
      default: return { text: 'Simulation', color: 'text-slate-800 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700' };
    }
  };

  const getScenarioDescription = (id: string, fallbackDesc: string) => {
    switch (id) {
      case 'scenario_1':
        return 'High solar and wind availability (~2,780 kWh renewable energy) under nominal summer conditions with 2,000 L of available diesel fuel. This represents the benchmark high-renewable operating regime to maximize BESS cycling and diesel displacement.';
      case 'scenario_2':
        return 'Severe sub-cut-in wind lull and minimal solar (~23 kWh renewable energy) combined with restricted emergency fuel of 1,000 L. This stress-tests system endurance and controlled load shedding during a multi-day renewable drought.';
      case 'scenario_3':
        return 'Peak mid-winter space heating and scientific operations load (~5,431 kWh) with standard fuel of 2,000 L. This stress-tests continuous thermal and electrical dispatch under severe sub-zero ambient temperatures (-28.1°C).';
      case 'scenario_4':
        return 'Sudden 90% renewable equipment derating (alpha_RE = 0.10) caused by severe blizzard icing, with 1,500 L of fuel. This tests automated contingency dispatch and turbine cutout protection during catastrophic weather disruptions.';
      default:
        return fallbackDesc;
    }
  };

  const getScenarioPhysicalResponse = (id: string) => {
    switch (id) {
      case 'scenario_1':
        return 'High renewable availability (~2,780 kWh) allows PolarEMS to cycle the 200 kWh BESS with zero energy not served (0.0 kWh ENS), displacing 649.6 L of diesel fuel and reducing generator run-time to 19 hours.';
      case 'scenario_2':
        return 'Severe sub-cut-in wind lull with emergency 1,000 L fuel cap. PolarEMS prioritizes critical living quarters, scheduling 804.8 kWh controlled load shedding while keeping the base safely powered through the drought.';
      case 'scenario_3':
        return 'Mid-winter heating and scientific lab loads peak at 257.4 kW (5,431.2 kWh total). Limited renewable generation (685.9 kWh) necessitates continuous prime-power diesel support with minor 55.8 kWh ENS under peak coincidence.';
      case 'scenario_4':
        return 'Violent storm induces 90% renewable capacity derating (277.9 kWh available). The microgrid safely rides through blizzard conditions with 54.7 kWh controlled ENS and 1,277.4 L diesel fuel consumption.';
      default:
        return 'Standard simulation response with continuous power balance.';
    }
  };

  const getScenarioRecommendation = (id: string) => {
    switch (id) {
      case 'scenario_1':
        return 'Maximize solar and wind capture into BESS. Pre-cool/pre-heat thermal storage during peak surplus hours and run diesel only when battery SOC reaches safety threshold.';
      case 'scenario_2':
        return 'Maintain diesel GenSet strictly within its optimal fuel-efficiency band. Guard battery safety reserve above 20% SOC for mission-critical life-support.';
      case 'scenario_3':
        return 'Coordinate BESS peak-shaving during maximum coincident heating spikes to prevent generator thermal tripping, maintaining active heat-recovery circuits.';
      case 'scenario_4':
        return 'Switch to conservative storm-hold protocol. Pre-charge BESS ahead of blizzard onset and maintain diesel spinning reserve for turbine cutout protection.';
      default:
        return 'Maintain automated GAMS predictive dispatch schedules.';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white dark:bg-[#0e1524]/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-none backdrop-blur flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20">
              <Sliders className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Operational Scenario Simulator & Stress Workbench
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Evaluate microgrid robustness and predictive dispatch responses across distinct polar operational regimes
          </p>
        </div>
      </div>

      {/* 4 Scenario Cards Grid - Aligned, Complete Descriptions, No Truncation */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
        {scenarios.map((sc) => {
          const isSelected = sc.id === selectedScenarioId;
          const stress = getScenarioStress(sc.id);
          const fullDesc = getScenarioDescription(sc.id, sc.description);

          return (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc.id)}
              className={`text-left p-5 rounded-2xl border transition-all duration-200 relative flex flex-col h-full cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-b from-cyan-50/90 to-white dark:from-[#101b2e] dark:to-[#0a1220] border-cyan-400 dark:border-cyan-500/60 shadow-md dark:shadow-lg dark:shadow-cyan-500/10 ring-1 ring-cyan-400/40 dark:ring-cyan-500/30'
                  : 'bg-white dark:bg-[#0e1524]/80 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 shadow-sm'
              }`}
            >
              {/* Card Top: Icon, Regime Tag, and Active Indicator */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shrink-0">
                  {getScenarioIcon(sc.id)}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${stress.color}`}>
                    {stress.text}
                  </span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 flex items-center justify-center text-[10px] font-bold shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
              </div>

              {/* Card Title */}
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 leading-snug">
                {sc.name}
              </h3>

              {/* Complete Scenario Description — Full Text, Natural Flow, No Ellipsis */}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans flex-1 mb-4">
                {fullDesc}
              </p>

              {/* Pinned Bottom Telemetry Section */}
              <div className="mt-auto pt-3 border-t border-slate-200/80 dark:border-slate-800/80 font-mono text-[11px] space-y-1.5 text-slate-500 dark:text-slate-400">
                <div className="flex justify-between items-center">
                  <span>Station Demand:</span>
                  <span className="text-slate-900 dark:text-slate-200 font-semibold tabular-nums">
                    {sc.total_load_kwh.toFixed(1)} kWh
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>RE Available:</span>
                  <span className="text-cyan-700 dark:text-cyan-300 font-semibold tabular-nums">
                    {sc.total_re_avail_kwh.toFixed(1)} kWh
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Avg Wind Speed:</span>
                  <span className="text-slate-800 dark:text-slate-200 tabular-nums">
                    {sc.avg_wind_speed_ms.toFixed(1)} m/s
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Ambient Temp:</span>
                  <span className="text-slate-800 dark:text-slate-200 tabular-nums">
                    {sc.avg_temp_c.toFixed(1)}°C
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Initial Fuel:</span>
                  <span className="text-amber-700 dark:text-amber-400 font-medium tabular-nums">
                    {sc.fuel_init_l.toFixed(0)} L
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Scenario Detailed Response Workbench */}
      {activeScenario && (
        <div className="bg-white dark:bg-[#0e1524]/90 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-none space-y-5 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Scenario Operating Profile & Dispatch Formulation
            </h3>
            <span className="text-xs font-mono text-cyan-800 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-300 dark:border-cyan-800/40">
              Active: {activeScenario.name}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Assumptions */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
              <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                1. Boundary Assumptions
              </div>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2 font-mono">
                <li className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Duration:</span>
                  <span className="text-slate-900 dark:text-slate-100 tabular-nums">{activeScenario.duration_hours} Hours</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Initial Fuel:</span>
                  <span className="text-amber-700 dark:text-amber-400 font-semibold tabular-nums">{activeScenario.fuel_init_l} Liters</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Initial SOC:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">{(activeScenario.soc_init * 100).toFixed(0)}%</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Peak Load:</span>
                  <span className="text-slate-900 dark:text-slate-100 tabular-nums">{activeScenario.peak_load_kw.toFixed(1)} kW</span>
                </li>
              </ul>
            </div>

            {/* Center: Operational Response */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
              <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                2. Physical Energy Response
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                {getScenarioPhysicalResponse(activeScenario.id)}
              </p>
            </div>

            {/* Right: PolarEMS Recommendation */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-slate-50 dark:from-cyan-950/40 dark:to-slate-950 border border-cyan-300 dark:border-cyan-500/40 space-y-3">
              <div className="text-xs font-mono font-bold text-cyan-800 dark:text-cyan-300 uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                3. Dispatch Recommendation
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-sans">
                {getScenarioRecommendation(activeScenario.id)}
              </p>
              <button
                onClick={() => { onSelectStrategy('PolarEMS (Predictive GAMS)'); onNavigateTab('dispatch'); }}
                className="w-full mt-2 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-bold text-xs font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Launch Predictive Dispatch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
