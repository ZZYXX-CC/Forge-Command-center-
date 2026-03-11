import React from 'react';
import { cn } from '@/src/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { FileText, Search, Clock, ShieldCheck } from 'lucide-react';
import { OverviewState } from '../types';

interface AuditProps {
  data: OverviewState;
}

export const Audit: React.FC<AuditProps> = ({ data }) => {
  const changes = data.recentChanges;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-base overflow-y-auto">
      <header className="px-6 py-4 border-b border-surface-border bg-surface-raised/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-heading-lg text-text-primary font-bold tracking-tighter uppercase">Audit / Logs</h1>
            <span className="text-[10px] font-mono text-text-muted">/audit • System-Wide Activity & Change Log</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input 
                className="pl-9 pr-4 py-2 bg-surface-base border border-surface-border rounded text-[10px] font-bold uppercase text-text-primary placeholder:text-text-muted outline-none focus:border-emerald-accent transition-colors"
                placeholder="Search logs..."
              />
            </div>
            <button className="px-4 py-2 bg-surface-raised border border-surface-border rounded text-[10px] font-bold uppercase text-text-primary hover:bg-surface-hover transition-colors">
              Export CSV
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Changes (24H)', value: 145, status: 'healthy' },
            { label: 'Config Updates', value: 12, status: 'healthy' },
            { label: 'Security Events', value: 0, status: 'healthy' },
            { label: 'System Alerts', value: 43, status: 'degraded' },
          ].map((kpi, i) => (
            <div key={i} className="p-4 bg-surface-raised border border-surface-border rounded-lg">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{kpi.label}</span>
              <div className="text-heading-lg font-mono text-text-primary mt-1">{kpi.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Log */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-emerald-accent" />
              <h2 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Activity Log</h2>
            </div>
            <div className="bg-surface-raised border border-surface-border rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-base/50 border-b border-surface-border">
                    <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase">Type</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase">Description</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase">Actor</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase">Domain</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50">
                  {changes.map((change) => (
                    <tr key={change.id} className="hover:bg-surface-hover transition-colors group">
                      <td className="px-4 py-4">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                          change.type === 'incident_open' ? "bg-status-incident/10 text-status-incident" : 
                          change.type === 'deployment' ? "bg-status-info/10 text-status-info" : 
                          change.type === 'config' ? "bg-status-degraded/10 text-status-degraded" : "bg-surface-border text-text-muted"
                        )}>{change.type.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-heading-sm text-text-primary">{change.description}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-label-xs font-bold uppercase text-text-muted">{change.actor}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-label-xs font-bold uppercase text-emerald-accent">{change.domain}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-label-xs font-mono text-text-secondary">
                          {formatDistanceToNow(new Date(change.occurredAt), { addSuffix: true })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Rail */}
          <div className="space-y-6">
            {/* Security Events */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-accent" />
                <h2 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Security Events</h2>
              </div>
              <div className="space-y-3">
                {[
                  { id: 'sec-1', title: 'New Admin Login', severity: 'low', age: '1h ago' },
                  { id: 'sec-2', title: 'API Key Rotation Due', severity: 'medium', age: 'Today' },
                ].map((alert) => (
                  <div key={alert.id} className="p-4 bg-surface-raised border border-surface-border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-label-xs font-bold uppercase",
                        alert.severity === 'high' ? "text-status-incident" : "text-status-degraded"
                      )}>{alert.severity} Priority</span>
                      <span className="text-[9px] font-mono text-text-muted">{alert.age}</span>
                    </div>
                    <div className="text-label-xs font-bold text-text-primary mb-2">{alert.title}</div>
                    <button className="text-[10px] font-bold text-emerald-accent uppercase hover:underline">View Details →</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Retention Status */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-accent" />
                <h2 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Retention Status</h2>
              </div>
              <div className="p-4 bg-surface-raised border border-surface-border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-label-xs text-text-primary font-bold uppercase">Audit Logs</span>
                  <span className="text-[10px] font-mono text-status-healthy">365 Days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-label-xs text-text-primary font-bold uppercase">System Logs</span>
                  <span className="text-[10px] font-mono text-status-degraded">30 Days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-label-xs text-text-primary font-bold uppercase">Trading Data</span>
                  <span className="text-[10px] font-mono text-status-healthy">7 Years</span>
                </div>
                <div className="h-px bg-surface-border" />
                <div className="flex items-center justify-between text-text-muted">
                  <span className="text-[9px] uppercase">Storage Used</span>
                  <span className="text-[10px] font-mono">1.2 TB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
