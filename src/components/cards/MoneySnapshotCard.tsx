import React from 'react';
import { StatusCard } from './StatusCard';
import { OverviewState } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ForgeIcon } from '../primitives/ForgeIcon';

interface MoneySnapshotCardProps {
  data: OverviewState;
}

export const MoneySnapshotCard: React.FC<MoneySnapshotCardProps> = ({ data }) => {
  const navigate = useNavigate();
  const summary = data.moneySummary;

  return (
    <StatusCard
      label="MONEY & FINANCE"
      title="Balance & Revenue"
      status="healthy"
      timestamp={data.meta.generatedAt}
      footerAction="View ledger →"
      onFooterActionClick={() => navigate('/money')}
    >
      <div className="space-y-6 py-2">
        <div className="flex flex-col">
          <div className="text-label-sm text-text-muted uppercase tracking-wider">Bybit USDT Balance</div>
          <div className="text-display-lg font-mono text-emerald-accent">
            ${summary.bybitUsdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-label-sm text-text-muted">FIAT BALANCE</div>
            <div className="text-mono-lg text-text-primary">
              ${(summary.fiatBalance / 1000000).toFixed(2)}M
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-label-sm text-text-muted">UNPAID INV.</div>
            <div className={cn(
              "text-mono-lg",
              summary.unpaidInvoices > 0 ? "text-status-degraded" : "text-text-primary"
            )}>
              ${summary.unpaidInvoices.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-surface-border grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-label-sm text-text-muted">TRADING INCOME</div>
            <div className="text-heading-sm text-status-healthy">
              +${summary.thisMonthTradingIncome.toLocaleString()}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-label-sm text-text-muted">SERVICE INCOME</div>
            <div className="text-heading-sm text-status-healthy">
              +${summary.thisMonthServiceIncome.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </StatusCard>
  );
};
