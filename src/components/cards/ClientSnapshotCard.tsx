import React from 'react';
import { StatusCard } from './StatusCard';
import { OverviewState } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ForgeIcon } from '../primitives/ForgeIcon';

interface ClientSnapshotCardProps {
  data: OverviewState;
}

export const ClientSnapshotCard: React.FC<ClientSnapshotCardProps> = ({ data }) => {
  const navigate = useNavigate();
  const summary = data.clientSummary;

  return (
    <StatusCard
      label="CLIENTS & PROJECTS"
      title="Deliverables & Deadlines"
      status={summary.overdueDeliverables > 0 ? 'incident' : 'healthy'}
      timestamp={data.meta.generatedAt}
      footerAction="Manage clients →"
      onFooterActionClick={() => navigate('/clients')}
    >
      <div className="space-y-6 py-2">
        <div className="flex flex-col">
          <div className="text-label-sm text-text-muted uppercase tracking-wider">Active Projects</div>
          <div className="text-display-lg font-mono text-text-primary">
            {summary.activeProjects}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-label-sm text-text-muted uppercase">Overdue</div>
            <div className={cn(
              "text-mono-lg",
              summary.overdueDeliverables > 0 ? "text-status-incident" : "text-text-primary"
            )}>
              {summary.overdueDeliverables}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-label-sm text-text-muted uppercase">Next Deadline</div>
            <div className="text-mono-lg text-text-primary">
              {summary.nextDeadline.daysRemaining}D
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-surface-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ForgeIcon name="users-group-two-rounded" size="sm" className="text-text-muted" />
              <span className="text-label-sm text-text-muted">NEXT:</span>
            </div>
            <span className="text-label-sm text-text-secondary font-bold">
              {summary.nextDeadline.client}
            </span>
          </div>
        </div>
      </div>
    </StatusCard>
  );
};
