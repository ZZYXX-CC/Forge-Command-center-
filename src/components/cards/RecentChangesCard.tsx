import React from 'react';
import { StatusCard } from './StatusCard';
import { OverviewState } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface RecentChangesCardProps {
  data: OverviewState;
}

export const RecentChangesCard: React.FC<RecentChangesCardProps> = ({ data }) => {
  const changes = data.recentChanges;

  const typeConfig = {
    deployment: { label: 'DEPLOY', color: 'bg-status-info-bg text-status-info' },
    config: { label: 'CONFIG', color: 'bg-status-neutral-bg text-status-neutral' },
    incident_open: { label: 'INCIDENT', color: 'bg-status-incident-bg text-status-incident' },
    incident_close: { label: 'RESOLVED', color: 'bg-status-healthy-bg text-status-healthy' },
    strategy_start: { label: 'STRAT', color: 'bg-status-healthy-bg text-status-healthy' },
    strategy_stop: { label: 'STRAT', color: 'bg-status-incident-bg text-status-incident' },
    alert: { label: 'ALERT', color: 'bg-status-degraded-bg text-status-degraded' },
  };

  return (
    <StatusCard
      label="WHAT CHANGED"
      title="Last 24H Activity"
      status="healthy"
      timestamp={data.meta.generatedAt}
      footerAction="View full audit log →"
    >
      <div className="space-y-1 py-2">
        {changes.map((change) => {
          const config = typeConfig[change.type];
          return (
            <div key={change.id} className="flex items-start gap-3 py-2 border-b border-surface-border last:border-0 group">
              <div className="text-mono-sm text-text-muted min-w-[50px] pt-0.5">
                {new Date(change.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-label-sm px-1.5 py-0.5 rounded-sm font-bold", config.color)}>
                    {config.label}
                  </span>
                  <span className="text-label-sm text-text-muted uppercase">{change.domain}</span>
                </div>
                <div className="text-body-sm text-text-primary line-clamp-1 group-hover:line-clamp-none transition-all">
                  {change.description}
                </div>
                <div className="text-label-sm text-text-muted mt-0.5">by {change.actor}</div>
              </div>
            </div>
          );
        })}
      </div>
    </StatusCard>
  );
};
