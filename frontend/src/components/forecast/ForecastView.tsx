import React from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  Sun, 
  Wind, 
  Zap, 
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { ScenarioMeta, ForecastResponse } from '../../types';
import { SimulationBadge } from '../common/SimulationBadge';
import { useTheme } from '../../context/ThemeContext';

interface ForecastViewProps {
  scenario: ScenarioMeta;
  forecastData: ForecastResponse | null;
}

export const ForecastView: React.FC<ForecastViewProps> = ({
  scenario,
  forecastData,
}) => {
  const { isDark } = useTheme();
  const records = forecastData?.records || [];
  const insights = forecastData?.insights || [
    'Forward 24-hour weather prediction processed via Random Forest regressor model.',
    'Solar output peaks around mid-day solar elevation.',
    'Wind speed variance aligns with Antarctic coastal katabatic wind patterns.'
  ];

  const tooltipStyle = {
    backgroundColor: isDark ? '#090e1a' : '#ffffff',
    borderColor: isDark ? '#334155' : '#cbd5e1',
    color: isDark ? '#f1f5f9' : '#0f172a',
    borderRadius: '8px',
    fontSize: '11px',
    fontFamily: 'monospace',
    boxShadow: isDark ? '0 10px 15px -3px rgba(0,0,0,0.5)' : '0 10px 15px -3px rgba(0,0,0,0.1)'
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="scada-panel p-5 backdrop-blur flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20">
              <TrendingUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Multi-Horizon Renewable & Demand Forecasting
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-cyan-100 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800/40 text-cyan-800 dark:text-cyan-300">
              RANDOM FOREST REGRESSOR
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
            24-Hour forward predictive synthesis for station demand, bifacial solar irradiance, and wind generation
          </p>
        </div>

        <SimulationBadge scenarioName={scenario.name} />
      </div>

      {/* Next 6 Hours Outlook Banner */}
      <div className="scada-panel p-5 border-l-4 border-l-cyan-500 space-y-3">
        <div className="flex items-center gap-2 text-xs font-sans font-bold text-cyan-800 dark:text-cyan-300 tracking-wide">
          <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>Next 6-Hour Horizon Operational Outlook</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {insights.map((ins, idx) => (
            <div key={idx} className="p-3.5 rounded-lg bg-slate-50/70 dark:bg-[#060a12] border border-slate-200 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 mt-1.5 shrink-0" />
              <span className="font-sans leading-relaxed">{ins}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3 Dedicated Recharts: Load, Solar, Wind */}
      <div className="space-y-6">
        {/* Load Demand Forecast Chart */}
        <div className="scada-panel p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-sm font-semibold font-sans text-slate-900 dark:text-slate-200">
                Station Electrical Load Demand (kW)
              </h3>
            </div>
            <span className="text-xs font-sans text-slate-500 dark:text-slate-400">Forecast vs Actual Baseline</span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={records} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="hour" stroke="#64748b" tickFormatter={(v) => `T+${v}`} fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit=" kW" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px', fontFamily: 'Inter, sans-serif' }} />
                <Line type="monotone" dataKey="load_actual_kw" stroke={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2} dot={false} name="Actual Load Baseline" />
                <Line type="monotone" dataKey="load_fc_kw" stroke={isDark ? '#06b6d4' : '#0891b2'} strokeWidth={2.5} strokeDasharray="4 2" dot={false} name="AI Predictive Forecast" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2-Column Split: Solar & Wind Forecasts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Solar PV Generation Forecast */}
          <div className="scada-panel p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-sm font-semibold font-sans text-slate-900 dark:text-slate-200">
                  Solar PV Generation (kW)
                </h3>
              </div>
              <span className="text-xs font-sans text-slate-500 dark:text-slate-400">100 kWp Bifacial</span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={records} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                  <XAxis dataKey="hour" stroke="#64748b" tickFormatter={(v) => `T+${v}`} fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} unit=" kW" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px', fontFamily: 'Inter, sans-serif' }} />
                  <Line type="monotone" dataKey="solar_actual_kw" stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth={2} dot={false} name="Actual Solar Baseline" />
                  <Line type="monotone" dataKey="solar_fc_kw" stroke={isDark ? '#06b6d4' : '#0891b2'} strokeWidth={2.5} strokeDasharray="4 2" dot={false} name="AI Solar Forecast" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Wind Turbine Generation Forecast */}
          <div className="scada-panel p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold font-sans text-slate-900 dark:text-slate-200">
                  Wind Turbine Generation (kW)
                </h3>
              </div>
              <span className="text-xs font-sans text-slate-500 dark:text-slate-400">150 kW Arctic Model</span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={records} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                  <XAxis dataKey="hour" stroke="#64748b" tickFormatter={(v) => `T+${v}`} fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} unit=" kW" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px', fontFamily: 'Inter, sans-serif' }} />
                  <Line type="monotone" dataKey="wind_actual_kw" stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth={2} dot={false} name="Actual Wind Baseline" />
                  <Line type="monotone" dataKey="wind_fc_kw" stroke={isDark ? '#3b82f6' : '#2563eb'} strokeWidth={2.5} strokeDasharray="4 2" dot={false} name="AI Wind Forecast" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Model Information & Scientific Provenance */}
      <div className="scada-panel p-4 text-xs font-sans text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span>
            Model: <strong className="text-slate-900 dark:text-slate-200">Random Forest Regressor (100 Estimators)</strong> · Target: <strong className="text-slate-900 dark:text-slate-200">Load / Solar / Wind</strong> · Horizon: <strong className="text-slate-900 dark:text-slate-200">24 Hours</strong>
          </span>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
          * Derived dataset from NWP atmospheric reanalysis & station load profiles.
        </div>
      </div>
    </div>
  );
};
