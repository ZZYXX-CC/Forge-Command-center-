import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessagingState } from '@/src/types/messaging';
import { cn } from '@/src/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Layers, Activity, AlertTriangle } from 'lucide-react';
import { generateMockMessagingData } from '../lib/mockData';

export const Messaging: React.FC = () => {
  const { data, isLoading, error } = useQuery<MessagingState>({
    queryKey: ['messaging-state'],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 600));
      return generateMockMessagingData();
    },
    refetchInterval: 10000,
  });

  if (isLoading) return <div className="p-8 text-text-muted animate-pulse">Loading Messaging...</div>;
  if (error || !data) return <div className="p-8 text-status-incident">Error loading messaging state</div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-base overflow-y-auto">
      <header className="px-6 py-4 border-b border-surface-border bg-surface-raised/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-heading-lg text-text-primary font-bold tracking-tighter uppercase">Messaging / Comms</h1>
            <span className="text-[10px] font-mono text-text-muted">/messaging • Queue Monitor & DLQ Manager</span>
          </div>
          <button className="px-4 py-2 bg-emerald-accent text-text-inverse rounded font-bold uppercase text-[10px] hover:bg-emerald-mid transition-colors">
            Purge All Queues
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Queue Depth', value: data.kpis.totalQueueDepth.toLocaleString(), status: data.kpis.totalQueueDepth > 1000 ? 'degraded' : 'healthy' },
            { label: 'Processing Rate', value: `${data.kpis.avgProcessingRate}/m`, status: 'healthy' },
            { label: 'Error Count 1H', value: data.kpis.errorCount1H, status: data.kpis.errorCount1H > 0 ? 'incident' : 'healthy' },
            { label: 'DLQ Total', value: data.kpis.dlqTotal, status: data.kpis.dlqTotal > 0 ? 'incident' : 'healthy' },
          ].map((kpi, i) => (
            <div key={i} className="p-4 bg-surface-raised border border-surface-border rounded-lg">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{kpi.label}</span>
              <div className="text-heading-lg font-mono text-text-primary mt-1">{kpi.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Queue Monitor */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-emerald-accent" />
              <h2 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Queue Monitor</h2>
            </div>
            <div className="bg-surface-raised border border-surface-border rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-base/50 border-b border-surface-border">
                    <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase">Queue Name</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase">Status</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase text-right">Depth</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase text-right">Throughput</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase text-right">DLQ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50">
                  {data.queues.map((q) => (
                    <tr key={q.id} className="hover:bg-surface-hover transition-colors group">
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-heading-sm text-text-primary font-mono">{q.name}</span>
                          <span className="text-[10px] text-text-muted uppercase">{q.type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            q.status === 'healthy' ? "bg-status-healthy" : 
                            q.status === 'degraded' ? "bg-status-degraded" : "bg-status-incident"
                          )} />
                          <span className="text-label-xs font-bold uppercase text-text-primary">{q.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={cn(
                          "text-heading-sm font-mono",
                          q.depth > 1000 ? "text-status-incident" : "text-text-primary"
                        )}>{q.depth.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-heading-sm font-mono text-text-primary">{q.throughputPerMin.toLocaleString()}/m</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={cn(
                          "text-heading-sm font-mono",
                          q.dlqCount > 0 ? "text-status-incident" : "text-text-muted"
                        )}>{q.dlqCount}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Rail */}
          <div className="space-y-6">
            {/* DLQ Alerts */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-status-incident" />
                <h2 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">DLQ Alerts</h2>
              </div>
              <div className="space-y-3">
                {data.dlqAlerts.map((alert) => (
                  <div key={alert.id} className="p-4 bg-surface-raised border border-status-incident/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-label-xs font-bold text-status-incident">{alert.errorCode}</span>
                      <span className="text-[9px] font-mono text-text-muted">
                        {formatDistanceToNow(new Date(alert.occurredAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-text-primary truncate mb-2">{alert.messageId}</div>
                    <button className="text-[10px] font-bold text-emerald-accent uppercase hover:underline">Replay Message →</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Consumers */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-accent" />
                <h2 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Consumer Health</h2>
              </div>
              <div className="space-y-2">
                {data.consumers.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-surface-raised border border-surface-border rounded-lg">
                    <div className="flex flex-col">
                      <span className="text-label-xs font-bold text-text-primary">{c.name}</span>
                      <span className="text-[9px] text-text-muted uppercase">Processed: {c.messagesProcessed.toLocaleString()}</span>
                    </div>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      c.status === 'active' ? "bg-status-healthy" : "bg-status-incident"
                    )} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
