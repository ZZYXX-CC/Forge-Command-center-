import React from 'react';
import { cn } from '@/src/lib/utils';
import { Order } from '@/src/types/trading';
import { formatDistanceToNow } from 'date-fns';
import { ForgeIcon } from '@/src/components/primitives/ForgeIcon';

interface OrdersTapeProps {
  orders: Order[];
}

export const OrdersTape: React.FC<OrdersTapeProps> = ({ orders }) => {
  const statusIcons = {
    filled: <ForgeIcon name="check-circle" size="xs" className="text-status-healthy" />,
    rejected: <ForgeIcon name="fire" size="xs" className="text-status-incident" />,
    canceled: <ForgeIcon name="clock-circle" size="xs" className="text-text-muted" />,
    open: <ForgeIcon name="refresh" size="xs" className="text-status-info animate-spin" />,
  };

  const statusColors = {
    filled: 'text-status-healthy',
    rejected: 'text-status-incident',
    canceled: 'text-text-muted',
    open: 'text-status-info',
  };

  return (
    <div className="bg-surface-raised border border-surface-border rounded-lg flex flex-col h-full">
      <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
        <span className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Orders Tape</span>
        <div className="flex items-center gap-2">
          <button className="text-[10px] text-text-muted hover:text-text-primary font-bold uppercase">All</button>
          <button className="text-[10px] text-text-muted hover:text-text-primary font-bold uppercase">Filled</button>
          <button className="text-[10px] text-text-muted hover:text-text-primary font-bold uppercase">Rejected</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-surface-border scrollbar-thin scrollbar-thumb-surface-border">
        {orders.map((order) => (
          <div key={order.id} className="px-4 py-3 flex flex-col gap-2 hover:bg-surface-hover transition-colors group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded",
                  order.side === 'BUY' ? "bg-status-healthy/10 text-status-healthy" : "bg-status-incident/10 text-status-incident"
                )}>
                  {order.side}
                </span>
                <span className="text-heading-sm font-bold text-text-primary">{order.symbol}</span>
                <span className="text-[10px] text-text-muted uppercase">{order.type}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {statusIcons[order.status]}
                <span className={cn("text-[10px] font-bold uppercase", statusColors[order.status])}>
                  {order.status}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-muted uppercase">Amount</span>
                  <span className="text-mono-sm text-text-secondary">{order.amount}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-muted uppercase">Price</span>
                  <span className="text-mono-sm text-text-secondary">{order.price?.toLocaleString() || 'MARKET'}</span>
                </div>
              </div>
              <span className="text-[10px] text-text-muted">
                {formatDistanceToNow(new Date(order.timestamp), { addSuffix: true })}
              </span>
            </div>

            {order.status === 'rejected' && (
              <div className="mt-1 flex items-start gap-2 p-2 bg-status-incident/5 border border-status-incident/10 rounded">
                <ForgeIcon name="danger-triangle" size="xs" className="text-status-incident mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-status-incident uppercase">Rejected: {order.rejectReason}</span>
                  <span className="text-[10px] text-text-muted">Exchange Code: {order.retCode}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 py-2 bg-surface-base/30 border-t border-surface-border">
        <span className="text-[10px] text-text-muted uppercase font-bold">Next Action: Review rejected LINK order margin</span>
      </div>
    </div>
  );
};
