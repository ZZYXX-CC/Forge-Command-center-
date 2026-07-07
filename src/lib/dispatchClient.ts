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
  capabilities?: string[];
  authority_roles?: string[];
  trust_level?: string;
  quota_remaining?: number | null;
  circuit_state?: string;
  rejection_reason?: string | null;
}

export interface DispatchDecision {
  sourceId?: string;
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
  why_log?: string;
  rejections?: string;
  classification_json?: string;
  quota_snapshot?: string;
  circuit_snapshot?: string;
  verification_json?: string;
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

export interface DispatchModelRuntime {
  health: string;
  available: boolean;
  via?: string | null;
  detail?: string | null;
  quota_used?: number | null;
  quota_remaining?: number | null;
  circuit_state: string;
  last_success?: number | null;
  last_failure?: number | null;
  last_error?: string | null;
}

export interface DispatchRegistryModel {
  id: string;
  provider: string;
  surface: string;
  model: string;
  capabilities: string[];
  authority_roles: string[];
  allowed_domains?: string[];
  tier: string;
  trust_level?: string;
  quota?: Record<string, unknown>;
  cost?: Record<string, unknown>;
  runtime?: DispatchModelRuntime;
}

export interface DispatchVerificationJob {
  id: number;
  routing_decision_id?: number | null;
  ts?: string;
  updated_ts?: string;
  status: string;
  task?: string;
  attempts_json?: string | null;
  result_json?: string | null;
  error?: string | null;
}

export interface DispatchDryRunResult {
  id?: string;
  model?: string;
  choices?: Array<{ message?: { content?: string } }>;
  x_dispatch?: {
    tier?: string;
    category?: string;
    status?: string;
    chosen_surface?: string | null;
    chosen_model?: string | null;
    via?: string | null;
    why_log?: string[];
    rejections?: Array<{ surface?: string; model?: string; reason?: string }>;
    considered?: ConsideredSurface[];
    classification?: Record<string, unknown>;
  };
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
  routingIntent?: Record<string, unknown>;
  dryRun?: boolean;
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

const completedRuns = new Map<string, DispatchPollResult>();

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
    dispatch: typeof record.dispatch === 'object' && record.dispatch ? record.dispatch as Record<string, unknown> : null,
  };
}

function normalizeChatCompletion(input: SubmitTaskInput, payload: unknown): DispatchPollResult {
  const record = payload && typeof payload === 'object' ? payload as Record<string, any> : {};
  const choice = Array.isArray(record.choices) ? record.choices[0] : null;
  const content = choice?.message?.content;
  const dispatch = record.x_dispatch && typeof record.x_dispatch === 'object' ? record.x_dispatch : {};
  const status = typeof dispatch.status === 'string' ? dispatch.status : 'done';
  const failed = status.includes('no_available_surface') || status.startsWith('exec_error');
  return {
    status: failed ? 'failed' : 'done',
    output: typeof content === 'string' ? content : JSON.stringify(payload, null, 2),
    error: failed ? status : undefined,
    exitCode: failed ? 1 : 0,
    surface: typeof dispatch.chosen_surface === 'string' ? dispatch.chosen_surface : null,
    model: typeof dispatch.chosen_model === 'string' ? dispatch.chosen_model : typeof record.model === 'string' ? record.model : null,
    latencyMs: typeof dispatch.latency_ms === 'number' ? dispatch.latency_ms : null,
    verification: {
      lint: !failed,
      build: !failed,
      exitCode: failed ? 1 : 0,
    },
    dispatch,
  };
}

function buildChatRequest(input: SubmitTaskInput) {
  const messages = [
    {
      role: 'user',
      content: input.prompt,
    },
  ];
  const body: Record<string, unknown> = {
    model: 'dispatch-auto',
    messages,
    max_tokens: 2048,
  };
  if (input.repo) body.repo = input.repo;
  if (input.dryRun) body.dry_run = true;
  if (input.routingIntent) body.routing_intent = input.routingIntent;
  if (input.workflowId || input.workItemId || input.trigger || input.command) {
    body.metadata = {
      ...(input.routingIntent ?? {}),
      workflowId: input.workflowId,
      workItemId: input.workItemId,
      trigger: input.trigger,
      command: input.command,
    };
  }
  return body;
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

export async function fetchDispatchRegistry(): Promise<{ models: DispatchRegistryModel[] }> {
  const response = await fetch(`${DISPATCH_URL}/registry`);
  if (!response.ok) throw new Error(`dispatch registry ${response.status}`);
  return response.json();
}

export async function fetchDispatchRegistryStatus(): Promise<{ models: DispatchRegistryModel[] }> {
  const response = await fetch(`${DISPATCH_URL}/registry/status`);
  if (!response.ok) throw new Error(`dispatch registry status ${response.status}`);
  return response.json();
}

export async function fetchDispatchVerificationJobs(): Promise<{ jobs: DispatchVerificationJob[] }> {
  const response = await fetch(`${DISPATCH_URL}/verification/jobs`);
  if (!response.ok) throw new Error(`dispatch verification jobs ${response.status}`);
  return response.json();
}

export async function fetchDispatchDecisions(): Promise<{ decisions: DispatchDecision[] }> {
  const response = await fetch(`${DISPATCH_URL}/decisions`);
  if (!response.ok) throw new Error(`dispatch ${response.status}`);
  return response.json();
}

export async function runDispatchDryRun(input: {
  prompt: string;
  routingIntent?: Record<string, unknown>;
}): Promise<DispatchDryRunResult> {
  const response = await fetch(`${DISPATCH_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'dispatch-auto',
      messages: [{ role: 'user', content: input.prompt }],
      dry_run: true,
      routing_intent: input.routingIntent,
    }),
  });
  if (!response.ok) throw new Error(`dispatch dry-run ${response.status}`);
  return response.json();
}

export async function submitTask(input: SubmitTaskInput): Promise<DispatchJob> {
  const jobId = `dispatch-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const response = await fetch(`${DISPATCH_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildChatRequest(input)),
  });
  if (!response.ok) throw new Error(`dispatch submit ${response.status}`);
  const payload = await response.json();
  completedRuns.set(jobId, normalizeChatCompletion(input, payload));
  return {
    id: jobId,
    status: completedRuns.get(jobId)?.status ?? 'done',
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
  const completed = completedRuns.get(id);
  if (completed) return completed;
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
