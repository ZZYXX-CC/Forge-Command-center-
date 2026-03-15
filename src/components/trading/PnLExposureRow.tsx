import React from 'react';
import { cn } from '@/src/lib/utils';
import { PnLSummary } from '@/src/types/trading';
import { ForgeIcon } from '@/src/components/primitives/ForgeIcon';

interface PnLExposureRowProps {
  pnl: PnLSummary;
}

export const PnLExposureRow: React.FC<PnLExposureRowProps> = ({ pnl }) => {
  const formatCurrency = (val: number) => {
    const abs = Math.abs(val);
    const sign = val >= 0 ? '+' : '-';
    return `${sign}$${abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const pnlColor = (val: number) => val >= 0 ? 'text-status-healthy' : 'text-status-incident';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* PnL Stats */}
      <div className="bg-surface-raised border border-surface-border rounded-lg p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-label-sm text-text-muted uppercase">PnL Summary</span>
          <ForgeIcon name="graph-up" size="xs" className="text-text-muted" />
        </div>
        <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted uppercase">Session</span>
            <span className={cn("text-label-sm xs:text-heading-sm font-mono", pnlColor(pnl.session))}>{formatCurrency(pnl.session)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted uppercase">Day</span>
            <span className={cn("text-label-sm xs:text-heading-sm font-mono", pnlColor(pnl.day))}>{formatCurrency(pnl.day)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted uppercase">Week</span>
            <span className={cn("text-label-sm xs:text-heading-sm font-mono", pnlColor(pnl.week))}>{formatCurrency(pnl.week)}</span>
          </div>
        </div>
      </div>

      {/* Realized vs Unrealized */}
      <div className="bg-surface-raised border border-surface-border rounded-lg p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-label-sm text-text-muted uppercase">Realized vs Unrealized</span>
          <ForgeIcon name="target" size="xs" className="text-text-muted" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted uppercase">Realized</span>
            <span className={cn("text-heading-sm xs:text-heading-md font-mono", pnlColor(pnl.realized))}>{formatCurrency(pnl.realized)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted uppercase">Unrealized</span>
            <span className={cn("text-heading-sm xs:text-heading-md font-mono", pnlColor(pnl.unrealized))}>{formatCurrency(pnl.unrealized)}</span>
          </div>
        </div>
      </div>

      {/* Margin & Risk */}
      <div className="bg-surface-raised border border-surface-border rounded-lg p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-label-sm text-text-muted uppercase">Margin & Risk</span>
          <ForgeIcon name="shield-warning" size="xs" className="text-text-muted" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-muted uppercase">Margin Usage</span>
            <span className="text-heading-sm font-mono text-text-primary">{pnl.marginUsage}%</span>
          </div>
          <div className="w-full h-1 bg-surface-base rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                pnl.marginUsage > 80 ? "bg-status-incident" : pnl.marginUsage > 50 ? "bg-status-degraded" : "bg-status-healthy"
              )}
              style={{ width: `${pnl.marginUsage}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-muted uppercase">Total Open Risk</span>
            <span className="text-heading-sm font-mono text-status-degraded">${pnl.totalOpenRisk.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Drawdown */}
      <div className="bg-surface-raised border border-surface-border rounded-lg p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-label-sm text-text-muted uppercase">Drawdown Control</span>
          <ForgeIcon name="graph-down" size="xs" className="text-text-muted" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-muted uppercase">Max Drawdown</span>
            <span className="text-heading-sm font-mono text-status-incident">-${pnl.maxDrawdown.toLocaleString()}</span>
          </div>
          <div className="w-full h-1 bg-surface-base rounded-full overflow-hidden">
            <div 
              className="h-full bg-status-incident transition-all duration-500"
              style={{ width: `${(pnl.maxDrawdown / pnl.drawdownLimit) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-muted uppercase">Limit</span>
            <span className="text-heading-sm font-mono text-text-muted">${pnl.drawdownLimit.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
