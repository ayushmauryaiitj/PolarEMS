import React from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  TrendingUp, 
  Cpu, 
  Sliders, 
  BarChart3, 
  ShieldAlert, 
  FileText,
  Radio,
  ChevronDown,
  ChevronUp,
  Server
} from 'lucide-react';

export type TabId = 
  | 'overview' 
  | 'energy_flow' 
  | 'forecast' 
  | 'dispatch' 
  | 'scenarios' 
  | 'benchmark' 
  | 'alerts' 
  | 'reports';

interface SidebarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  activeAlertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  activeAlertCount,
}) => {
  const [configOpen, setConfigOpen] = React.useState<boolean>(false);

  const navItems: Array<{ id: TabId; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'energy_flow', label: 'Live Energy Flow', icon: <Activity className="w-4 h-4" /> },
    { id: 'forecast', label: 'AI Forecast', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'dispatch', label: 'Predictive Dispatch', icon: <Cpu className="w-4 h-4" /> },
    { id: 'scenarios', label: 'Scenario Simulator', icon: <Sliders className="w-4 h-4" /> },
    { id: 'benchmark', label: 'Benchmark Matrix', icon: <BarChart3 className="w-4 h-4" /> },
    { 
      id: 'alerts', 
      label: 'Risk & Alerts', 
      icon: <ShieldAlert className="w-4 h-4" />, 
      badge: activeAlertCount > 0 ? activeAlertCount : undefined 
    },
    { id: 'reports', label: 'Reports & Audits', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-slate-50/70 dark:bg-[#090e17] border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shrink-0 select-none p-3 transition-colors duration-150">
      {/* Navigation list */}
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
          Mission Navigation
        </div>

        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                active
                  ? 'bg-white dark:bg-slate-800/90 text-cyan-700 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`transition-colors ${active ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 dark:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-300">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Modeled station configuration drawer */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80">
        <button
          onClick={() => setConfigOpen(!configOpen)}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-white/80 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 text-[11px] font-mono transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Modeled Hardware</span>
          </div>
          {configOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {configOpen && (
          <div className="mt-2 p-2.5 rounded-lg bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 text-[10px] font-mono space-y-1.5 text-slate-600 dark:text-slate-400 shadow-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Solar PV:</span>
              <span className="text-slate-900 dark:text-slate-200 font-semibold">100 kWp Bifacial</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Wind Turbine:</span>
              <span className="text-slate-900 dark:text-slate-200 font-semibold">150 kW Cold-Site</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">BESS Storage:</span>
              <span className="text-slate-900 dark:text-slate-200 font-semibold">200 kWh / 100 kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Diesel GenSet:</span>
              <span className="text-slate-900 dark:text-slate-200 font-semibold">200 kW Prime</span>
            </div>
            <div className="pt-1 text-[9px] text-cyan-600 dark:text-cyan-400/80 border-t border-slate-200 dark:border-slate-800">
              * Modeled Simulation Specs
            </div>
          </div>
        )}

        <div className="mt-2 px-2 py-1 flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400" />
            <span>GAMS MIP</span>
          </span>
          <span className="text-slate-400 dark:text-slate-500">Maitri Base Model</span>
        </div>
      </div>
    </aside>
  );
};
