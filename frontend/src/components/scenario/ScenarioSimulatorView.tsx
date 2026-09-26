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
  Check,
  Zap,
  Wind
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

  const getScenarioNum = (id: string) => {
    switch (id) {
      case 'scenario_1': return '01';
      case 'scenario_2': return '02';
      case 'scenario_3': return '03';
      case 'scenario_4': return '04';
      default: return '00';
    }
  };

  const getScenarioIcon = (id: string) => {
    switch (id) {
      case 'scenario_1': return <Sun className="w-4 h-4 text-cyan-500" />;
      case 'scenario_2': return <Flame className="w-4 h-4 text-amber-500" />;
      case 'scenario_3': return <Thermometer className="w-4 h-4 text-indigo-400" />;
      case 'scenario_4': return <CloudSnow className="w-4 h-4 text-sky-400" />;
      default: return <Sliders className="w-4 h-4 text-cyan-500" />;
    }
  };

  const getScenarioRegime = (id: string) => {
    switch (id) {
      case 'scenario_1': return { text: 'NOMINAL / HIGH RE', badgeClass: 'bg-cyan-50 dark:bg-cyan-950/80 border-cyan-200 dark:border-cyan-600/50 text-cyan-800 dark:text-cyan-300' };
      case 'scenario_2': return { text: 'DROUGHT / FUEL LIMIT', badgeClass: 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-600/50 text-amber-800 dark:text-amber-300' };
      case 'scenario_3': return { text: 'PEAK POLAR WINTER', badgeClass: 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-600/50 text-indigo-800 dark:text-indigo-300' };
      case 'scenario_4': return { text: 'BLIZZARD / CUTOFF', badgeClass: 'bg-sky-50 dark:bg-sky-950/80 border-sky-200 dark:border-sky-600/50 text-sky-800 dark:text-sky-300' };
      default: return { text: 'SIMULATION', badgeClass: 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300' };
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
      {/* 1. SECTION OPERATIONAL HEADER */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f1d] p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-600/40 text-cyan-700 dark:text-cyan-400">
              <Sliders className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Operational Scenario Simulator & Stress Workbench
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Evaluate microgrid robustness and predictive dispatch responses across distinct polar operational regimes
          </p>
        </div>
        <div className="text-xs font-sans text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-[#0d1527] px-3 py-1.5 rounded-lg border border-cyan-200 dark:border-slate-800 font-medium">
          Selected: <strong className="text-slate-900 dark:text-slate-100">{activeScenario.name.split(':')[0]}</strong>
        </div>
      </div>

      {/* 2. REDESIGNED 4-SCENARIO CARDS (Distinct identities: 01, 02, 03, 04) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
        {scenarios.map((sc) => {
          const isSelected = sc.id === selectedScenarioId;
          const num = getScenarioNum(sc.id);
          const regime = getScenarioRegime(sc.id);
          const fullDesc = getScenarioDescription(sc.id, sc.description);

          return (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc.id)}
              className={`text-left p-5 rounded-xl border transition-all duration-200 relative flex flex-col h-full cursor-pointer focus-ring ${
                isSelected
                  ? 'bg-gradient-to-b from-cyan-50/80 to-white dark:from-[#0d182b] dark:to-[#090f1d] border-cyan-500 dark:border-cyan-500/80 shadow-md ring-1 ring-cyan-500/40'
                  : 'bg-white dark:bg-[#0a0f1d] border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-[#0c1426] shadow-xs'
              }`}
            >
              {/* Card Header: Numeral + Regime Badge + Active Check */}
              <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-lg font-bold ${isSelected ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-600'}`}>
                    {num}
                  </span>
                  <div className="p-1 rounded bg-slate-100 dark:bg-[#111a2d]">
                    {getScenarioIcon(sc.id)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold border ${regime.badgeClass}`}>
                    {regime.text}
                  </span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 flex items-center justify-center text-[10px] font-bold shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
              </div>

              {/* Scenario Title */}
              <h3 className="text-sm font-semibold font-sans text-slate-900 dark:text-slate-100 mb-2 leading-snug">
                {sc.name}
              </h3>

              {/* Complete Scenario Description (Natural Multi-line Flow, Zero Truncation) */}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans flex-1 mb-4 whitespace-normal break-words">
                {fullDesc}
              </p>

              {/* Compact Technical Telemetry Block */}
              <div className="mt-auto pt-3 border-t border-slate-200/80 dark:border-slate-800/80 text-xs space-y-1.5 bg-slate-50/70 dark:bg-[#0d1527]/70 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-sans flex items-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-500" /> Station Load:
                  </span>
                  <span className="text-slate-900 dark:text-slate-200 font-mono font-semibold tabular-nums">
                    {sc.total_load_kwh.toFixed(1)} <span className="font-sans text-slate-400 font-normal">kWh</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-sans flex items-center gap-1">
                    <Sun className="w-3 h-3 text-cyan-500" /> RE Available:
                  </span>
                  <span className="text-cyan-700 dark:text-cyan-300 font-mono font-semibold tabular-nums">
                    {sc.total_re_avail_kwh.toFixed(1)} <span className="font-sans text-slate-400 font-normal">kWh</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-sans flex items-center gap-1">
                    <Wind className="w-3 h-3 text-blue-500" /> Avg Wind:
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                    {sc.avg_wind_speed_ms.toFixed(1)} <span className="font-sans text-slate-400 font-normal">m/s</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-sans flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-indigo-400" /> Ambient Temp:
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                    {sc.avg_temp_c.toFixed(1)}<span className="font-sans text-slate-400 font-normal">°C</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-sans flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-500" /> Fuel Cap:
                  </span>
                  <span className="text-amber-700 dark:text-amber-400 font-mono font-semibold tabular-nums">
                    {sc.fuel_init_l.toFixed(0)} <span className="font-sans text-slate-400 font-normal">L</span>
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. SELECTED SCENARIO WORKBENCH */}
      {activeScenario && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f1d] p-5 lg:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-semibold font-sans text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Scenario Operating Profile & Dispatch Formulation
            </h3>
            <span className="text-xs font-sans text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-[#0d1527] px-2.5 py-1 rounded border border-cyan-200 dark:border-slate-800 font-medium">
              Active: {activeScenario.name}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Col 1: Boundary Assumptions */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="text-xs font-sans font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                1. Boundary Assumptions
              </div>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2.5">
                <li className="flex justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-800 font-sans">
                  <span className="text-slate-500 dark:text-slate-400">Duration:</span>
                  <span className="text-slate-900 dark:text-slate-100 font-mono tabular-nums">{activeScenario.duration_hours} Hours</span>
                </li>
                <li className="flex justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-800 font-sans">
                  <span className="text-slate-500 dark:text-slate-400">Available Fuel:</span>
                  <span className="text-amber-700 dark:text-amber-400 font-mono font-semibold tabular-nums">{activeScenario.fuel_init_l} Liters</span>
                </li>
                <li className="flex justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-800 font-sans">
                  <span className="text-slate-500 dark:text-slate-400">Initial Battery SOC:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-mono font-semibold tabular-nums">{(activeScenario.soc_init * 100).toFixed(0)}%</span>
                </li>
                <li className="flex justify-between font-sans">
                  <span className="text-slate-500 dark:text-slate-400">Peak Load Demand:</span>
                  <span className="text-slate-900 dark:text-slate-100 font-mono tabular-nums">{activeScenario.peak_load_kw.toFixed(1)} kW</span>
                </li>
              </ul>
            </div>

            {/* Col 2: Physical Energy Response */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="text-xs font-sans font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                2. Physical Energy Response
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                {getScenarioPhysicalResponse(activeScenario.id)}
              </p>
            </div>

            {/* Col 3: PolarEMS Recommendation */}
            <div className="p-4 rounded-lg bg-cyan-50/50 dark:bg-[#0c182b] border border-cyan-200 dark:border-cyan-600/40 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="text-xs font-sans font-semibold text-cyan-800 dark:text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  3. Dispatch Recommendation
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-sans">
                  {getScenarioRecommendation(activeScenario.id)}
                </p>
              </div>

              <button
                onClick={() => { onSelectStrategy('PolarEMS (Predictive GAMS)'); onNavigateTab('dispatch'); }}
                className="w-full mt-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-semibold text-xs font-sans transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs focus-ring"
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
