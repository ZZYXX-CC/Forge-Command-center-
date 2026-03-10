import React from 'react';
import { StatusCard } from './StatusCard';
import { OverviewState } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { useNavigate } from 'react-router-dom';

interface WebOpsCardProps {
  data: OverviewState;
}

export const WebOpsCard: React.FC<WebOpsCardProps> = ({ data }) => {
  const navigate = useNavigate();
  const summary = data.webOpsSummary;
  const isHealthy = summary.healthySites === summary.totalSites;

  return (
    <StatusCard
      label="WEB / CLIENT OPS"
      title="Site Reliability Snapshot"
      status={isHealthy ? 'healthy' : 'degraded'}
      timestamp={data.meta.generatedAt}
      footerAction="View sites →"
      onFooterActionClick={() => navigate('/web-ops')}
    >
      <div className="space-y-6 py-2">
        <div className="flex justify-between items-end">
          <div>
            <div className="text-label-sm text-text-muted">ACTIVE SITES</div>
            <div className="text-display-lg">
              {summary.healthySites}<span className="text-text-muted text-heading-md"> / {summary.totalSites}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-label-sm text-text-muted">UPTIME (24H)</div>
            <div className="text-mono-lg text-status-healthy">{summary.uptimePct24H}%</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-label-sm text-text-muted">ACTIVE SESSIONS</div>
            <div className="text-mono-lg">{summary.activeSessions?.toLocaleString() || '—'}</div>
          </div>
          <div>
            <div className="text-label-sm text-text-muted">5XX ERRORS (1H)</div>
            <div className={cn(
              "text-mono-lg",
              summary.errors5xx1H > 0 ? "text-status-incident" : "text-text-primary"
            )}>
              {summary.errors5xx1H}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-surface-border">
          <div className="text-label-sm text-text-muted mb-1">LAST DEPLOYMENT</div>
          <div className="flex justify-between items-center">
            <span className="text-body-sm font-mono">{summary.lastDeployedBy}</span>
            <span className="text-mono-sm text-text-muted">
              {new Date(summary.lastDeployAt).toLocaleDateString()} {new Date(summary.lastDeployAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>
    </StatusCard>
  );
};
