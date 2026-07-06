import type { DispatchJob, DispatchPollResult, Workflow } from '../types';

function isLocalDev(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host.startsWith('192.168.') || host === '127.0.0.1';
}

export const DISPATCH_URL = isLocalDev()
  ? (import.meta as any).env?.VITE_DISPATCH_URL || 'http://192.168.1.178:4001'
  : '/api/dispatch';

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

export interface SubmitTaskInput {
  repo?: string;
  command?: string;
  prompt: string;
  workflowId?: string;
  workItemId?: string;
  trigger?: string;
}

export interface CreateWorkflowRunInput extends SubmitTaskInput {
  workflowId: string;
  workItemId: string;
  trigger: string;
}

function normalizeJobId(payload: unknown): string {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const id = record.id ?? record.jobId ?? record.job_id ?? record.runId ?? record.run_id ?? record.taskId ?? record.task_id;
    if (typeof id === 'string' && id.trim()) return id;
  }
  throw new Error('dispatch response missing job id');
}

function normalizePollResult(payload: unknown): DispatchPollResult {
  const record = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const status = typeof record.status === 'string' ? record.status : 'running';
  const verificationRecord = record.verification && typeof record.verification === 'object'
    ? record.verification as Record<string, unknown>
    : null;
  return {
    status: status === 'queued' || status === 'running' || status === 'done' || status === 'failed' || status === 'cancelled' ? status : 'running',
    output: typeof record.output === 'string' ? record.output : undefined,
    error: typeof record.error === 'string' ? record.error : undefined,
    exitCode: typeof record.exitCode === 'number' ? record.exitCode : typeof record.exit_code === 'number' ? record.exit_code : null,
    surface: typeof record.surface === 'string' ? record.surface : null,
    model: typeof record.model === 'string' ? record.model : null,
    latencyMs: typeof record.latencyMs === 'number' ? record.latencyMs : typeof record.latency_ms === 'number' ? record.latency_ms : null,
    verification: verificationRecord
      ? {
          lint: Boolean(verificationRecord.lint),
          build: Boolean(verificationRecord.build),
          exitCode: typeof verificationRecord.exitCode === 'number'
            ? verificationRecord.exitCode
            : typeof verificationRecord.exit_code === 'number'
              ? verificationRecord.exit_code
              : 1,
        }
      : null,
  };
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

export async function submitTask(input: SubmitTaskInput): Promise<DispatchJob> {
  const response = await fetch(DISPATCH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(`dispatch submit ${response.status}`);
  const payload = await response.json();
  return {
    id: normalizeJobId(payload),
    status: (payload?.status === 'queued' || payload?.status === 'running' || payload?.status === 'done' || payload?.status === 'failed') ? payload.status : 'queued',
    repo: input.repo,
    command: input.command,
    prompt: input.prompt,
  };
}

export async function createWorkflowRun(input: CreateWorkflowRunInput): Promise<DispatchJob & { workflowId: Workflow['id']; workItemId: Workflow['workItemId'] }> {
  const job = await submitTask(input);
  return { ...job, workflowId: input.workflowId, workItemId: input.workItemId };
}

export async function pollTask(id: string): Promise<DispatchPollResult> {
  const response = await fetch(`${DISPATCH_URL}/poll/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error(`dispatch poll ${response.status}`);
  return normalizePollResult(await response.json());
}

export async function cancelTask(job: DispatchJob): Promise<DispatchPollResult> {
  return {
    status: 'cancelled',
    output: `\n[CANCELLED] local cancellation requested for ${job.id}`,
    exitCode: null,
    surface: null,
    model: null,
    latencyMs: null,
  };
}
