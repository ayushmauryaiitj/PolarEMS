import React from 'react';
import { 
  Activity, 
  Clock, 
  Radio, 
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { ScenarioMeta, StrategyName, SystemStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  scenarios: ScenarioMeta[];
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
  selectedStrategy: StrategyName;
  onSelectStrategy: (strat: StrategyName) => void;
  systemStatus: SystemStatus;
  backendOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  selectedStrategy,
  onSelectStrategy,
  systemStatus,
}) => {
  const [currentTime, setCurrentTime] = React.useState<string>('');
  const { theme, isDark, toggleTheme } = useTheme();

  React.useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const strategies: StrategyName[] = [
    'Diesel-Only',
    'Rule-Based Hybrid',
    'PolarEMS (Predictive GAMS)'
  ];

  return (
    <header className="bg-white/95 dark:bg-[#0b1018]/95 border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-40 backdrop-blur-md px-4 lg:px-6 py-2.5 transition-colors duration-150">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center justify-between lg:justify-start gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-cyan-500/40 bg-slate-100 dark:bg-[#070e1a] flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.15)] shrink-0">
              <img
                src="/assets/polarems-logo.png"
                alt="PolarEMS Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold tracking-tight text-slate-900 dark:text-slate-100 text-sm">
                  POLAREMS
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-100 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-700/50 text-cyan-800 dark:text-cyan-300">
                  v2.0 PRO
                </span>
              </div>
              <div className="text-[10px] tracking-wider uppercase font-mono text-slate-500 dark:text-slate-400">
                Antarctic Energy Intelligence
              </div>
            </div>
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <StatusBadge status={systemStatus} size="sm" />
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>

        {/* Center operational controls: Scenario + Strategy */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* Scenario Selector */}
          <div className="relative flex items-center bg-slate-100 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <Radio className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 mr-2 shrink-0" />
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mr-2 hidden sm:inline">
              Scenario:
            </span>
            <select
              value={selectedScenarioId}
              onChange={(e) => onSelectScenario(e.target.value)}
              aria-label="Select Operational Scenario"
              className="bg-transparent text-xs font-mono font-medium text-slate-800 dark:text-slate-200 outline-none cursor-pointer pr-4"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Strategy Switcher Pills */}
          <div className="flex items-center bg-slate-100 dark:bg-[#070b12] p-1 rounded-lg border border-slate-200 dark:border-slate-800/80">
            {strategies.map((strat) => {
              const active = selectedStrategy === strat;
              const isPolar = strat.includes('PolarEMS');
              return (
                <button
                  key={strat}
                  onClick={() => onSelectStrategy(strat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all flex items-center gap-1.5 ${
                    active
                      ? isPolar
                        ? 'bg-cyan-500/15 dark:bg-gradient-to-r dark:from-cyan-950/80 dark:to-blue-950/80 text-cyan-800 dark:text-cyan-200 border border-cyan-400 dark:border-cyan-500/40 shadow-sm font-semibold'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-900/60'
                  }`}
                >
                  {isPolar && <Sparkles className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />}
                  <span>{strat === 'PolarEMS (Predictive GAMS)' ? 'PolarEMS' : strat === 'Rule-Based Hybrid' ? 'Rule-Based' : 'Diesel-Only'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right telemetry status indicators & Theme Toggle */}
        <div className="hidden lg:flex items-center gap-2.5 font-mono">
          <StatusBadge status={systemStatus} size="sm" />
          
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="tabular-nums">{currentTime || '00:00:00 UTC'}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
            <Activity className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
            <span>24H SIM</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-mono uppercase">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-700" />
                <span className="text-[10px] font-mono uppercase">Dark</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
