import React from 'react';
import { cn } from '@/src/lib/utils';
import { TradingHealth } from '@/src/types/trading';
import { Activity, Zap, ShieldCheck, Clock, AlertCircle } from 'lucide-react';

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
    <div className="bg-surface-raised border border-surface-border rounded-lg p-3 flex flex-wrap items-center gap-6">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] text-text-muted uppercase font-bold">Exchange</span>
          <span className="text-heading-sm font-bold text-text-primary">BYBIT</span>
        </div>
        <div className="h-8 w-px bg-surface-border" />
        <div className={cn(
          "px-2 py-0.5 rounded text-label-sm font-bold",
          health.mode === 'LIVE' ? "bg-status-incident text-text-inverse" : "bg-status-info text-text-inverse"
        )}>
          {health.mode}
        </div>
        <div className="h-8 w-px bg-surface-border" />
      </div>

      <div className="flex items-center gap-6 flex-1 min-w-[300px]">
        <div className="flex items-center gap-2">
          <ShieldCheck className={cn("w-4 h-4", statusColors[health.auth])} />
          <span className="text-label-sm text-text-muted uppercase">Auth</span>
          <span className={cn("text-label-sm font-bold uppercase", statusColors[health.auth])}>{health.auth}</span>
        </div>

        <div className="flex items-center gap-2">
          <Activity className={cn("w-4 h-4", statusColors[health.ws])} />
          <span className="text-label-sm text-text-muted uppercase">WS</span>
          <span className={cn("text-label-sm font-bold uppercase", statusColors[health.ws])}>{health.ws}</span>
        </div>

        <div className="flex items-center gap-2">
          <Zap className={cn("w-4 h-4", statusColors[health.orderApi])} />
          <span className="text-label-sm text-text-muted uppercase">Order API</span>
          <span className={cn("text-label-sm font-bold uppercase", statusColors[health.orderApi])}>{health.orderApi}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-mono-sm text-text-secondary">
            {new Date(health.lastUpdate).toLocaleTimeString()}
          </span>
        </div>
        {health.isStale && (
          <div className="flex items-center gap-1 text-status-degraded animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-label-sm font-bold">STALE</span>
          </div>
        )}
      </div>
    </div>
  );
};
