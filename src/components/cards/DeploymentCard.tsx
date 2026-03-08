import React from 'react';
import { StatusCard } from './StatusCard';
import { OverviewState } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { Loader2, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface DeploymentCardProps {
  data: OverviewState;
}

export const DeploymentCard: React.FC<DeploymentCardProps> = ({ data }) => {
  const summary = data.deploymentSummary;

  return (
    <StatusCard
      label="DEPLOYMENTS"
      title="Release Pipeline"
      status={summary.failedLast24H > 0 ? 'degraded' : 'healthy'}
      timestamp={data.meta.generatedAt}
      footerAction="View pipeline →"
    >
      <div className="space-y-4 py-2">
        <div className="flex gap-4">
          <div className="flex-1 p-2 rounded-md bg-surface-overlay border border-surface-border">
            <div className="text-label-sm text-text-muted">IN PROGRESS</div>
            <div className="flex items-center gap-2">
              <span className="text-mono-lg">{summary.inProgressCount}</span>
              {summary.inProgressCount > 0 && <Loader2 className="w-4 h-4 text-accent-primary animate-spin" />}
            </div>
          </div>
          <div className="flex-1 p-2 rounded-md bg-surface-overlay border border-surface-border">
            <div className="text-label-sm text-text-muted">FAILED (24H)</div>
            <div className={cn(
              "text-mono-lg",
              summary.failedLast24H > 0 ? "text-status-incident" : "text-text-primary"
            )}>
              {summary.failedLast24H}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-label-sm text-text-muted">RECENT DEPLOYMENTS</div>
          {summary.recentDeployments.map((deploy, idx) => (
            <div key={idx} className="flex items-center gap-3 py-1.5 border-b border-surface-border last:border-0">
              {deploy.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-status-healthy" />}
              {deploy.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-status-incident" />}
              {deploy.status === 'in-progress' && <Loader2 className="w-3.5 h-3.5 text-accent-primary animate-spin" />}
              {deploy.status === 'rolled-back' && <RotateCcw className="w-3.5 h-3.5 text-status-degraded" />}
              
              <div className="flex-1 min-w-0">
                <div className="text-heading-sm truncate">{deploy.service}</div>
                <div className="text-mono-sm text-text-muted">{deploy.version} • {deploy.deployedBy}</div>
              </div>

              <div className="text-right">
                <div className="text-mono-sm text-text-muted">
                  {new Date(deploy.deployedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                {deploy.rollbackAvailable && (
                  <button className="text-label-sm text-accent-primary hover:underline">Rollback</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </StatusCard>
  );
};
