import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DeploymentState } from '@/src/types/deployments';
import { cn } from '@/src/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ForgeIcon } from '@/src/components/primitives/ForgeIcon';
import { generateMockDeploymentData } from '../lib/mockData';

export const Deployments: React.FC = () => {
  const { data, isLoading, error } = useQuery<DeploymentState>({
    queryKey: ['deployment-state'],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 600));
      return generateMockDeploymentData();
    },
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] gap-4">
        <ForgeIcon name="refresh" size="xl" className="text-emerald-accent animate-spin" />
        <span className="text-label-md animate-pulse uppercase tracking-widest text-text-muted">Loading Deployments...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] p-4 text-center">
        <div className="max-w-md w-full p-8 bg-surface-raised border border-status-incident rounded-lg shadow-raised">
          <ForgeIcon name="danger-triangle" size="xl" className="text-status-incident mx-auto mb-4" />
          <h2 className="text-heading-lg text-text-primary mb-2 uppercase tracking-tighter">Registry Unavailable</h2>
          <p className="text-body-md text-text-secondary mb-6">Error loading deployment state. Retrying...</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-emerald-accent text-text-inverse rounded font-bold uppercase hover:bg-emerald-mid transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-base overflow-y-auto">
      <header className="px-4 sm:px-6 py-4 border-b border-surface-border bg-surface-raised/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-heading-lg text-text-primary font-bold tracking-tighter uppercase flex items-center gap-2">
              <ForgeIcon name="rocket" size="md" className="text-emerald-accent" />
              Deployments
            </h1>
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">/deployments • CI/CD Pipeline Monitor</span>
          </div>
          <button className="w-full sm:w-auto px-4 py-2 bg-emerald-accent text-text-inverse rounded font-bold uppercase text-[10px] hover:bg-emerald-mid transition-colors flex items-center justify-center gap-2">
            <ForgeIcon name="rocket" size="xs" />
            Trigger New Build
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Deploys', value: data.kpis.activeDeploys, status: data.kpis.activeDeploys > 0 ? 'info' : 'neutral', icon: 'refresh' },
            { label: 'Success Rate 24H', value: `${data.kpis.successRate24H}%`, status: data.kpis.successRate24H > 95 ? 'healthy' : 'degraded', icon: 'check-circle' },
            { label: 'Avg Deploy Time', value: `${data.kpis.avgDeployTimeSeconds}s`, status: 'healthy', icon: 'clock-circle' },
            { label: 'Failed Last 24H', value: data.kpis.failedLast24H, status: data.kpis.failedLast24H > 0 ? 'incident' : 'neutral', icon: 'fire' },
          ].map((kpi, i) => (
            <div key={i} className="p-4 bg-surface-raised border border-surface-border rounded-lg flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{kpi.label}</span>
                <ForgeIcon name={kpi.icon} size="xs" className={cn(
                  kpi.status === 'healthy' ? "text-status-healthy" :
                  kpi.status === 'incident' ? "text-status-incident" :
                  kpi.status === 'info' ? "text-status-info" : "text-text-muted"
                )} />
              </div>
              <div className="text-heading-lg font-mono text-text-primary">{kpi.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Deployment History */}
          <div className="lg:col-span-2 space-y-4 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <ForgeIcon name="clipboard-list" size="sm" className="text-emerald-accent" />
              <h2 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Deployment History</h2>
            </div>
            <div className="bg-surface-raised border border-surface-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-base/50 border-b border-surface-border">
                      <th className="px-2 sm:px-4 py-3 text-[10px] font-bold text-text-secondary uppercase">Service</th>
                      <th className="px-2 sm:px-4 py-3 text-[10px] font-bold text-text-secondary uppercase hidden sm:table-cell">Env</th>
                      <th className="px-2 sm:px-4 py-3 text-[10px] font-bold text-text-secondary uppercase">Status</th>
                      <th className="px-2 sm:px-4 py-3 text-[10px] font-bold text-text-secondary uppercase hidden md:table-cell">Deployed At</th>
                      <th className="px-2 sm:px-4 py-3 text-[10px] font-bold text-text-secondary uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/50">
                    {data.deployments.map((dep) => (
                      <tr key={dep.id} className="hover:bg-surface-hover transition-colors group">
                        <td className="px-2 sm:px-4 py-4">
                          <div className="flex flex-col min-w-0">
                            <span className="text-label-xs sm:text-heading-sm text-text-primary font-mono truncate max-w-[100px] sm:max-w-none">{dep.service}</span>
                            <span className="text-[9px] sm:text-[10px] text-text-muted truncate max-w-[100px] sm:max-w-none">{dep.version}</span>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-4 hidden sm:table-cell">
                          <span className="px-1.5 py-0.5 rounded bg-surface-border text-[10px] font-bold uppercase text-text-muted">
                            {dep.environment}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-4">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              dep.status === 'success' ? "bg-status-healthy" : 
                              dep.status === 'failed' ? "bg-status-incident" : 
                              dep.status === 'in-progress' ? "bg-status-info animate-pulse" : "bg-status-neutral"
                            )} />
                            <span className="text-[9px] sm:text-label-xs font-bold uppercase text-text-primary">{dep.status}</span>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-4 hidden md:table-cell">
                          <span className="text-label-xs font-mono text-text-secondary">
                            {formatDistanceToNow(new Date(dep.deployedAt), { addSuffix: true })}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {dep.rollbackAvailable && (
                              <button className="text-[9px] sm:text-[10px] font-bold text-status-incident uppercase hover:underline flex items-center gap-1">
                                <ForgeIcon name="restart" size="xs" />
                                <span className="hidden xs:inline">Rollback</span>
                              </button>
                            )}
                            <button className="p-1 text-text-muted hover:text-text-primary transition-colors">
                              <ForgeIcon name="arrow-right-up" size="xs" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Rail */}
          <div className="space-y-6">
            {/* Pipelines */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ForgeIcon name="refresh" size="sm" className="text-emerald-accent" />
                <h2 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Active Pipelines</h2>
              </div>
              <div className="space-y-3">
                {data.pipelines.map((pipe) => (
                  <div key={pipe.id} className="p-4 bg-surface-raised border border-surface-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-label-xs font-bold text-text-primary uppercase tracking-wider">{pipe.name}</span>
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
                <ForgeIcon name="cpu" size="sm" className="text-emerald-accent" />
                <h2 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Infrastructure</h2>
              </div>
              <div className="space-y-2">
                {data.infraStatus.map((infra, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-surface-raised border border-surface-border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-label-xs font-bold text-text-primary">{infra.provider}</span>
                      <span className="text-[10px] text-text-muted uppercase font-mono">{infra.region}</span>
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
