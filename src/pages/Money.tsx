import React from 'react';
import { ForgeIcon } from '../components/primitives/ForgeIcon';
import { OverviewState } from '../types';

interface MoneyProps {
  data: OverviewState;
}

export const Money: React.FC<MoneyProps> = ({ data }) => {
  const { financeSummary } = data;
  
  return (
    <main className="flex-1 p-6 bg-surface-base">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display-md font-bold tracking-tighter text-text-primary uppercase">Money & Finance</h1>
            <p className="text-text-secondary text-heading-sm">Track your balances, revenue, and invoices.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-accent text-text-inverse rounded-md font-bold text-label-sm hover:bg-emerald-mid transition-colors">
            <ForgeIcon name="wallet-money" size="sm" />
            NEW INVOICE
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-raised border border-surface-border rounded-xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-heading-md text-text-primary">Bybit USDT Balance</div>
              <ForgeIcon name="wallet-money" size="md" className="text-emerald-accent" />
            </div>
            <div className="text-display-lg font-mono text-emerald-accent">
              ${financeSummary.bybitUsdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="h-px bg-surface-border" />
            <div className="flex items-center justify-between text-label-sm">
              <span className="text-text-muted">FIAT BALANCE</span>
              <span className="text-text-primary font-mono">
                ${(financeSummary.fiatBalance / 1000000).toFixed(2)}M
              </span>
            </div>
          </div>

          <div className="bg-surface-raised border border-surface-border rounded-xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-heading-md text-text-primary">Monthly Revenue</div>
              <ForgeIcon name="graph-new" size="md" className="text-emerald-accent" />
            </div>
            <div className="text-display-lg font-mono text-status-healthy">
              +${(financeSummary.thisMonthTradingIncome + financeSummary.thisMonthServiceIncome).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="h-px bg-surface-border" />
            <div className="flex items-center justify-between text-label-sm">
              <span className="text-text-muted">UNPAID INVOICES</span>
              <span className="text-status-degraded font-mono">
                ${financeSummary.unpaidInvoices.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
