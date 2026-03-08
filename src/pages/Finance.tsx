import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/src/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { DollarSign, Wallet, ShieldCheck, AlertCircle, FileText, CheckCircle2, RefreshCw, ArrowRight } from 'lucide-react';

export const Finance: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['finance-state'],
    queryFn: async () => {
      const res = await fetch('/api/overview-state'); // Using overview state for now
      if (!res.ok) throw new Error('Failed to fetch finance state');
      return res.json();
    },
    refetchInterval: 10000,
  });

  if (isLoading) return <div className="p-8 text-text-muted animate-pulse">Loading Finance...</div>;
  if (error || !data) return <div className="p-8 text-status-incident">Error loading finance state</div>;

  const finance = data.financeSummary;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-base overflow-y-auto">
      <header className="px-6 py-4 border-b border-surface-border bg-surface-raised/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-heading-lg text-text-primary font-bold tracking-tighter uppercase">Finance</h1>
            <span className="text-[10px] font-mono text-text-muted">/finance • Reconciliation & Compliance Monitor</span>
          </div>
          <button className="px-4 py-2 bg-emerald-accent text-text-inverse rounded font-bold uppercase text-[10px] hover:bg-emerald-mid transition-colors">
            Run Reconciliation
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Status', value: finance.status.toUpperCase(), status: finance.status === 'healthy' ? 'healthy' : 'degraded' },
            { label: 'Pending Items', value: finance.pendingItems, status: finance.pendingItems > 10 ? 'degraded' : 'healthy' },
            { label: 'Flagged Items', value: finance.flaggedItems, status: finance.flaggedItems > 0 ? 'incident' : 'healthy' },
            { label: 'Last Reconciliation', value: formatDistanceToNow(new Date(finance.lastReconciliationAt), { addSuffix: true }), status: 'healthy' },
          ].map((kpi, i) => (
            <div key={i} className="p-4 bg-surface-raised border border-surface-border rounded-lg">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{kpi.label}</span>
              <div className="text-heading-lg font-mono text-text-primary mt-1">{kpi.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-emerald-accent" />
              <h2 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Recent Transactions</h2>
            </div>
            <div className="bg-surface-raised border border-surface-border rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-base/50 border-b border-surface-border">
                    <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase">ID</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase">Type</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase text-right">Amount</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase">Status</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50">
                  {[
                    { id: 'tx-8842', type: 'WITHDRAWAL', amount: -12500.00, status: 'completed', time: new Date(Date.now() - 3600000).toISOString() },
                    { id: 'tx-8843', type: 'DEPOSIT', amount: 45000.00, status: 'completed', time: new Date(Date.now() - 7200000).toISOString() },
                    { id: 'tx-8844', type: 'TRADE_FEE', amount: -12.45, status: 'pending', time: new Date(Date.now() - 10800000).toISOString() },
                    { id: 'tx-8845', type: 'REBATE', amount: 4.20, status: 'flagged', time: new Date(Date.now() - 14400000).toISOString() },
                  ].map((tx) => (
                    <tr key={tx.id} className="hover:bg-surface-hover transition-colors group">
                      <td className="px-4 py-4">
                        <span className="text-heading-sm text-text-primary font-mono">{tx.id}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-label-xs font-bold uppercase text-text-muted">{tx.type}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={cn(
                          "text-heading-sm font-mono",
                          tx.amount < 0 ? "text-status-incident" : "text-status-healthy"
                        )}>{tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            tx.status === 'completed' ? "bg-status-healthy" : 
                            tx.status === 'pending' ? "bg-status-degraded" : "bg-status-incident"
                          )} />
                          <span className="text-label-xs font-bold uppercase text-text-primary">{tx.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-label-xs font-mono text-text-secondary">
                          {formatDistanceToNow(new Date(tx.time), { addSuffix: true })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Rail */}
          <div className="space-y-6">
            {/* Compliance Alerts */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-accent" />
                <h2 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Compliance Alerts</h2>
              </div>
              <div className="space-y-3">
                {[
                  { id: 'cmp-1', title: 'KYC Verification Required', severity: 'high', age: '2h ago' },
                  { id: 'cmp-2', title: 'Large Withdrawal Detected', severity: 'medium', age: '4h ago' },
                ].map((alert) => (
                  <div key={alert.id} className="p-4 bg-surface-raised border border-surface-border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-label-xs font-bold uppercase",
                        alert.severity === 'high' ? "text-status-incident" : "text-status-degraded"
                      )}>{alert.severity} Priority</span>
                      <span className="text-[9px] font-mono text-text-muted">{alert.age}</span>
                    </div>
                    <div className="text-label-xs font-bold text-text-primary mb-2">{alert.title}</div>
                    <button className="text-[10px] font-bold text-emerald-accent uppercase hover:underline">Review Case →</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Status */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-accent" />
                <h2 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Audit Status</h2>
              </div>
              <div className="space-y-2">
                {[
                  { name: 'Daily Reconciliation', status: 'completed', time: '12h ago' },
                  { name: 'Weekly Audit', status: 'in-progress', time: '2d ago' },
                  { name: 'Monthly Report', status: 'pending', time: '15d ago' },
                ].map((audit, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-surface-raised border border-surface-border rounded-lg">
                    <div className="flex flex-col">
                      <span className="text-label-xs font-bold text-text-primary">{audit.name}</span>
                      <span className="text-[9px] text-text-muted uppercase">Last run: {audit.time}</span>
                    </div>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      audit.status === 'completed' ? "bg-status-healthy" : 
                      audit.status === 'in-progress' ? "bg-status-info animate-pulse" : "bg-status-neutral"
                    )} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
