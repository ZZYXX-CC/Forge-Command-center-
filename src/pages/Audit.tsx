import React, { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Activity, AlertTriangle, CheckCircle2, FileText, GitBranch, PlayCircle, Search, XCircle } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useExecutorRuns, useRoutingDecisions, useWorkEvents } from '@/src/lib/useConvex';
import type { OverviewState } from '../types';
import type { ExecutorRun, RoutingDecision, WorkRegistryEvent } from '@/src/lib/workRegistry';
import { LogEntry, LogViewer } from '@/src/components/ui/LogViewer';

interface AuditProps {
  data: OverviewState;
}

type EventLevel = LogEntry['level'];

const eventLevel = (event: WorkRegistryEvent): EventLevel => {
  const text = `${event.type ?? ''} ${event.message ?? ''}`.toLowerCase();
  if (text.includes('failed') || text.includes('blocked') || text.includes('error') || text.includes('timeout')) return 'error';
  if (text.includes('cancelled') || text.includes('requeued') || text.includes('review')) return 'warn';
  if (text.includes('completed') || text.includes('passed') || text.includes('done')) return 'success';
  if (text.includes('started') || text.includes('created') || text.includes('queued')) return 'info';
  return 'debug';
};

const sourceFor = (event: WorkRegistryEvent): string => {
  const actor = event.actor || 'SYSTEM';
  if (actor.toUpperCase() === 'SAGE') return 'SAGE';
  if ((event.type ?? '').startsWith('sage_')) return 'SAGE';
  if ((event.type ?? '').includes('dispatch')) return 'DISPATCH';
  if ((event.type ?? '').includes('workflow')) return 'WORKFLOW';
  return actor.toUpperCase().slice(0, 14);
};

const toEventTime = (event: WorkRegistryEvent): number => {
  const value = Number(event.occurredAt);
  return Number.isFinite(value) && value > 0 ? value : 0;
};

const formatEventTime = (event: WorkRegistryEvent): string => {
  const timestamp = toEventTime(event);
  if (!timestamp) return 'unknown';
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const formatRelativeEventTime = (event: WorkRegistryEvent): string => {
  const timestamp = toEventTime(event);
  if (!timestamp) return 'unknown';
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
};

const toLogEntry = (event: WorkRegistryEvent): LogEntry => ({
  id: event._id || `${event.workId ?? 'event'}-${toEventTime(event)}-${event.type ?? 'unknown'}`,
  timestamp: formatEventTime(event),
  level: eventLevel(event),
  source: sourceFor(event),
  message: `${event.workId ?? 'unknown-work'} | ${event.type ?? 'unknown'} | ${event.message ?? 'No message recorded.'}`,
});

const parseMetadata = (value?: string): Record<string, unknown> | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const formatMetadataPreview = (metadata: Record<string, unknown>, maxLength = 2400): string => {
  const rendered = JSON.stringify(metadata, null, 2);
  if (rendered.length <= maxLength) return rendered;
  return `${rendered.slice(0, maxLength)}\n... truncated ${rendered.length - maxLength} chars`;
};

const toRunTime = (run: ExecutorRun): number => {
  const value = Number(run.startedAt);
  return Number.isFinite(value) && value > 0 ? value : 0;
};

const toDecisionTime = (decision: RoutingDecision): number => {
  const value = Number(decision.decidedAt);
  return Number.isFinite(value) && value > 0 ? value : 0;
};

const compactPreview = (value?: string, maxLength = 140): string => {
  if (!value) return '';
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}...`;
};

const runLevel = (run: ExecutorRun): EventLevel => {
  const status = (run.status ?? '').toLowerCase();
  if (status.includes('error') || status.includes('fail') || status.includes('timeout')) return 'error';
  if (status.includes('running') || status.includes('progress')) return 'info';
  if (status.includes('ok') || status.includes('done') || status.includes('success')) return 'success';
  return 'debug';
};

const decisionLevel = (decision: RoutingDecision): EventLevel => {
  const status = (decision.status ?? '').toLowerCase();
  if (status.includes('error') || status.includes('fail') || status.includes('timeout') || status.includes('no_available')) return 'error';
  if (status.includes('pending') || status.includes('would')) return 'info';
  if (status.includes('ok') || status.includes('executed')) return 'success';
  return 'debug';
};

export const Audit: React.FC<AuditProps> = ({ data }) => {
  void data;
  const [query, setQuery] = useState('');
  const [streamClearedAt, setStreamClearedAt] = useState<number | null>(null);
  const events = useWorkEvents(250);
  const executorRuns = useExecutorRuns(30);
  const routingDecisions = useRoutingDecisions(30);

  const filteredEvents = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return events;
    return events.filter((event) => {
      const metadata = event.metadata ?? '';
      return [event.workId, event.type, event.actor, event.message, metadata]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [events, query]);

  const streamEvents = useMemo(
    () => filteredEvents.filter((event) => !streamClearedAt || toEventTime(event) > streamClearedAt),
    [filteredEvents, streamClearedAt],
  );
  const logEntries = useMemo(() => streamEvents.slice().reverse().map(toLogEntry), [streamEvents]);
  const failures = events.filter((event) => eventLevel(event) === 'error').length;
  const warnings = events.filter((event) => eventLevel(event) === 'warn').length;
  const successes = events.filter((event) => eventLevel(event) === 'success').length;
  const latest = events[0];
  const visibleRuns = useMemo(() => executorRuns.slice(0, 12), [executorRuns]);
  const visibleDecisions = useMemo(() => routingDecisions.slice(0, 12), [routingDecisions]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-base overflow-y-auto">
      <header className="px-6 py-4 border-b border-surface-border bg-surface-raised/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <h1 className="text-heading-lg text-text-primary font-bold tracking-tighter uppercase">Audit / Logs</h1>
            <span className="text-[10px] font-mono text-text-muted">/audit - live Convex work events, failures, routing, verification, and recovery</span>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-base border border-surface-border rounded text-[10px] font-bold uppercase text-text-primary placeholder:text-text-muted outline-none focus:border-emerald-accent transition-colors"
              placeholder="Search work id, actor, error..."
            />
          </div>
        </div>
      </header>

      <div className="max-w-[1500px] w-full mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {[
            { label: 'Live Events', value: events.length, tone: 'healthy', icon: Activity },
            { label: 'Failures', value: failures, tone: failures ? 'incident' : 'healthy', icon: XCircle },
            { label: 'Warnings', value: warnings, tone: warnings ? 'degraded' : 'healthy', icon: AlertTriangle },
            { label: 'Completed', value: successes, tone: 'healthy', icon: CheckCircle2 },
            {
              label: 'Runs / Routes',
              value: `${executorRuns.length}/${routingDecisions.length}`,
              tone: 'neutral',
              icon: PlayCircle,
            },
          ].map((kpi) => (
            <div key={kpi.label} className="p-4 bg-surface-raised border border-surface-border rounded-lg">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{kpi.label}</span>
                <kpi.icon className={cn(
                  'w-4 h-4',
                  kpi.tone === 'incident' ? 'text-status-incident' :
                    kpi.tone === 'degraded' ? 'text-status-degraded' :
                      kpi.tone === 'healthy' ? 'text-status-healthy' : 'text-text-muted',
                )} />
              </div>
              <div className="text-heading-md font-mono text-text-primary mt-2">{kpi.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
          <section className="min-w-0 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-accent" />
              <h2 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Realtime System Event Stream</h2>
            </div>
            <LogViewer
              logs={logEntries}
              maxLogs={250}
              className="h-[640px]"
              title="Live Work Events"
              emptyText={streamClearedAt ? "Visible stream cleared. New events will appear here." : "No Convex work events yet."}
              enableCommands
              onClear={() => setStreamClearedAt(Date.now())}
            />
          </section>

          <aside className="space-y-4 min-w-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-emerald-accent" />
              <h2 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Recent Detail</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-surface-raised border border-surface-border rounded-lg">
                <div className="text-[9px] font-bold uppercase tracking-wider text-text-muted">Latest Event</div>
                <div className="text-label-sm font-mono text-text-primary mt-1">{latest ? formatRelativeEventTime(latest) : 'none'}</div>
              </div>
              <div className="p-3 bg-surface-raised border border-surface-border rounded-lg">
                <div className="text-[9px] font-bold uppercase tracking-wider text-text-muted">Latest Run</div>
                <div className="text-label-sm font-mono text-text-primary mt-1">{visibleRuns[0] ? formatDistanceToNow(new Date(toRunTime(visibleRuns[0])), { addSuffix: true }) : 'none'}</div>
              </div>
            </div>
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {filteredEvents.slice(0, 30).map((event) => {
                const level = eventLevel(event);
                const metadata = parseMetadata(event.metadata);
                return (
                  <div key={event._id || `${event.workId ?? 'event'}-${toEventTime(event)}-${event.type ?? 'unknown'}`} className="p-4 bg-surface-raised border border-surface-border rounded-lg space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{event.workId ?? 'unknown-work'}</div>
                        <div className="text-label-sm font-bold text-text-primary mt-1 break-words">{event.message ?? 'No message recorded.'}</div>
                      </div>
                      <span className={cn(
                        'px-2 py-1 rounded text-[9px] font-bold uppercase shrink-0',
                        level === 'error' ? 'bg-status-incident/10 text-status-incident' :
                          level === 'warn' ? 'bg-status-degraded/10 text-status-degraded' :
                            level === 'success' ? 'bg-status-healthy/10 text-status-healthy' :
                              'bg-surface-base text-text-muted',
                      )}>
                        {level}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[10px] font-mono text-text-muted">
                      <span>{event.actor ?? 'SYSTEM'}</span>
                      <span className="text-right">{formatRelativeEventTime(event)}</span>
                      <span className="col-span-2 text-emerald-accent">{event.type ?? 'unknown'}</span>
                    </div>
                    {metadata && (
                      <pre className="max-h-28 overflow-auto rounded bg-surface-base border border-surface-border p-2 text-[10px] text-text-secondary whitespace-pre-wrap">
                        {formatMetadataPreview(metadata)}
                      </pre>
                    )}
                  </div>
                );
              })}
              {filteredEvents.length === 0 && (
                <div className="p-6 bg-surface-raised border border-surface-border rounded-lg text-center text-text-muted text-label-sm">
                  No matching events.
                </div>
              )}
            </div>
          </aside>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="min-w-0 space-y-4">
            <div className="flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-emerald-accent" />
              <h2 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Recent Executor Runs</h2>
            </div>
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {visibleRuns.map((run) => {
                const level = runLevel(run);
                return (
                  <div key={run._id || run.runId} className="p-3 bg-surface-raised border border-surface-border rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted truncate">{run.workId ?? 'unlinked-run'}</div>
                        <div className="text-label-sm font-bold text-text-primary mt-1 truncate">{run.surface}{run.model ? ` / ${run.model}` : ''}</div>
                      </div>
                      <span className={cn(
                        'px-2 py-1 rounded text-[9px] font-bold uppercase shrink-0',
                        level === 'error' ? 'bg-status-incident/10 text-status-incident' :
                          level === 'success' ? 'bg-status-healthy/10 text-status-healthy' :
                            level === 'info' ? 'bg-status-info/10 text-status-info' : 'bg-surface-base text-text-muted',
                      )}>
                        {run.status}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-mono text-text-muted">
                      <span>{toRunTime(run) ? formatDistanceToNow(new Date(toRunTime(run)), { addSuffix: true }) : 'unknown'}</span>
                      <span className="text-right">{typeof run.latencyMs === 'number' ? `${run.latencyMs}ms` : run.completedAt ? 'complete' : 'open'}</span>
                    </div>
                    {(run.error || run.outputPreview || run.promptPreview) && (
                      <div className="mt-2 text-[10px] text-text-secondary break-words">
                        {compactPreview(run.error || run.outputPreview || run.promptPreview)}
                      </div>
                    )}
                  </div>
                );
              })}
              {visibleRuns.length === 0 && (
                <div className="p-6 bg-surface-raised border border-surface-border rounded-lg text-center text-text-muted text-label-sm">
                  No executor runs recorded yet.
                </div>
              )}
            </div>
          </section>

          <section className="min-w-0 space-y-4">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-emerald-accent" />
              <h2 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Recent Route Decisions</h2>
            </div>
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {visibleDecisions.map((decision) => {
                const level = decisionLevel(decision);
                const chosen = [decision.chosenSurface, decision.chosenModel].filter(Boolean).join(' / ') || 'no surface';
                return (
                  <div key={decision._id || decision.sourceId || `${decision.task}-${decision.decidedAt}`} className="p-3 bg-surface-raised border border-surface-border rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted truncate">{decision.workId ?? decision.sourceId ?? 'unlinked-route'}</div>
                        <div className="text-label-sm font-bold text-text-primary mt-1 truncate">{chosen}</div>
                      </div>
                      <span className={cn(
                        'px-2 py-1 rounded text-[9px] font-bold uppercase shrink-0',
                        level === 'error' ? 'bg-status-incident/10 text-status-incident' :
                          level === 'success' ? 'bg-status-healthy/10 text-status-healthy' :
                            level === 'info' ? 'bg-status-info/10 text-status-info' : 'bg-surface-base text-text-muted',
                      )}>
                        {decision.status}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-mono text-text-muted">
                      <span>{toDecisionTime(decision) ? formatDistanceToNow(new Date(toDecisionTime(decision)), { addSuffix: true }) : 'unknown'}</span>
                      <span className="text-right">{decision.category || 'uncategorized'}</span>
                    </div>
                    <div className="mt-2 text-[10px] text-text-secondary break-words">
                      {compactPreview(decision.task)}
                    </div>
                  </div>
                );
              })}
              {visibleDecisions.length === 0 && (
                <div className="p-6 bg-surface-raised border border-surface-border rounded-lg text-center text-text-muted text-label-sm">
                  No routing decisions recorded yet.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="text-[10px] text-text-muted font-mono">
          Dashboard data source: Convex `workEvents`, `executorRuns`, and `routingDecisions`. Existing service logs remain in systemd, but SAGE, DISPATCH, verifier, recovery, and Command Center actions should emit durable records here.
        </div>
      </div>
    </div>
  );
};
