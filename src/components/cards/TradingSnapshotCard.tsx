import React from 'react';
import { StatusCard } from './StatusCard';
import { OverviewState } from '@/src/types';
import { ModeChip } from '../primitives/ModeChip';
import { cn } from '@/src/lib/utils';
import { useNavigate } from 'react-router-dom';

interface TradingSnapshotCardProps {
  data: OverviewState;
}

export const TradingSnapshotCard: React.FC<TradingSnapshotCardProps> = ({ data }) => {
  const navigate = useNavigate();
  const summary = data.tradingSummary;
  const isPositive = summary.aggregatePnl >= 0;

  return (
    <StatusCard
      label="TRADING OPS"
      title="Runtime Snapshot"
      status={summary.riskStatus === 'breached' ? 'incident' : summary.riskStatus === 'approaching' ? 'degraded' : 'healthy'}
      timestamp={data.meta.generatedAt}
      footerAction="View strategies →"
      onFooterActionClick={() => navigate('/trading')}
    >
      <div className="space-y-6 py-2">
        <div className="flex justify-between items-center">
          <ModeChip mode={summary.mode} />
          <div className="text-right">
            <div className="text-label-sm text-text-muted">RISK STATUS</div>
            <div className={cn(
              "text-heading-sm",
              summary.riskStatus === 'within' ? "text-status-healthy" : 
              summary.riskStatus === 'approaching' ? "text-status-degraded" : "text-status-incident"
            )}>
              {summary.riskStatus.toUpperCase()} LIMITS
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="text-label-sm text-text-muted">AGGREGATE PNL (24H)</div>
          <div className={cn(
            "text-display-lg font-mono",
            isPositive ? "text-status-healthy" : "text-status-incident"
          )}>
            {isPositive ? '+' : ''}{summary.aggregatePnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {summary.pnlCurrency}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-label-sm text-text-muted">STRATEGIES</div>
            <div className="text-mono-lg">{summary.activeStrategies}</div>
          </div>
          <div>
            <div className="text-label-sm text-text-muted">POSITIONS</div>
            <div className="text-mono-lg">{summary.openPositions}</div>
          </div>
          <div>
            <div className="text-label-sm text-text-muted">ERROR RATE (1H)</div>
            <div className={cn(
              "text-mono-lg",
              summary.errorRate1H > 0.05 ? "text-status-incident" : summary.errorRate1H > 0.01 ? "text-status-degraded" : "text-text-primary"
            )}>
              {(summary.errorRate1H * 100).toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-label-sm text-text-muted">LAST ORDER</div>
            <div className="text-mono-lg text-text-secondary">
              {new Date(summary.lastOrderAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
    </StatusCard>
  );
};
