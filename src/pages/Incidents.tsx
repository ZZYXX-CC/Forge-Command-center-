import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/src/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, ShieldAlert, Clock, CheckCircle2, RefreshCw, ArrowRight, MessageSquare, ShieldCheck } from 'lucide-react';

export const Incidents: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['incident-state'],
    queryFn: async () => {
      const res = await fetch('/api/overview-state'); // Using overview state for now
      if (!res.ok) throw new Error('Failed to fetch incident state');
      return res.json();
    },
    refetchInterval: 10000,
  });

  if (isLoading) return <div className="p-8 text-text-muted animate-pulse">Loading Incidents...</div>;
  if (error || !data) return <div className="p-8 text-status-incident">Error loading incident state</div>;

  const incidents = data.incidents;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-base overflow-y-auto">
      <header className="px-6 py-4 border-b border-surface-border bg-surface-raised/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-heading-lg text-text-primary font-bold tracking-tighter uppercase">Incidents</h1>
            <span className="text-[10px] font-mono text-text-muted">/incidents • Active & Resolved Incident Monitor</span>
          </div>
          <button className="px-4 py-2 bg-status-incident text-text-inverse rounded font-bold uppercase text-[10px] hover:bg-status-incident/90 transition-colors">
            Declare New Incident
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Incidents', value: data.incidentCount, status: data.incidentCount > 0 ? 'incident' : 'healthy' },
            { label: 'Critical Severity', value: incidents.filter(i => i.severity === 'critical').length, status: incidents.filter(i => i.severity === 'critical').length > 0 ? 'incident' : 'healthy' },
            { label: 'Avg MTTR (24H)', value: '14m', status: 'healthy' },
            { label: 'Resolved Today', value: 12, status: 'healthy' },
          ].map((kpi, i) => (
            <div key={i} className="p-4 bg-surface-raised border border-surface-border rounded-lg">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{kpi.label}</span>
              <div className="text-heading-lg font-mono text-text-primary mt-1">{kpi.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Incidents */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-status-incident" />
              <h2 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Active Incidents</h2>
            </div>
            <div className="space-y-4">
              {incidents.length === 0 ? (
                <div className="p-12 bg-surface-raised border border-dashed border-surface-border rounded-lg flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="w-12 h-12 text-status-healthy mb-4 opacity-50" />
                  <h3 className="text-heading-md text-text-primary mb-2">No active incidents</h3>
                  <p className="text-body-sm text-text-secondary">All systems are operational.</p>
                </div>
              ) : (
                incidents.map((incident) => (
                  <div key={incident.id} className="p-6 bg-surface-raised border border-status-incident/30 rounded-lg shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold uppercase",
                          incident.severity === 'critical' ? "bg-status-incident text-text-inverse" : "bg-status-degraded text-text-inverse"
                        )}>{incident.severity}</div>
                        <h3 className="text-heading-md text-text-primary font-bold">{incident.title}</h3>
                      </div>
                      <span className="text-label-xs font-mono text-text-muted">{incident.id}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-text-muted uppercase">System</span>
                        <span className="text-label-xs font-bold text-text-primary">{incident.affectedSystem}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-text-muted uppercase">Duration</span>
                        <span className="text-label-xs font-bold text-text-primary font-mono">{Math.floor(incident.durationMs / 60000)}m</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-text-muted uppercase">Started At</span>
                        <span className="text-label-xs font-bold text-text-primary font-mono">{formatDistanceToNow(new Date(incident.startedAt), { addSuffix: true })}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-text-muted uppercase">Status</span>
                        <span className="text-label-xs font-bold text-status-incident uppercase animate-pulse">Investigating</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button className="px-4 py-2 bg-surface-base border border-surface-border rounded text-[10px] font-bold uppercase text-text-primary hover:bg-surface-hover transition-colors">
                        View Incident Room
                      </button>
                      <button className="px-4 py-2 bg-emerald-accent text-text-inverse rounded text-[10px] font-bold uppercase hover:bg-emerald-mid transition-colors">
                        Resolve Incident
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Rail */}
          <div className="space-y-6">
            {/* Incident History */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-accent" />
                <h2 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Recent History</h2>
              </div>
              <div className="space-y-3">
                {[
                  { id: 'inc-0040', title: 'CDN Latency Spike', status: 'resolved', age: '4h ago' },
                  { id: 'inc-0039', title: 'Database Replication Lag', status: 'resolved', age: '12h ago' },
                  { id: 'inc-0038', title: 'Auth API Timeout', status: 'resolved', age: '1d ago' },
                ].map((hist) => (
                  <div key={hist.id} className="p-4 bg-surface-raised border border-surface-border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-label-xs font-bold text-status-healthy uppercase">{hist.status}</span>
                      <span className="text-[9px] font-mono text-text-muted">{hist.age}</span>
                    </div>
                    <div className="text-label-xs font-bold text-text-primary mb-2">{hist.title}</div>
                    <button className="text-[10px] font-bold text-text-muted uppercase hover:underline">View Post-Mortem →</button>
                  </div>
                ))}
              </div>
            </div>

            {/* On-Call Status */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-accent" />
                <h2 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">On-Call Status</h2>
              </div>
              <div className="space-y-2">
                {[
                  { role: 'Primary SRE', name: 'j.smith', status: 'online' },
                  { role: 'Secondary SRE', name: 'a.chen', status: 'online' },
                  { role: 'Trading Lead', name: 'm.ross', status: 'away' },
                ].map((oc, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-surface-raised border border-surface-border rounded-lg">
                    <div className="flex flex-col">
                      <span className="text-label-xs font-bold text-text-primary">{oc.name}</span>
                      <span className="text-[9px] text-text-muted uppercase">{oc.role}</span>
                    </div>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      oc.status === 'online' ? "bg-status-healthy" : "bg-status-degraded"
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
