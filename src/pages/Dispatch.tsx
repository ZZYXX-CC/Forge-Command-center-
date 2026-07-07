import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ForgeIcon } from '@/src/components/primitives/ForgeIcon';
import { cn } from '@/src/lib/utils';
import {
  DISPATCH_URL,
  ConsideredSurface,
  DispatchDecision,
  DispatchRegistryModel,
  DispatchSurfaceStatus,
  DispatchVerificationJob,
  fetchDispatchDecisions,
  fetchDispatchRegistryStatus,
  fetchDispatchSurfaces,
  fetchDispatchVerificationJobs,
  runDispatchDryRun,
} from '@/src/lib/dispatchClient';
import { isConvexConfigured } from '@/src/lib/convex';
import { syncDispatchModelStatus } from '@/src/lib/useConvex';

const COMMAND_CENTER_PUBLIC_URL = 'http://command-center.nuvuestudio.net/';

const dryRunPresets = {
  routine: {
    label: 'Routine code',
    prompt: 'Dry run: choose a route for a routine implementation task. Do not execute.',
    routingIntent: { task_type: 'implementation', domain: 'code', verification_policy: 'time_bounded' },
  },
  planning: {
    label: 'Planning recovery',
    prompt: 'Dry run: choose a route for a high-stakes architecture recovery plan. Do not execute.',
    routingIntent: { task_type: 'planning', domain: 'planning', sensitivity: 'high', verification_policy: 'required' },
  },
  ui: {
    label: 'UI/design',
    prompt: 'Dry run: choose a route for a UI implementation and design-compliance task. Do not execute.',
    routingIntent: { task_type: 'implementation', domain: 'ui_design', authority_agent: 'vael', verification_policy: 'required' },
  },
} as const;

type DryRunPreset = keyof typeof dryRunPresets;

const statusTone = (s: string) =>
  s === 'executed'
    ? 'text-status-healthy'
    : s?.startsWith('exec_error') || s === 'no_available_surface'
      ? 'text-status-incident'
      : s === 'low_confidence_defer_sage'
        ? 'text-status-degraded'
        : 'text-text-muted';

const viaTone = (v: string | null) =>
  v === 'executor'
    ? 'bg-accent-primary/15 text-accent-primary'
    : v === 'litellm'
      ? 'bg-surface-overlay text-text-secondary'
      : 'bg-surface-overlay text-text-muted';

// Human-readable meaning of the availability state of a considered surface.
const availState = (c: ConsideredSurface): { label: string; tone: string } => {
  if (c.gated_out) return { label: 'skipped: hard-only', tone: 'text-text-muted' };
  if (c.available === true) return { label: 'available', tone: 'text-status-healthy' };
  if (c.available === false) return { label: c.routable ? 'down' : 'not wired', tone: 'text-status-incident' };
  return { label: 'cli-pending', tone: 'text-status-degraded' };
};

export const Dispatch: React.FC = () => {
  const [open, setOpen] = useState<number | null>(null);
  const [dryRunPreset, setDryRunPreset] = useState<DryRunPreset>('routine');
  const [dryRunPrompt, setDryRunPrompt] = useState(dryRunPresets.routine.prompt);
  const [dryRunResult, setDryRunResult] = useState<Awaited<ReturnType<typeof runDispatchDryRun>> | null>(null);
  const [dryRunError, setDryRunError] = useState<string | null>(null);
  const [isDryRunning, setIsDryRunning] = useState(false);
  const { data, isLoading, error } = useQuery<{ decisions: DispatchDecision[] }>({
    queryKey: ['dispatch-decisions'],
    queryFn: fetchDispatchDecisions,
    refetchInterval: 10_000,
  });
  const { data: surfacesData } = useQuery<{ surfaces: DispatchSurfaceStatus[] }>({
    queryKey: ['dispatch-surfaces'],
    queryFn: fetchDispatchSurfaces,
    refetchInterval: 10_000,
  });
  const { data: registryData } = useQuery<{ models: DispatchRegistryModel[] }>({
    queryKey: ['dispatch-registry-status'],
    queryFn: fetchDispatchRegistryStatus,
    refetchInterval: 15_000,
  });
  const { data: verificationJobsData } = useQuery<{ jobs: DispatchVerificationJob[] }>({
    queryKey: ['dispatch-verification-jobs'],
    queryFn: fetchDispatchVerificationJobs,
    refetchInterval: 15_000,
  });

  const decisions = data?.decisions ?? [];
  const surfaces = surfacesData?.surfaces ?? [];
  const models = registryData?.models ?? [];
  const verificationJobs = verificationJobsData?.jobs ?? [];
  useEffect(() => {
    if (!isConvexConfigured() || models.length === 0) return;
    void syncDispatchModelStatus(models).catch(() => {
      // Keep DISPATCH visible even if Convex ingestion is temporarily unavailable.
    });
  }, [models]);
  const byTier = decisions.reduce<Record<string, number>>((a, d) => {
    a[d.category] = (a[d.category] || 0) + 1;
    return a;
  }, {});
  const byVia = decisions.reduce<Record<string, number>>((a, d) => {
    const k = d.via || 'none';
    a[k] = (a[k] || 0) + 1;
    return a;
  }, {});
  const dryRunDispatch = dryRunResult?.x_dispatch;

  const selectDryRunPreset = (preset: DryRunPreset) => {
    setDryRunPreset(preset);
    setDryRunPrompt(dryRunPresets[preset].prompt);
  };

  const handleDryRun = async () => {
    setIsDryRunning(true);
    setDryRunError(null);
    try {
      const result = await runDispatchDryRun({
        prompt: dryRunPrompt,
        routingIntent: dryRunPresets[dryRunPreset].routingIntent,
      });
      setDryRunResult(result);
    } catch (err) {
      setDryRunError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsDryRunning(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col min-h-0 bg-surface-base overflow-hidden font-ui">
      {/* header */}
      <div className="px-6 py-4 border-b border-surface-border flex items-center gap-3 flex-wrap">
        <ForgeIcon name="routing-2" size="md" className="text-accent-primary" />
        <div>
          <h1 className="text-heading-md font-bold text-text-primary">DISPATCH</h1>
          <p className="text-[11px] text-text-muted uppercase tracking-widest">Routing decisions</p>
        </div>
        <div className="ml-auto flex items-center gap-3 text-[11px]">
          {Object.entries(byTier).map(([t, n]) => (
            <span key={t} className="text-text-secondary">
              {t}: <b className="text-text-primary">{n}</b>
            </span>
          ))}
          {Object.keys(byTier).length > 0 && <span className="text-text-muted">|</span>}
          {Object.entries(byVia).map(([v, n]) => (
            <span key={v} className={cn('px-2 py-0.5 rounded', viaTone(v === 'none' ? null : v))}>
              {v}: {n}
            </span>
          ))}
          <a className="rounded bg-surface-overlay px-2 py-1 text-accent-primary" href={COMMAND_CENTER_PUBLIC_URL}>
            public tunnel
          </a>
        </div>
      </div>

      {/* explainer */}
      <div className="px-6 py-3 border-b border-surface-border bg-surface-raised/20">
        <p className="text-[12px] text-text-secondary leading-relaxed max-w-4xl">
          Every task is <b className="text-text-primary">classified</b> into a tier (planning / execution / vision),
          then DISPATCH walks that tier's ranked list of tools and picks the <b className="text-text-primary">first available</b> one.
          <span className="ml-1">
            <span className={cn('px-1.5 py-0.5 rounded text-[10px]', viaTone('executor'))}>executor</span> = your subscription CLIs (Claude Code / Codex / Cursor).
            <span className={cn('px-1.5 py-0.5 rounded text-[10px] ml-1', viaTone('litellm'))}>litellm</span> = free local (Ollama) or free API (NIM / OpenRouter).
          </span>
          <span className="block mt-1 text-text-muted">
            Click any row to see the exact task and the full chain it considered, including what was skipped and why.
          </span>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {surfaces.length === 0 && (
            <span className="text-[11px] text-text-muted">Surface status unavailable.</span>
          )}
          {surfaces.map((s) => (
            <span
              key={s.surface}
              title={`${s.kind ?? 'surface'}${s.billing ? ` · ${s.billing}` : ''}${s.detail ? ` · ${s.detail}` : ''}`}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-mono',
                s.available
                  ? 'border-status-healthy/30 bg-status-healthy/10 text-status-healthy'
                  : 'border-status-incident/30 bg-status-incident/10 text-status-incident'
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', s.available ? 'bg-status-healthy' : 'bg-status-incident')} />
              {s.surface}
              {s.via && <span className="text-text-muted">/{s.via}</span>}
            </span>
          ))}
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {models.slice(0, 12).map((m) => {
            const up = m.runtime?.available;
            return (
              <div key={m.id} className="rounded border border-surface-border bg-surface-base/70 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[12px] font-bold text-text-primary">{m.model}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-text-muted">{m.surface} · {m.tier}</div>
                  </div>
                  <span className={cn(
                    'rounded px-1.5 py-0.5 text-[10px] font-mono',
                    up ? 'bg-status-healthy/10 text-status-healthy' : 'bg-status-incident/10 text-status-incident'
                  )}>
                    {up ? 'up' : 'down'}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(m.authority_roles ?? []).slice(0, 2).map((role) => (
                    <span key={role} className="rounded bg-surface-overlay px-1.5 py-0.5 text-[10px] text-text-secondary">{role}</span>
                  ))}
                  {m.trust_level && <span className="rounded bg-accent-primary/10 px-1.5 py-0.5 text-[10px] text-accent-primary">{m.trust_level}</span>}
                </div>
                <div className="mt-2 text-[10px] text-text-muted">
                  circuit: <span className="text-text-secondary">{m.runtime?.circuit_state ?? 'closed'}</span>
                  <span className="mx-1">·</span>
                  quota: <span className="text-text-secondary">{m.runtime?.quota_remaining ?? 'n/a'}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 rounded border border-surface-border bg-surface-base/70 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Verifier queue</div>
            <div className="text-[10px] text-text-muted">{verificationJobs.length} recent</div>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {verificationJobs.slice(0, 6).map((job) => (
              <div key={job.id} className="rounded bg-surface-overlay/60 px-2 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-text-muted">#{job.routing_decision_id ?? job.id}</span>
                  <span className={cn(
                    'rounded px-1.5 py-0.5 text-[10px] font-mono',
                    job.status === 'passed'
                      ? 'bg-status-healthy/10 text-status-healthy'
                      : job.status === 'queued' || job.status === 'running'
                        ? 'bg-accent-primary/10 text-accent-primary'
                        : 'bg-status-incident/10 text-status-incident'
                  )}>
                    {job.status}
                  </span>
                </div>
                <div className="mt-1 truncate text-[11px] text-text-secondary">{job.task ?? 'verification job'}</div>
              </div>
            ))}
            {verificationJobs.length === 0 && (
              <div className="text-[11px] text-text-muted">No async verifier jobs yet.</div>
            )}
          </div>
        </div>
        <div className="mt-4 rounded border border-surface-border bg-surface-base/70 p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Route self-test</div>
              <div className="mt-1 text-[11px] text-text-secondary">Runs DISPATCH with dry_run=true, so no model execution or verifier job is queued.</div>
            </div>
            <button
              type="button"
              onClick={handleDryRun}
              disabled={isDryRunning}
              className={cn(
                'inline-flex items-center gap-2 rounded border px-3 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors',
                isDryRunning
                  ? 'border-surface-border bg-surface-overlay text-text-muted'
                  : 'border-accent-primary/40 bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/15'
              )}
            >
              <ForgeIcon name="play" size="xs" />
              {isDryRunning ? 'Testing' : 'Run dry test'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(dryRunPresets) as DryRunPreset[]).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => selectDryRunPreset(preset)}
                className={cn(
                  'rounded border px-2 py-1 text-[11px]',
                  dryRunPreset === preset
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                    : 'border-surface-border bg-surface-overlay text-text-secondary hover:text-text-primary'
                )}
              >
                {dryRunPresets[preset].label}
              </button>
            ))}
          </div>
          <textarea
            value={dryRunPrompt}
            onChange={(event) => setDryRunPrompt(event.target.value)}
            rows={2}
            className="mt-3 w-full resize-none rounded border border-surface-border bg-surface-base px-3 py-2 text-[12px] text-text-primary outline-none focus:border-accent-primary"
          />
          {dryRunError && (
            <div className="mt-3 rounded bg-status-incident/10 px-3 py-2 text-[11px] text-status-incident">{dryRunError}</div>
          )}
          {dryRunDispatch && (
            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <div className="rounded bg-surface-overlay/60 p-3">
                <div className="text-[10px] uppercase tracking-widest text-text-muted">Selected route</div>
                <div className="mt-2 text-[13px] font-bold text-text-primary">
                  {dryRunDispatch.chosen_surface ?? 'none'} <span className="text-text-muted">/</span> {dryRunDispatch.chosen_model ?? 'none'}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                  <span className={cn('rounded px-1.5 py-0.5', viaTone(dryRunDispatch.via ?? null))}>{dryRunDispatch.via ?? 'none'}</span>
                  <span className="rounded bg-surface-base px-1.5 py-0.5 text-text-secondary">{dryRunDispatch.tier ?? dryRunDispatch.category}</span>
                  <span className="rounded bg-surface-base px-1.5 py-0.5 text-status-healthy">{dryRunDispatch.status}</span>
                </div>
              </div>
              <div className="rounded bg-surface-overlay/60 p-3">
                <div className="text-[10px] uppercase tracking-widest text-text-muted">Why</div>
                <div className="mt-2 grid gap-1">
                  {(dryRunDispatch.why_log ?? []).slice(0, 5).map((line, idx) => (
                    <div key={idx} className="rounded bg-surface-base px-2 py-1 text-[11px] text-text-secondary">{line}</div>
                  ))}
                  {(dryRunDispatch.why_log ?? []).length === 0 && (
                    <div className="text-[11px] text-text-muted">No why log returned.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* body */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading && <div className="text-text-muted text-body-md">Loading routing log…</div>}
        {error && (
          <div className="max-w-xl p-4 bg-surface-raised border border-status-incident/40 rounded-lg text-body-md text-text-secondary">
            Can't reach DISPATCH at <span className="font-mono text-text-primary">{DISPATCH_URL}</span>.
            Confirm <span className="font-mono">dispatch-service</span> on :4001 is up and reachable from this
            browser (same LAN or Tailscale).
          </div>
        )}
        {!isLoading && !error && decisions.length === 0 && (
          <div className="text-text-muted">No routing decisions logged yet.</div>
        )}
        {decisions.length > 0 && (
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-text-muted border-b border-surface-border">
                <th className="text-left py-2 font-bold w-6"></th>
                <th className="text-left py-2 font-bold">Time</th>
                <th className="text-left font-bold">Task</th>
                <th className="text-left font-bold">Tier</th>
                <th className="text-left font-bold">Chosen</th>
                <th className="text-left font-bold">Via</th>
                <th className="text-left font-bold">Served by</th>
                <th className="text-right font-bold">Latency</th>
                <th className="text-left font-bold pl-4">Status</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {decisions.map((d, i) => {
                let chain: ConsideredSurface[] = [];
                try { chain = d.considered ? JSON.parse(d.considered) : []; } catch { /* ignore */ }
                let whyLog: string[] = [];
                let rejections: Array<{ surface?: string; model?: string; reason?: string }> = [];
                try { whyLog = d.why_log ? JSON.parse(d.why_log) : []; } catch { /* ignore */ }
                try { rejections = d.rejections ? JSON.parse(d.rejections) : []; } catch { /* ignore */ }
                const isOpen = open === i;
                return (
                  <React.Fragment key={i}>
                    <tr
                      className="border-b border-surface-border/50 hover:bg-surface-hover cursor-pointer"
                      onClick={() => setOpen(isOpen ? null : i)}
                    >
                      <td className="py-2 text-text-muted">
                        <ForgeIcon name={isOpen ? 'alt-arrow-down' : 'alt-arrow-right'} size="xs" />
                      </td>
                      <td className="py-2 text-text-muted whitespace-nowrap">
                        {d.ts?.replace('T', ' ').slice(5, 19)}
                      </td>
                      <td className="text-text-secondary max-w-[280px] truncate">{d.task || '—'}</td>
                      <td className="text-text-secondary">
                        {d.category} <span className="text-text-muted">/ {d.complexity}</span>
                      </td>
                      <td className="text-text-primary">{d.chosen_surface ?? '—'}</td>
                      <td>
                        <span className={cn('px-2 py-0.5 rounded text-[10px]', viaTone(d.via))}>
                          {d.via ?? '—'}
                        </span>
                      </td>
                      <td className="text-text-secondary">{d.served_by ?? '—'}</td>
                      <td className="text-right text-text-muted whitespace-nowrap">
                        {d.latency_ms ? `${d.latency_ms}ms` : '—'}
                      </td>
                      <td className={cn('pl-4', statusTone(d.status))}>{d.status}</td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-surface-raised/30 border-b border-surface-border/50">
                        <td></td>
                        <td colSpan={8} className="py-3 pr-6">
                          <div className="text-[11px] text-text-muted uppercase tracking-widest mb-1">Task</div>
                          <div className="text-[12px] text-text-primary whitespace-pre-wrap mb-3 max-w-4xl">
                            {d.task || '(none recorded)'}
                          </div>
                          <div className="text-[11px] text-text-muted uppercase tracking-widest mb-1">
                            Considered chain ({d.category})
                          </div>
                          <div className="space-y-1">
                            {chain.map((c, j) => {
                              const st = availState(c);
                              const chosen = c.surface === d.chosen_surface;
                              return (
                                <div
                                  key={j}
                                  className={cn(
                                    'flex items-center gap-3 text-[11px] px-2 py-1 rounded',
                                    chosen ? 'bg-accent-primary/10' : ''
                                  )}
                                >
                                  <span className="w-5 text-text-muted">{j + 1}.</span>
                                  <span className="w-32 text-text-primary">{c.surface}</span>
                                  <span className="w-56 text-text-muted truncate">{c.model ?? ''}</span>
                                  {c.via && (
                                    <span className={cn('px-1.5 py-0.5 rounded text-[10px]', viaTone(c.via))}>
                                      {c.via}
                                    </span>
                                  )}
                                  <span className={cn('ml-auto', st.tone)}>{st.label}</span>
                                  {c.rejection_reason && (
                                    <span className="text-text-muted">{c.rejection_reason}</span>
                                  )}
                                  {chosen && (
                                    <span className="text-accent-primary font-bold">← chosen</span>
                                  )}
                                </div>
                              );
                            })}
                            {chain.length === 0 && (
                              <div className="text-text-muted text-[11px]">No chain recorded.</div>
                            )}
                          </div>
                          <div className="mt-4 grid gap-3 lg:grid-cols-2">
                            <div>
                              <div className="text-[11px] text-text-muted uppercase tracking-widest mb-1">Why log</div>
                              <div className="space-y-1">
                                {whyLog.map((line, idx) => (
                                  <div key={idx} className="rounded bg-surface-base/70 px-2 py-1 text-[11px] text-text-secondary">{line}</div>
                                ))}
                                {whyLog.length === 0 && <div className="text-text-muted text-[11px]">No why log recorded.</div>}
                              </div>
                            </div>
                            <div>
                              <div className="text-[11px] text-text-muted uppercase tracking-widest mb-1">Rejections</div>
                              <div className="space-y-1">
                                {rejections.map((r, idx) => (
                                  <div key={idx} className="rounded bg-surface-base/70 px-2 py-1 text-[11px] text-text-secondary">
                                    <span className="text-text-primary">{r.surface ?? 'surface'}</span> skipped: {r.reason ?? 'policy'}
                                  </div>
                                ))}
                                {rejections.length === 0 && <div className="text-text-muted text-[11px]">No explicit rejections recorded.</div>}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
};
