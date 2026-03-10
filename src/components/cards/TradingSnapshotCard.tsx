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
  const isPositive = summary.todayPnl >= 0;

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
          <div className="text-label-sm text-text-muted">TODAY PNL</div>
          <div className={cn(
            "text-display-lg font-mono",
            isPositive ? "text-status-healthy" : "text-status-incident"
          )}>
            {isPositive ? '+' : ''}{summary.todayPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
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
            <div className="text-label-sm text-text-muted">SESSION PNL</div>
            <div className={cn(
              "text-mono-lg",
              summary.sessionPnl >= 0 ? "text-status-healthy" : "text-status-incident"
            )}>
              {summary.sessionPnl >= 0 ? '+' : ''}{summary.sessionPnl.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-label-sm text-text-muted">P2P ORDERS</div>
            <div className="text-mono-lg text-text-secondary">
              {summary.p2pActiveOrders} ACTIVE
            </div>
          </div>
        </div>
      </div>
    </StatusCard>
  );
};
