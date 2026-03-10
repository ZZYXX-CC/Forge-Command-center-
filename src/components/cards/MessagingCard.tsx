import React from 'react';
import { StatusCard } from './StatusCard';
import { OverviewState } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { useNavigate } from 'react-router-dom';

interface MessagingCardProps {
  data: OverviewState;
}

export const MessagingCard: React.FC<MessagingCardProps> = ({ data }) => {
  const navigate = useNavigate();
  const summary = data.messagingSummary;

  return (
    <StatusCard
      label="MESSAGING / COMMS"
      title="Queue Status"
      status={summary.dlqCount > 0 ? 'degraded' : 'healthy'}
      timestamp={data.meta.generatedAt}
      footerAction="View queues →"
      onFooterActionClick={() => navigate('/messaging')}
    >
      <div className="space-y-6 py-2">
        <div className="flex justify-between items-end">
          <div>
            <div className="text-label-sm text-text-muted">QUEUE DEPTH</div>
            <div className="text-display-lg font-mono">{summary.queueDepth.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-label-sm text-text-muted">RATE / MIN</div>
            <div className="text-mono-lg">{summary.processingRatePerMin.toLocaleString()}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-2 rounded-md bg-surface-overlay border border-surface-border">
            <div className="text-label-sm text-text-muted">DLQ COUNT</div>
            <div className={cn(
              "text-mono-lg",
              summary.dlqCount > 0 ? "text-status-degraded" : "text-text-primary"
            )}>
              {summary.dlqCount}
            </div>
          </div>
          <div className="p-2 rounded-md bg-surface-overlay border border-surface-border">
            <div className="text-label-sm text-text-muted">ERRORS (1H)</div>
            <div className={cn(
              "text-mono-lg",
              summary.errorCount1H > 10 ? "text-status-incident" : summary.errorCount1H > 0 ? "text-status-degraded" : "text-text-primary"
            )}>
              {summary.errorCount1H}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-surface-border">
          <div className="text-label-sm text-text-muted mb-1">LAST PROCESSED</div>
          <div className="text-mono-sm text-text-secondary">
            {new Date(summary.lastProcessedAt).toISOString()}
          </div>
        </div>
      </div>
    </StatusCard>
  );
};
