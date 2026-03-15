import React from 'react';
import { cn } from '@/src/lib/utils';
import { TradingHealth } from '@/src/types/trading';
import { ForgeIcon } from '@/src/components/primitives/ForgeIcon';

interface ExecutionHealthBarProps {
  health: TradingHealth;
}

export const ExecutionHealthBar: React.FC<ExecutionHealthBarProps> = ({ health }) => {
  const statusColors = {
    connected: 'text-status-healthy',
    disconnected: 'text-status-incident',
    degraded: 'text-status-degraded',
    stale: 'text-status-neutral',
  };

  return (
    <div className="bg-surface-raised border border-surface-border rounded-lg p-3 flex flex-wrap items-center gap-y-3 gap-x-4 sm:gap-x-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex flex-col">
          <span className="text-[9px] sm:text-[10px] text-text-muted uppercase font-bold">Exchange</span>
          <span className="text-label-sm sm:text-heading-sm font-bold text-text-primary">BYBIT</span>
        </div>
        <div className="h-8 w-px bg-surface-border" />
        <div className={cn(
          "px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-label-sm font-bold",
          health.mode === 'LIVE' ? "bg-status-incident text-text-inverse" : "bg-status-info text-text-inverse"
        )}>
          {health.mode}
        </div>
        <div className="h-8 w-px bg-surface-border hidden xs:block" />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 flex-1 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ForgeIcon name="check-circle" size="xs" className={statusColors[health.auth]} />
          <span className="text-[9px] sm:text-label-sm text-text-muted uppercase">Auth</span>
          <span className={cn("text-[9px] sm:text-label-sm font-bold uppercase", statusColors[health.auth])}>{health.auth}</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ForgeIcon name="pulse" size="xs" className={statusColors[health.ws]} />
          <span className="text-[9px] sm:text-label-sm text-text-muted uppercase">WS</span>
          <span className={cn("text-[9px] sm:text-label-sm font-bold uppercase", statusColors[health.ws])}>{health.ws}</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ForgeIcon name="bolt" size="xs" className={statusColors[health.orderApi]} />
          <span className="text-[9px] sm:text-label-sm text-text-muted uppercase">Order API</span>
          <span className={cn("text-[9px] sm:text-label-sm font-bold uppercase", statusColors[health.orderApi])}>{health.orderApi}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 ml-auto sm:ml-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ForgeIcon name="clock-circle" size="xs" className="text-text-muted" />
          <span className="text-mono-xs sm:text-mono-sm text-text-secondary">
            {new Date(health.lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
        {health.isStale && (
          <div className="flex items-center gap-1 text-status-degraded animate-pulse">
            <ForgeIcon name="danger-triangle" size="xs" />
            <span className="text-[9px] sm:text-label-sm font-bold">STALE</span>
          </div>
        )}
      </div>
    </div>
  );
};
