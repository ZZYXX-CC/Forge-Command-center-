import React from 'react';
import { ForgeIcon } from '../components/primitives/ForgeIcon';

export const Money: React.FC = () => {
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
            <div className="text-display-lg font-mono text-emerald-accent">$45,200.50</div>
            <div className="h-px bg-surface-border" />
            <div className="flex items-center justify-between text-label-sm">
              <span className="text-text-muted">FIAT BALANCE</span>
              <span className="text-text-primary font-mono">$1.25M</span>
            </div>
          </div>

          <div className="bg-surface-raised border border-surface-border rounded-xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-heading-md text-text-primary">Monthly Revenue</div>
              <ForgeIcon name="graph-new" size="md" className="text-emerald-accent" />
            </div>
            <div className="text-display-lg font-mono text-status-healthy">+$16,700.00</div>
            <div className="h-px bg-surface-border" />
            <div className="flex items-center justify-between text-label-sm">
              <span className="text-text-muted">UNPAID INVOICES</span>
              <span className="text-status-degraded font-mono">$8,450.00</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
