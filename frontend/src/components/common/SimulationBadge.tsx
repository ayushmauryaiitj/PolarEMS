import React from 'react';
import { Database, Cpu, ShieldCheck } from 'lucide-react';

interface SimulationBadgeProps {
  scenarioName?: string;
  horizon?: string;
}

export const SimulationBadge: React.FC<SimulationBadgeProps> = ({
  scenarioName,
  horizon = '24-Hour Horizon'
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/40 text-cyan-800 dark:text-cyan-300 font-medium">
        <Database className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
        <span>Simulation Mode</span>
      </span>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium">
        <Cpu className="w-3 h-3 text-slate-500 dark:text-slate-400" />
        <span>NWP & Load Synthesis</span>
      </span>
      {scenarioName && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium">
          <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>{scenarioName} ({horizon})</span>
        </span>
      )}
    </div>
  );
};
