import React from 'react';
import { 
  ShieldAlert, 
  Filter, 
  ShieldCheck 
} from 'lucide-react';
import { ScenarioMeta, StrategyName, SystemStatus, AlertItem } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface AlertsViewProps {
  scenario: ScenarioMeta;
  strategy: StrategyName;
  alerts: AlertItem[];
  systemStatus: SystemStatus;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  scenario,
  strategy,
  alerts,
  systemStatus,
}) => {
  const [filterLevel, setFilterLevel] = React.useState<'ALL' | 'HIGH' | 'WARNING' | 'INFO'>('ALL');

  const filteredAlerts = alerts.filter(a => {
    if (filterLevel === 'ALL') return true;
    return a.level === filterLevel;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white dark:bg-[#0e1524]/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-none backdrop-blur flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Operational Risk & Alert Management Center
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
            <span>Scenario: <strong className="text-slate-800 dark:text-slate-200">{scenario.name}</strong></span>
            <span>•</span>
            <span>Strategy: <strong className="text-slate-800 dark:text-slate-200">{strategy}</strong></span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={systemStatus} />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white dark:bg-[#0e1524] p-1 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs shadow-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
          {(['ALL', 'HIGH', 'WARNING', 'INFO'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filterLevel === lvl
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold border border-slate-300 dark:border-slate-700 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {lvl === 'HIGH' ? 'CRITICAL' : lvl}
            </button>
          ))}
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          Showing {filteredAlerts.length} of {alerts.length} alerts
        </span>
      </div>

      {/* Structured WHY / IMPACT / ACTION Alert Cards */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#0e1524]/60 border border-slate-200 dark:border-slate-800/80 text-center space-y-2 shadow-sm">
            <ShieldCheck className="w-8 h-8 text-emerald-500 dark:text-emerald-400 mx-auto" />
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Active Alerts in this Category</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">All microgrid assets are operating within nominal boundaries.</p>
          </div>
        ) : (
          filteredAlerts.map((alert, idx) => {
            const isHigh = alert.level === 'HIGH';
            const isWarn = alert.level === 'WARNING';
            const borderCol = isHigh 
              ? 'border-rose-300 dark:border-rose-500/40 bg-rose-50/70 dark:bg-rose-950/10' 
              : isWarn 
              ? 'border-amber-300 dark:border-amber-500/40 bg-amber-50/70 dark:bg-amber-950/10' 
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60';
            const badgeCol = isHigh 
              ? 'bg-rose-100 dark:bg-rose-950/80 border-rose-300 dark:border-rose-500/50 text-rose-800 dark:text-rose-300' 
              : isWarn 
              ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-500/50 text-amber-800 dark:text-amber-300' 
              : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300';

            return (
              <div key={idx} className={`p-5 rounded-2xl border ${borderCol} space-y-3 shadow-xs transition-colors`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeCol}`}>
                      {alert.level === 'HIGH' ? 'CRITICAL' : alert.level}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {alert.title}
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Subsystem: <strong className="text-slate-800 dark:text-slate-300">{alert.subsystem}</strong>
                  </span>
                </div>

                {/* WHY / IMPACT / ACTION Structure */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200/80 dark:border-slate-800/60 text-xs font-mono">
                  <div className="space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold">Why (Root Cause)</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">{alert.message}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold">Impact (Subsystem Risk)</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">Potential fuel depletion or localized power shedding.</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-cyan-700 dark:text-cyan-400 text-[10px] uppercase font-bold">Action (Recommended Response)</span>
                    <p className="text-cyan-900 dark:text-cyan-200 leading-relaxed font-semibold font-sans">{alert.action}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
