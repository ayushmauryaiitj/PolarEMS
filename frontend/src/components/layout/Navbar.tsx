import React from 'react';
import { 
  Clock, 
  Sparkles,
  Sun,
  Moon,
  Menu,
  ChevronDown,
  Layers,
  Terminal
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
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  selectedStrategy,
  onSelectStrategy,
  systemStatus,
  onToggleMobileSidebar,
}) => {
  const [currentTime, setCurrentTime] = React.useState<string>('');
  const { isDark, toggleTheme } = useTheme();

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
    <header className="bg-white/95 dark:bg-[#070c17]/95 border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-40 backdrop-blur-md transition-colors duration-150 shadow-xs print:hidden">
      <div className="max-w-[1700px] mx-auto px-3 sm:px-5 py-2">
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Left: Brand Identity + Mobile Trigger */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={onToggleMobileSidebar}
                className="lg:hidden p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 focus-ring cursor-pointer"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Official PolarEMS Brand Icon Container */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-cyan-500/40 bg-slate-100 dark:bg-[#050811] flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.18)] shrink-0">
                <img
                  src="/assets/polarems-logo.png"
                  alt="PolarEMS Logo"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-sans font-bold tracking-tight text-slate-900 dark:text-slate-100 text-sm">
                    POLAREMS
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-sans font-bold bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-700/60 text-cyan-800 dark:text-cyan-300">
                    v2.0 PRO
                  </span>
                </div>
                <div className="text-[10.5px] font-sans font-medium text-slate-500 dark:text-slate-400">
                  Antarctic Energy Intelligence
                </div>
              </div>
            </div>

            {/* Mobile-only Quick Status & Theme Switcher */}
            <div className="flex md:hidden items-center gap-1.5">
              <StatusBadge status={systemStatus} size="sm" />
              <button
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 focus-ring cursor-pointer"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>
            </div>
          </div>

          {/* Center: Command Center Scenario & Strategy Segmented Controls */}
          <div className="flex flex-wrap items-center justify-start md:justify-center gap-2">
            {/* Scenario Selector HUD */}
            <div className="relative flex items-center bg-slate-100 dark:bg-[#0c1324] border border-slate-200 dark:border-slate-800/90 rounded-lg px-2.5 py-1 hover:border-slate-300 dark:hover:border-slate-700 transition-colors max-w-full">
              <div className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-400 mr-2 shrink-0">
                <Layers className="w-3.5 h-3.5" />
                <span className="text-[10.5px] font-sans font-semibold uppercase tracking-wider hidden sm:inline">
                  SCENARIO
                </span>
              </div>
              <select
                value={selectedScenarioId}
                onChange={(e) => onSelectScenario(e.target.value)}
                aria-label="Select Operational Scenario"
                className="bg-transparent text-xs font-sans font-medium text-slate-800 dark:text-slate-200 outline-none cursor-pointer pr-4 truncate max-w-[190px] sm:max-w-xs appearance-none"
              >
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none absolute right-2.5" />
            </div>

            {/* Strategy Segmented Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-[#0c1324] p-0.5 rounded-lg border border-slate-200 dark:border-slate-800/90 overflow-x-auto max-w-full">
              {strategies.map((strat) => {
                const active = selectedStrategy === strat;
                const isPolar = strat.includes('PolarEMS');
                return (
                  <button
                    key={strat}
                    onClick={() => onSelectStrategy(strat)}
                    className={`px-2.5 py-1 rounded-md text-xs font-sans transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                      active
                        ? isPolar
                          ? 'bg-cyan-500/20 dark:bg-cyan-950/90 text-cyan-900 dark:text-cyan-200 border border-cyan-400 dark:border-cyan-500/50 shadow-xs font-semibold'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 shadow-xs font-semibold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                    }`}
                  >
                    {isPolar && <Sparkles className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />}
                    <span>{strat === 'PolarEMS (Predictive GAMS)' ? 'PolarEMS MIP' : strat === 'Rule-Based Hybrid' ? 'Rule-Based' : 'Diesel-Only'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Operational Telemetry Bar & Theme Switcher */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            <StatusBadge status={systemStatus} size="sm" />

            {/* Real-time UTC Sync Clock */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#0c1324] border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300">
              <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span className="tabular-nums font-semibold">{currentTime || '00:00:00 UTC'}</span>
            </div>

            {/* Simulation Horizon Mode Pill */}
            <div className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-[#0c1324] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-sans font-medium">
              <Terminal className="w-3 h-3 text-emerald-500" />
              <span>24H MIP</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 hover:bg-slate-200 dark:bg-[#0c1324] dark:hover:bg-slate-800 text-xs font-sans font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer focus-ring"
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-sans font-medium">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                  <span className="text-xs font-sans font-medium">Dark</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
