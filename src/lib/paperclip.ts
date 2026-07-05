/**
 * Paperclip client — persistent backend for FORGE Command Center.
 *
 * Talks to the Paperclip Aggregator Layer via /forge/* route namespace.
 * All endpoints return FORGE-shaped JSON (OverviewState, TeamState, etc.)
 * rather than raw Paperclip models.
 */

const PAPERCLIP_API_URL =
  import.meta.env.VITE_PAPERCLIP_API_URL ?? 'http://localhost:3100';

const COMPANY_ID =
  (import.meta.env.VITE_PAPERCLIP_COMPANY_ID as string) ?? '';

interface PaperclipRequestOptions {
  signal?: AbortSignal;
}

async function paperclipFetch<T>(
  path: string,
  options?: PaperclipRequestOptions,
): Promise<T> {
  const url = `${PAPERCLIP_API_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(COMPANY_ID ? { 'x-paperclip-company': COMPANY_ID } : {}),
    },
    signal: options?.signal,
  });

  if (!res.ok) {
    throw new Error(`Paperclip ${path} responded ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const paperclip = {
  getOverviewState: <T>(opts?: PaperclipRequestOptions) =>
    paperclipFetch<T>('/forge/overview-state', opts),

  getTeamState: <T>(opts?: PaperclipRequestOptions) =>
    paperclipFetch<T>('/forge/team-state', opts),

  getTaskState: <T>(opts?: PaperclipRequestOptions) =>
    paperclipFetch<T>('/forge/task-state', opts),

  getBudgetState: <T>(opts?: PaperclipRequestOptions) =>
    paperclipFetch<T>('/forge/budget-state', opts),

  getAuditLog: <T>(opts?: PaperclipRequestOptions) =>
    paperclipFetch<T>('/forge/audit-log', opts),

  postHeartbeat: async (agentId: string, payload: Record<string, unknown>) => {
    const url = `${PAPERCLIP_API_URL}/forge/agent/${agentId}/heartbeat`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(COMPANY_ID ? { 'x-paperclip-company': COMPANY_ID } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Heartbeat POST failed: ${res.status}`);
    return res.json();
  },
} as const;
