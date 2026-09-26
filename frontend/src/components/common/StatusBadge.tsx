import React from 'react';
import { SystemStatus } from '../../types';

interface StatusBadgeProps {
  status: SystemStatus | 'SIMULATION' | 'ONLINE' | 'OFFLINE' | 'OPTIMAL' | 'SOLVING' | 'NOMINAL' | 'HEALTHY' | 'STABLE';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();

  const configs: Record<string, { label: string; dotClass: string; bgClass: string }> = {
    NORMAL: {
      label: 'NOMINAL',
      dotClass: 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.7)]',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300',
    },
    NOMINAL: {
      label: 'NOMINAL',
      dotClass: 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.7)]',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300',
    },
    HEALTHY: {
      label: 'HEALTHY',
      dotClass: 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.7)]',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300',
    },
    STABLE: {
      label: 'STABLE',
      dotClass: 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.7)]',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300',
    },
    ONLINE: {
      label: 'API CONNECTED',
      dotClass: 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.7)]',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300',
    },
    OPTIMAL: {
      label: 'OPTIMAL MIP SOLVED',
      dotClass: 'bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.7)]',
      bgClass: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-300',
    },
    WARNING: {
      label: 'ADVISORY',
      dotClass: 'bg-amber-500 dark:bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.7)] animate-pulse',
      bgClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300',
    },
    CRITICAL: {
      label: 'LOAD SHEDDING / CRITICAL',
      dotClass: 'bg-rose-500 dark:bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-ping',
      bgClass: 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300',
    },
    OFFLINE: {
      label: 'STANDALONE MODE',
      dotClass: 'bg-slate-400 dark:bg-slate-500',
      bgClass: 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-400',
    },
    SIMULATION: {
      label: 'SIMULATION 24H',
      dotClass: 'bg-cyan-500 dark:bg-cyan-400',
      bgClass: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-700/40 text-cyan-800 dark:text-cyan-300',
    },
    SOLVING: {
      label: 'COMPUTING DISPATCH',
      dotClass: 'bg-cyan-500 dark:bg-cyan-400 animate-spin',
      bgClass: 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-300',
    }
  };

  const current = configs[normalized] || {
    label: status,
    dotClass: 'bg-slate-400 dark:bg-slate-500',
    bgClass: 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300',
  };

  const pad = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-sans font-semibold tracking-wide shrink-0 ${current.bgClass} ${pad}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dotClass}`} />
      <span className="truncate">{current.label}</span>
    </span>
  );
};
