import React from 'react';
import { StatusCard } from './StatusCard';
import { OverviewState } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ForgeIcon } from '../primitives/ForgeIcon';

interface BotSnapshotCardProps {
  data: OverviewState;
}

export const BotSnapshotCard: React.FC<BotSnapshotCardProps> = ({ data }) => {
  const navigate = useNavigate();
  const summary = data.botSummary;

  return (
    <StatusCard
      label="BOT TEAM"
      title="Automation Health"
      status={summary.errorBots > 0 ? 'incident' : 'healthy'}
      timestamp={data.meta.generatedAt}
      footerAction="Manage bots →"
      onFooterActionClick={() => navigate('/bots')}
    >
      <div className="space-y-6 py-2">
        <div className="flex flex-col">
          <div className="text-label-sm text-text-muted uppercase tracking-wider">Active Bots</div>
          <div className="text-display-lg font-mono text-status-healthy">
            {summary.activeBots}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-label-sm text-text-muted uppercase">Total</div>
            <div className="text-mono-lg text-text-primary">
              {summary.totalBots}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-label-sm text-text-muted uppercase">Errors</div>
            <div className={cn(
              "text-mono-lg",
              summary.errorBots > 0 ? "text-status-incident" : "text-text-primary"
            )}>
              {summary.errorBots}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-surface-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ForgeIcon name="cpu" size="sm" className="text-text-muted" />
              <span className="text-label-sm text-text-muted">STATUS:</span>
            </div>
            <span className="text-label-sm text-status-healthy font-bold">
              ALL SYSTEMS NOMINAL
            </span>
          </div>
        </div>
      </div>
    </StatusCard>
  );
};
