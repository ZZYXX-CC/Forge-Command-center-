import React from 'react';
import { cn } from '@/src/lib/utils';
import { Position } from '@/src/types/trading';
import { MoreHorizontal, ShieldAlert, TrendingUp, TrendingDown } from 'lucide-react';

interface PositionsTableProps {
  positions: Position[];
}

export const PositionsTable: React.FC<PositionsTableProps> = ({ positions }) => {
  if (positions.length === 0) {
    return (
      <div className="bg-surface-raised border border-surface-border rounded-lg p-8 text-center">
        <span className="text-text-muted text-body-md">No open positions</span>
      </div>
    );
  }

  return (
    <div className="bg-surface-raised border border-surface-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
        <span className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Open Positions</span>
        <span className="text-label-sm text-text-muted">{positions.length} Active</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-base/50">
              <th className="px-4 py-2 text-[10px] text-text-muted uppercase font-bold">Symbol</th>
              <th className="px-4 py-2 text-[10px] text-text-muted uppercase font-bold">Side</th>
              <th className="px-4 py-2 text-[10px] text-text-muted uppercase font-bold">Size</th>
              <th className="px-4 py-2 text-[10px] text-text-muted uppercase font-bold">Entry / Mark</th>
              <th className="px-4 py-2 text-[10px] text-text-muted uppercase font-bold">uPnL / ROE</th>
              <th className="px-4 py-2 text-[10px] text-text-muted uppercase font-bold">Age / Strategy</th>
              <th className="px-4 py-2 text-[10px] text-text-muted uppercase font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {positions.map((pos) => (
              <tr key={pos.id} className="hover:bg-surface-hover transition-colors group">
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-heading-sm font-bold text-text-primary">{pos.symbol}</span>
                    {pos.riskFlag !== 'none' && (
                      <div className={cn(
                        "flex items-center gap-1 text-[10px] font-bold uppercase",
                        pos.riskFlag === 'high' ? "text-status-incident" : "text-status-degraded"
                      )}>
                        <ShieldAlert className="w-2.5 h-2.5" />
                        {pos.riskFlag} Risk
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "text-label-sm font-bold px-1.5 py-0.5 rounded",
                    pos.side === 'LONG' ? "bg-status-healthy/10 text-status-healthy" : "bg-status-incident/10 text-status-incident"
                  )}>
                    {pos.side}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-mono-sm text-text-primary font-bold">{pos.size}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-mono-sm text-text-secondary">{pos.entry.toLocaleString()}</span>
                    <span className="text-mono-sm text-text-muted">{pos.mark.toLocaleString()}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      {pos.uPnL >= 0 ? <TrendingUp className="w-3 h-3 text-status-healthy" /> : <TrendingDown className="w-3 h-3 text-status-incident" />}
                      <span className={cn("text-mono-sm font-bold", pos.uPnL >= 0 ? "text-status-healthy" : "text-status-incident")}>
                        {pos.uPnL >= 0 ? '+' : ''}{pos.uPnL.toFixed(2)}
                      </span>
                    </div>
                    <span className={cn("text-[10px] font-bold", pos.roe >= 0 ? "text-status-healthy" : "text-status-incident")}>
                      {pos.roe >= 0 ? '+' : ''}{pos.roe.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-mono-sm text-text-secondary">{pos.age}</span>
                    <span className="text-[10px] text-text-muted truncate max-w-[100px]">{pos.strategy}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="px-2 py-1 rounded bg-surface-overlay border border-surface-border text-[10px] font-bold hover:bg-surface-hover">REDUCE</button>
                    <button className="px-2 py-1 rounded bg-status-incident/20 border border-status-incident/30 text-[10px] font-bold text-status-incident hover:bg-status-incident/30">CLOSE</button>
                    <button className="p-1 text-text-muted hover:text-text-primary">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="px-4 py-2 bg-surface-base/30 border-t border-surface-border flex items-center justify-between">
        <span className="text-[10px] text-text-muted uppercase font-bold">Next Action: Monitor BTC volatility near liq price</span>
        <button className="text-[10px] text-accent-primary font-bold hover:underline">VIEW RISK REPORT</button>
      </div>
    </div>
  );
};
