export const DISPATCH_URL =
  (import.meta as any).env?.VITE_DISPATCH_URL || 'http://192.168.1.178:4001';

export interface ConsideredSurface {
  model: string | null;
  surface: string;
  billing?: string;
  via: string | null;
  routable: boolean;
  available: boolean | null;
  gated_out: boolean;
}

export interface DispatchDecision {
  ts: string;
  task?: string;
  category: string;
  complexity: string;
  urgency: string;
  confidence: string;
  chosen_surface: string | null;
  chosen_model: string | null;
  via: string | null;
  served_by: string | null;
  latency_ms: number | null;
  status: string;
  considered?: string;
}

export interface DispatchSurfaceStatus {
  surface: string;
  kind?: string;
  host?: string;
  billing?: string | null;
  via: string | null;
  available: boolean;
  detail?: string | null;
}

export interface DispatchHealth {
  status: string;
  service?: string;
}

export async function fetchDispatchHealth(): Promise<DispatchHealth> {
  const response = await fetch(`${DISPATCH_URL}/health`);
  if (!response.ok) throw new Error(`dispatch health ${response.status}`);
  return response.json();
}

export async function fetchDispatchSurfaces(): Promise<{ surfaces: DispatchSurfaceStatus[] }> {
  const response = await fetch(`${DISPATCH_URL}/surfaces`);
  if (!response.ok) throw new Error(`dispatch surfaces ${response.status}`);
  return response.json();
}

export async function fetchDispatchDecisions(): Promise<{ decisions: DispatchDecision[] }> {
  const response = await fetch(`${DISPATCH_URL}/decisions`);
  if (!response.ok) throw new Error(`dispatch ${response.status}`);
  return response.json();
}
