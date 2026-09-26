import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: 'positive' | 'negative' | 'neutral';
  trendText?: string;
  statusDot?: 'green' | 'amber' | 'red' | 'cyan' | 'slate';
  isPrimary?: boolean;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  subValue,
  icon,
  trend,
  trendText,
  statusDot = 'cyan',
  isPrimary = false,
  className = '',
}) => {
  const dotColor = {
    green: 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]',
    amber: 'bg-amber-500 dark:bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]',
    red: 'bg-rose-500 dark:bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.5)]',
    cyan: 'bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.5)]',
    slate: 'bg-slate-400 dark:bg-slate-500',
  }[statusDot];

  const trendColor = {
    positive: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40',
    negative: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40',
    neutral: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/40',
  }[trend || 'neutral'];

  return (
    <div
      className={`rounded-xl border transition-all duration-200 flex flex-col justify-between ${
        isPrimary
          ? 'bg-white dark:bg-[#0e1524] border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
          : 'bg-white dark:bg-[#0e1524]/90 border-slate-200 dark:border-slate-800/80 p-3.5 sm:p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
      } ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
            <span className="text-xs font-sans font-medium tracking-wide text-slate-500 dark:text-slate-400 uppercase truncate">
              {label}
            </span>
          </div>
          {icon && <div className="text-slate-400 dark:text-slate-500 shrink-0">{icon}</div>}
        </div>

        <div className="flex items-baseline gap-1.5 mt-1">
          <span
            className={`font-mono font-bold tracking-tight tabular-nums text-slate-900 dark:text-slate-100 ${
              isPrimary ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
            }`}
          >
            {value}
          </span>
          {unit && (
            <span className="font-sans text-xs font-normal text-slate-500 dark:text-slate-400">
              {unit}
            </span>
          )}
        </div>
      </div>

      {(subValue || trendText) && (
        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 text-xs font-sans">
          {subValue && (
            <span className="text-slate-500 dark:text-slate-400 truncate text-xs font-sans">
              {subValue}
            </span>
          )}
          {trendText && (
            <span
              className={`px-1.5 py-0.5 rounded font-sans text-[10px] font-semibold border shrink-0 ${trendColor}`}
            >
              {trendText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
