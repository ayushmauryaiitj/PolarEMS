import {
  ScenarioMeta,
  BenchmarkRow,
  DispatchRecord,
  ForecastResponse,
  AlertsResponse,
  EnergyFlowResponse
} from '../types';

const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE = `${rawBase.replace(/\/+$/, '')}/api`;

export async function fetchHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
}

export async function fetchScenarios(): Promise<ScenarioMeta[]> {
  const res = await fetch(`${API_BASE}/scenarios`);
  if (!res.ok) throw new Error('Failed to fetch scenarios');
  return res.json();
}

export async function fetchBenchmark(): Promise<BenchmarkRow[]> {
  const res = await fetch(`${API_BASE}/benchmark`);
  if (!res.ok) throw new Error('Failed to fetch benchmark');
  return res.json();
}

export async function fetchDispatch(
  scenarioId: string,
  strategy: string
): Promise<{ scenario: string; strategy: string; records: DispatchRecord[] }> {
  const params = new URLSearchParams({ scenario: scenarioId, strategy });
  const res = await fetch(`${API_BASE}/dispatch?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch dispatch');
  return res.json();
}

export async function fetchForecast(scenarioId: string): Promise<ForecastResponse> {
  const params = new URLSearchParams({ scenario: scenarioId });
  const res = await fetch(`${API_BASE}/forecast?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch forecast');
  return res.json();
}

export async function fetchEnergyFlow(
  scenarioId: string,
  strategy: string,
  hour: number
): Promise<EnergyFlowResponse> {
  const params = new URLSearchParams({ scenario: scenarioId, strategy, hour: hour.toString() });
  const res = await fetch(`${API_BASE}/energy_flow?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch energy flow');
  return res.json();
}

export async function fetchAlerts(
  scenarioId: string,
  strategy: string
): Promise<AlertsResponse> {
  const params = new URLSearchParams({ scenario: scenarioId, strategy });
  const res = await fetch(`${API_BASE}/alerts?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}
