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
  ChevronDown,
  ChevronUp,
  Server,
  X,
  Compass,
  Zap,
  Battery,
  Flame,
  Wind
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
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavSection {
  title: string;
  items: Array<{
    id: TabId;
    label: string;
    icon: React.ReactNode;
    code: string;
    badge?: number;
  }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  activeAlertCount,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [configOpen, setConfigOpen] = React.useState<boolean>(false);

  const sections: NavSection[] = [
    {
      title: 'OPERATIONS',
      items: [
        { id: 'overview', label: 'Overview', code: '01', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'energy_flow', label: 'Live Energy Flow', code: '02', icon: <Activity className="w-4 h-4" /> },
        { id: 'dispatch', label: 'Predictive Dispatch', code: '03', icon: <Cpu className="w-4 h-4" /> },
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'forecast', label: 'AI Forecast', code: '04', icon: <TrendingUp className="w-4 h-4" /> },
        { id: 'scenarios', label: 'Scenario Simulator', code: '05', icon: <Sliders className="w-4 h-4" /> },
        { id: 'benchmark', label: 'Benchmark Matrix', code: '06', icon: <BarChart3 className="w-4 h-4" /> },
      ]
    },
    {
      title: 'GOVERNANCE',
      items: [
        { 
          id: 'alerts', 
          label: 'Risk & Alerts', 
          code: '07', 
          icon: <ShieldAlert className="w-4 h-4" />, 
          badge: activeAlertCount > 0 ? activeAlertCount : undefined 
        },
        { id: 'reports', label: 'Reports & Audits', code: '08', icon: <FileText className="w-4 h-4" /> },
      ]
    }
  ];

  const handleItemClick = (id: TabId) => {
    onSelectTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between select-none">
      {/* Brand Header for Mobile Drawer */}
      <div className="lg:hidden flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span className="font-sans font-bold text-xs tracking-wider text-slate-800 dark:text-slate-200">
            POLAREMS CONSOLE
          </span>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close Navigation"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Structured Group Navigation */}
      <div className="space-y-4 overflow-y-auto pr-1">
        {sections.map((sec) => (
          <div key={sec.title} className="space-y-1">
            <div className="px-2.5 py-1 text-[10px] font-sans font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase flex items-center justify-between">
              <span>{sec.title}</span>
              <span className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800" />
            </div>

            {sec.items.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-sans font-medium transition-all group relative cursor-pointer ${
                    active
                      ? 'bg-slate-200/70 dark:bg-[#111a2d] text-cyan-800 dark:text-cyan-300 font-semibold active-nav-indicator border border-slate-300/80 dark:border-cyan-500/30 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`transition-colors shrink-0 ${active ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.badge !== undefined ? (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-sans font-bold bg-rose-500/15 dark:bg-rose-500/25 border border-rose-500/30 text-rose-600 dark:text-rose-300">
                        {item.badge}
                      </span>
                    ) : (
                      <span className={`font-mono text-[9px] ${active ? 'text-cyan-600 dark:text-cyan-400/80 font-bold' : 'text-slate-400/60 dark:text-slate-600 group-hover:text-slate-400'}`}>
                        {item.code}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Modeled Hardware Telemetry Console (Docked at Bottom) */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 mt-auto">
        <button
          onClick={() => setConfigOpen(!configOpen)}
          className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-100 dark:bg-[#0d1527] hover:bg-slate-200/80 dark:hover:bg-[#111a2d] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-sans font-medium transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="font-semibold uppercase tracking-wider text-[10.5px]">Hardware Spec</span>
          </div>
          {configOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </button>

        {configOpen && (
          <div className="mt-2 p-2.5 rounded-lg bg-white dark:bg-[#070d18] border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 text-slate-600 dark:text-slate-400 shadow-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-sans flex items-center gap-1">
                <Zap className="w-3 h-3 text-cyan-500" /> PV Array:
              </span>
              <span className="text-slate-900 dark:text-slate-200 font-mono font-semibold tabular-nums">100 kWp</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-sans flex items-center gap-1">
                <Wind className="w-3 h-3 text-blue-500" /> Wind Turbines:
              </span>
              <span className="text-slate-900 dark:text-slate-200 font-mono font-semibold tabular-nums">150 kW</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-sans flex items-center gap-1">
                <Battery className="w-3 h-3 text-emerald-500" /> BESS Storage:
              </span>
              <span className="text-slate-900 dark:text-slate-200 font-mono font-semibold tabular-nums">200 kWh</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-sans flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-500" /> Diesel GenSet:
              </span>
              <span className="text-slate-900 dark:text-slate-200 font-mono font-semibold tabular-nums">200 kW</span>
            </div>
            <div className="pt-1.5 text-[10px] font-mono text-cyan-700 dark:text-cyan-400 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span>Bus: 400V AC 3Φ</span>
              <span>η_bat: 95%</span>
            </div>
          </div>
        )}

        <div className="mt-2.5 px-1 py-0.5 flex items-center justify-between text-xs font-sans text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
            <span className="font-medium">MIP Solver Active</span>
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Maitri Base</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Mission-Control Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-100/60 dark:bg-[#070c17] border-r border-slate-200 dark:border-slate-800/80 flex-col shrink-0 p-3.5 transition-colors duration-150 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto print:hidden">
        {navContent}
      </aside>

      {/* Mobile / Tablet Off-Canvas Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex print:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-[#070c17] border-r border-slate-200 dark:border-slate-800 p-4 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
