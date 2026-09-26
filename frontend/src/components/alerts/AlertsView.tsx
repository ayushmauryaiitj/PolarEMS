import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck,
  AlertTriangle,
  Info,
  Terminal
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

  const criticalCount = alerts.filter(a => a.level === 'HIGH').length;
  const warningCount = alerts.filter(a => a.level === 'WARNING').length;
  const infoCount = alerts.filter(a => a.level === 'INFO').length;

  return (
    <div className="space-y-5">
      {/* 1. OPERATIONAL RISK CONSOLE HEADER */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f1d] p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-600/40 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Operational Risk & Alert Management Console
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-slate-100 dark:bg-[#111a2d] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              REAL-TIME ADVISORY
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2 font-sans">
            <span>Scenario: <strong className="text-slate-800 dark:text-slate-200">{scenario.name.split(':')[0]}</strong></span>
            <span>•</span>
            <span>Strategy: <strong className="text-cyan-700 dark:text-cyan-300">{strategy}</strong></span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={systemStatus} />
        </div>
      </div>

      {/* 2. FILTER TOOLBAR & SEVERITY COUNTERS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-[#0a0f1d] p-1 rounded-lg border border-slate-200 dark:border-slate-800 font-sans text-xs shadow-xs">
          <button
            onClick={() => setFilterLevel('ALL')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer focus-ring flex items-center gap-1.5 ${
              filterLevel === 'ALL'
                ? 'bg-white dark:bg-[#16223f] text-slate-900 dark:text-slate-100 font-bold border border-slate-300 dark:border-slate-700 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>ALL</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono tabular-nums bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {alerts.length}
            </span>
          </button>

          <button
            onClick={() => setFilterLevel('HIGH')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer focus-ring flex items-center gap-1.5 ${
              filterLevel === 'HIGH'
                ? 'bg-rose-500 text-white font-bold shadow-xs'
                : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            }`}
          >
            <span>CRITICAL</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono tabular-nums bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-bold">
              {criticalCount}
            </span>
          </button>

          <button
            onClick={() => setFilterLevel('WARNING')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer focus-ring flex items-center gap-1.5 ${
              filterLevel === 'WARNING'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
            }`}
          >
            <span>WARNING</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono tabular-nums bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold">
              {warningCount}
            </span>
          </button>

          <button
            onClick={() => setFilterLevel('INFO')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer focus-ring flex items-center gap-1.5 ${
              filterLevel === 'INFO'
                ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold shadow-xs'
                : 'text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/30'
            }`}
          >
            <span>INFO</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono tabular-nums bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 font-bold">
              {infoCount}
            </span>
          </button>
        </div>

        <span className="text-xs font-sans text-slate-500 dark:text-slate-400">
          Showing {filteredAlerts.length} of {alerts.length} Active Directives
        </span>
      </div>

      {/* 3. STRUCTURED OPERATIONAL RISK CARDS */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 rounded-xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-xs">
            <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-sans">
              Zero Active Advisories in Category
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              All microgrid generation assets and energy storage parameters are operating within nominal specifications.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert, idx) => {
            const isHigh = alert.level === 'HIGH';
            const isWarn = alert.level === 'WARNING';

            const cardBorder = isHigh
              ? 'border-rose-300 dark:border-rose-600/50 bg-rose-50/40 dark:bg-[#160c14]'
              : isWarn
              ? 'border-amber-300 dark:border-amber-600/50 bg-amber-50/40 dark:bg-[#18110b]'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f1d]';

            const badgeStyle = isHigh
              ? 'bg-rose-100 dark:bg-rose-950/80 border-rose-300 dark:border-rose-600/60 text-rose-800 dark:text-rose-300'
              : isWarn
              ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-600/60 text-amber-800 dark:text-amber-300'
              : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300';

            const indicatorIcon = isHigh ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            ) : isWarn ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            ) : (
              <Info className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            );

            return (
              <div 
                key={idx} 
                className={`p-5 rounded-xl border ${cardBorder} shadow-xs space-y-4 transition-all relative overflow-hidden`}
              >
                {/* Left severity indicator border accent */}
                <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                  isHigh ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-cyan-500'
                }`} />

                {/* Alert Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pl-2">
                  <div className="flex items-center gap-2.5">
                    {indicatorIcon}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold border ${badgeStyle}`}>
                          {isHigh ? 'CRITICAL ALERT' : alert.level}
                        </span>
                        <span className="text-[11px] font-sans font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {alert.subsystem || 'GRID RELIABILITY'}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold font-sans text-slate-900 dark:text-slate-100 mt-1">
                        {alert.title}
                      </h3>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900/60 px-2 py-1 rounded shrink-0">
                    ID: {alert.id || `ALT-0${idx + 1}`}
                  </span>
                </div>

                {/* Structured WHY / IMPACT / ACTION Zones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                  {/* Zone A: Event Root Cause & Impact */}
                  <div className="p-3 rounded-lg bg-white/80 dark:bg-[#070b16] border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="text-[10px] font-sans font-bold uppercase text-slate-500 dark:text-slate-400">
                      Physical Condition & Event Impact
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                      {alert.message}
                    </p>
                  </div>

                  {/* Zone B: Action Directive */}
                  <div className="p-3 rounded-lg bg-cyan-50/60 dark:bg-[#0c182b] border border-cyan-200 dark:border-cyan-600/40 space-y-1">
                    <div className="text-[10px] font-sans font-bold uppercase text-cyan-800 dark:text-cyan-300 flex items-center gap-1">
                      <Terminal className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                      Recommended Station Action
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
                      {alert.action}
                    </p>
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
