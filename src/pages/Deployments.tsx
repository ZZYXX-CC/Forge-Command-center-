import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DeploymentState } from '@/src/types/deployments';
import { cn } from '@/src/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Rocket, Box, CheckCircle2, XCircle, Clock, RotateCcw, Server, Activity, ArrowRight } from 'lucide-react';

export const Deployments: React.FC = () => {
  const { data, isLoading, error } = useQuery<DeploymentState>({
    queryKey: ['deployment-state'],
    queryFn: async () => {
      const res = await fetch('/api/deployment-state');
      if (!res.ok) throw new Error('Failed to fetch deployment state');
      return res.json();
    },
    refetchInterval: 10000,
  });

  if (isLoading) return <div className="p-8 text-text-muted animate-pulse">Loading Deployments...</div>;
  if (error || !data) return <div className="p-8 text-status-incident">Error loading deployment state</div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-base overflow-y-auto">
      <header className="px-6 py-4 border-b border-surface-border bg-surface-raised/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-heading-lg text-text-primary font-bold tracking-tighter uppercase">Deployments</h1>
            <span className="text-[10px] font-mono text-text-muted">/deployments • CI/CD Pipeline Monitor</span>
          </div>
          <button className="px-4 py-2 bg-emerald-accent text-text-inverse rounded font-bold uppercase text-[10px] hover:bg-emerald-mid transition-colors">
            Trigger New Build
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Deploys', value: data.kpis.activeDeploys, status: data.kpis.activeDeploys > 0 ? 'info' : 'neutral' },
            { label: 'Success Rate 24H', value: `${data.kpis.successRate24H}%`, status: data.kpis.successRate24H > 95 ? 'healthy' : 'degraded' },
            { label: 'Avg Deploy Time', value: `${data.kpis.avgDeployTimeSeconds}s`, status: 'healthy' },
            { label: 'Failed Last 24H', value: data.kpis.failedLast24H, status: data.kpis.failedLast24H > 0 ? 'incident' : 'healthy' },
          ].map((kpi, i) => (
            <div key={i} className="p-4 bg-surface-raised border border-surface-border rounded-lg">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{kpi.label}</span>
              <div className="text-heading-lg font-mono text-text-primary mt-1">{kpi.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Deployment History */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Rocket className="w-4 h-4 text-emerald-accent" />
              <h2 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Deployment History</h2>
            </div>
            <div className="bg-surface-raised border border-surface-border rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-base/50 border-b border-surface-border">
                    <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase">Service</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase">Env</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase">Status</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase">Deployed At</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50">
                  {data.deployments.map((dep) => (
                    <tr key={dep.id} className="hover:bg-surface-hover transition-colors group">
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-heading-sm text-text-primary font-mono">{dep.service}</span>
                          <span className="text-[10px] text-text-muted">{dep.version}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-1.5 py-0.5 rounded bg-surface-border text-[10px] font-bold uppercase text-text-muted">
                          {dep.environment}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            dep.status === 'success' ? "bg-status-healthy" : 
                            dep.status === 'failed' ? "bg-status-incident" : 
                            dep.status === 'in-progress' ? "bg-status-info animate-pulse" : "bg-status-neutral"
                          )} />
                          <span className="text-label-xs font-bold uppercase text-text-primary">{dep.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-label-xs font-mono text-text-secondary">
                          {formatDistanceToNow(new Date(dep.deployedAt), { addSuffix: true })}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {dep.rollbackAvailable && (
                          <button className="text-[10px] font-bold text-status-incident uppercase hover:underline flex items-center gap-1 ml-auto">
                            <RotateCcw className="w-3 h-3" /> Rollback
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Rail */}
          <div className="space-y-6">
            {/* Pipelines */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-accent" />
                <h2 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Active Pipelines</h2>
              </div>
              <div className="space-y-3">
                {data.pipelines.map((pipe) => (
                  <div key={pipe.id} className="p-4 bg-surface-raised border border-surface-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-label-xs font-bold text-text-primary">{pipe.name}</span>
                      <span className={cn(
                        "text-[9px] font-bold uppercase",
                        pipe.status === 'running' ? "text-status-info animate-pulse" : "text-text-muted"
                      )}>{pipe.status}</span>
                    </div>
                    {pipe.status === 'running' && (
                      <div className="h-1 bg-surface-border rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-emerald-accent" style={{ width: `${pipe.progressPct}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Infra Status */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-accent" />
                <h2 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Infrastructure</h2>
              </div>
              <div className="space-y-2">
                {data.infraStatus.map((infra, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-surface-raised border border-surface-border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-label-xs font-bold text-text-primary">{infra.provider}</span>
                      <span className="text-[10px] text-text-muted">{infra.region}</span>
                    </div>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      infra.status === 'healthy' ? "bg-status-healthy" : "bg-status-incident"
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
