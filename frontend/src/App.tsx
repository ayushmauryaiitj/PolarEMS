import React from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, TabId } from './components/layout/Sidebar';
import { OverviewView } from './components/overview/OverviewView';
import { EnergyFlowView } from './components/energy_flow/EnergyFlowView';
import { ForecastView } from './components/forecast/ForecastView';
import { DispatchView } from './components/dispatch/DispatchView';
import { ScenarioSimulatorView } from './components/scenario/ScenarioSimulatorView';
import { BenchmarkView } from './components/benchmark/BenchmarkView';
import { AlertsView } from './components/alerts/AlertsView';
import { ReportsView } from './components/reports/ReportsView';

import {
  ScenarioMeta,
  StrategyName,
  SystemStatus,
  DispatchRecord,
  BenchmarkRow,
  ForecastResponse,
  EnergyFlowResponse
} from './types';

import {
  fetchHealth,
  fetchScenarios,
  fetchBenchmark,
  fetchDispatch,
  fetchForecast,
  fetchEnergyFlow,
  fetchAlerts
} from './services/api';

export function App() {
  const [activeTab, setActiveTab] = React.useState<TabId>('overview');
  const [scenarios, setScenarios] = React.useState<ScenarioMeta[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = React.useState<string>('scenario_1');
  const [selectedStrategy, setSelectedStrategy] = React.useState<StrategyName>('PolarEMS (Predictive GAMS)');
  const [systemStatus, setSystemStatus] = React.useState<SystemStatus>('NORMAL');
  const [backendOnline, setBackendOnline] = React.useState<boolean>(false);

  const [benchmarkRows, setBenchmarkRows] = React.useState<BenchmarkRow[]>([]);
  const [dispatchRecords, setDispatchRecords] = React.useState<DispatchRecord[]>([]);
  const [forecastData, setForecastData] = React.useState<ForecastResponse | null>(null);
  const [energyFlow, setEnergyFlow] = React.useState<EnergyFlowResponse | null>(null);
  const [alerts, setAlerts] = React.useState<any[]>([]);
  const [currentHour, setCurrentHour] = React.useState<number>(12);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    async function init() {
      try {
        await fetchHealth();
        setBackendOnline(true);

        const scList = await fetchScenarios();
        setScenarios(scList);
        if (scList.length > 0 && !selectedScenarioId) {
          setSelectedScenarioId(scList[0].id);
        }

        const benchList = await fetchBenchmark();
        setBenchmarkRows(benchList);
      } catch (e) {
        console.error('Initialization error:', e);
        setBackendOnline(false);
      }
    }
    init();
  }, []);

  // Primary scenario/strategy change effect
  React.useEffect(() => {
    async function loadScenarioData() {
      if (!selectedScenarioId) return;
      try {
        const [disp, fc, alertsRes, flow] = await Promise.all([
          fetchDispatch(selectedScenarioId, selectedStrategy),
          fetchForecast(selectedScenarioId),
          fetchAlerts(selectedScenarioId, selectedStrategy),
          fetchEnergyFlow(selectedScenarioId, selectedStrategy, currentHour)
        ]);

        setDispatchRecords(disp.records);
        setForecastData(fc);
        setAlerts(alertsRes.alerts);
        setSystemStatus(alertsRes.system_status);
        setEnergyFlow(flow);
      } catch (e) {
        console.error('Error fetching scenario updates:', e);
      }
    }
    loadScenarioData();
  }, [selectedScenarioId, selectedStrategy]);

  // Hourly scrubber update effect (isolated for fast scrub performance)
  React.useEffect(() => {
    async function updateFlowHour() {
      if (!selectedScenarioId) return;
      try {
        const flow = await fetchEnergyFlow(selectedScenarioId, selectedStrategy, currentHour);
        setEnergyFlow(flow);
      } catch (e) {
        console.error('Error fetching hourly flow:', e);
      }
    }
    updateFlowHour();
  }, [selectedScenarioId, selectedStrategy, currentHour]);

  const activeScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0] || {
    id: 'scenario_1',
    name: 'Scenario 1: Normal / High Renewable',
    description: 'Standard polar station high-wind and solar operation.',
    fuel_init_l: 2000,
    soc_init: 0.70,
    start_time: '2020-04-13 00:00:00',
    end_time: '2020-04-13 23:00:00',
    duration_hours: 24,
    total_load_kwh: 5038.7,
    total_re_avail_kwh: 2779.4,
    peak_load_kw: 240.5,
    avg_wind_speed_ms: 8.5,
    avg_temp_c: -15.2
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-800 dark:selection:text-cyan-200 transition-colors duration-150 print:bg-white print:min-h-0 print:block">
      <Navbar
        scenarios={scenarios}
        selectedScenarioId={selectedScenarioId}
        onSelectScenario={setSelectedScenarioId}
        selectedStrategy={selectedStrategy}
        onSelectStrategy={setSelectedStrategy}
        systemStatus={systemStatus}
        backendOnline={backendOnline}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
      />

      <div className="flex flex-1 min-h-0 relative print:block print:min-h-0">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          activeAlertCount={alerts.length}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0 overflow-x-hidden p-3.5 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full print:p-0 print:m-0 print:max-w-none print:w-full print:overflow-visible">
          {activeTab === 'overview' && (
            <OverviewView
              scenario={activeScenario}
              strategy={selectedStrategy}
              dispatchRecords={dispatchRecords}
              benchmarkRows={benchmarkRows}
              alerts={alerts}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'energy_flow' && (
            <EnergyFlowView
              scenario={activeScenario}
              strategy={selectedStrategy}
              energyFlow={energyFlow}
              currentHour={currentHour}
              onHourChange={setCurrentHour}
            />
          )}

          {activeTab === 'forecast' && (
            <ForecastView
              scenario={activeScenario}
              forecastData={forecastData}
            />
          )}

          {activeTab === 'dispatch' && (
            <DispatchView
              scenario={activeScenario}
              strategy={selectedStrategy}
              dispatchRecords={dispatchRecords}
            />
          )}

          {activeTab === 'scenarios' && (
            <ScenarioSimulatorView
              scenarios={scenarios}
              selectedScenarioId={selectedScenarioId}
              onSelectScenario={setSelectedScenarioId}
              onSelectStrategy={setSelectedStrategy}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'benchmark' && (
            <BenchmarkView
              benchmarkRows={benchmarkRows}
              scenarios={scenarios}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsView
              scenario={activeScenario}
              strategy={selectedStrategy}
              alerts={alerts}
              systemStatus={systemStatus}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              benchmarkRows={benchmarkRows}
              scenarios={scenarios}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
