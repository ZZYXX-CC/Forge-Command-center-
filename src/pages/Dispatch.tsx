import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ForgeIcon } from '@/src/components/primitives/ForgeIcon';
import { cn } from '@/src/lib/utils';

// DISPATCH router service (LXC 101 on the homelab). Override with VITE_DISPATCH_URL.
const DISPATCH_URL =
  (import.meta as any).env?.VITE_DISPATCH_URL || 'http://192.168.1.178:4001';

interface Considered {
  model: string | null;
  surface: string;
  billing?: string;
  via: string | null;
  routable: boolean;
  available: boolean | null;
  gated_out: boolean;
}

interface Decision {
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
  considered?: string; // JSON string of Considered[]
}

interface SurfaceStatus {
  surface: string;
  kind?: string;
  host?: string;
  billing?: string | null;
  via: string | null;
  available: boolean;
  detail?: string | null;
}

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
const availState = (c: Considered): { label: string; tone: string } => {
  if (c.gated_out) return { label: 'skipped: hard-only', tone: 'text-text-muted' };
  if (c.available === true) return { label: 'available', tone: 'text-status-healthy' };
  if (c.available === false) return { label: c.routable ? 'down' : 'not wired', tone: 'text-status-incident' };
  return { label: 'cli-pending', tone: 'text-status-degraded' };
};

export const Dispatch: React.FC = () => {
  const [open, setOpen] = useState<number | null>(null);
  const { data, isLoading, error } = useQuery<{ decisions: Decision[] }>({
    queryKey: ['dispatch-decisions'],
    queryFn: async () => {
      const r = await fetch(`${DISPATCH_URL}/decisions`);
      if (!r.ok) throw new Error(`dispatch ${r.status}`);
      return r.json();
    },
    refetchInterval: 10_000,
  });
  const { data: surfacesData } = useQuery<{ surfaces: SurfaceStatus[] }>({
    queryKey: ['dispatch-surfaces'],
    queryFn: async () => {
      const r = await fetch(`${DISPATCH_URL}/surfaces`);
      if (!r.ok) throw new Error(`dispatch surfaces ${r.status}`);
      return r.json();
    },
    refetchInterval: 10_000,
  });

  const decisions = data?.decisions ?? [];
  const surfaces = surfacesData?.surfaces ?? [];
  const byTier = decisions.reduce<Record<string, number>>((a, d) => {
    a[d.category] = (a[d.category] || 0) + 1;
    return a;
  }, {});
  const byVia = decisions.reduce<Record<string, number>>((a, d) => {
    const k = d.via || 'none';
    a[k] = (a[k] || 0) + 1;
    return a;
  }, {});

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
                let chain: Considered[] = [];
                try { chain = d.considered ? JSON.parse(d.considered) : []; } catch { /* ignore */ }
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
