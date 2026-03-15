import React from 'react';
import { cn } from '@/src/lib/utils';
import { Strategy } from '@/src/types/trading';
import { ForgeIcon } from '@/src/components/primitives/ForgeIcon';

interface StrategyRuntimePanelProps {
  strategies: Strategy[];
}

export const StrategyRuntimePanel: React.FC<StrategyRuntimePanelProps> = ({ strategies }) => {
  return (
    <div className="bg-surface-raised border border-surface-border rounded-lg flex flex-col h-full">
      <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
        <span className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Strategy Runtime</span>
        <span className="text-label-sm text-text-muted">{strategies.filter(s => s.state === 'running').length} Active</span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-surface-border scrollbar-thin scrollbar-thumb-surface-border">
        {strategies.map((strat) => (
          <div key={strat.id} className="px-4 py-3 flex flex-col gap-2 hover:bg-surface-hover transition-colors group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  strat.state === 'running' ? "bg-status-healthy animate-pulse" : strat.state === 'paused' ? "bg-status-neutral" : "bg-status-incident"
                )} />
                <span className="text-heading-sm font-bold text-text-primary">{strat.name}</span>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {strat.state === 'running' ? (
                  <button className="p-1 text-text-muted hover:text-status-degraded transition-colors">
                    <ForgeIcon name="close-circle" size="xs" />
                  </button>
                ) : (
                  <button className="p-1 text-text-muted hover:text-status-healthy transition-colors">
                    <ForgeIcon name="rocket" size="xs" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <ForgeIcon name="pulse" size="xs" className="text-text-muted" />
                  <span className="text-[10px] text-text-muted uppercase">Heartbeat</span>
                </div>
                <span className="text-mono-sm text-text-secondary">{strat.heartbeatAge}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted uppercase">Consec. Losses</span>
                <span className={cn(
                  "text-mono-sm font-bold",
                  strat.consecutiveLosses > 2 ? "text-status-incident" : "text-text-secondary"
                )}>{strat.consecutiveLosses}</span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted uppercase">Last Signal</span>
              <span className="text-mono-sm text-text-primary truncate">{strat.lastSignal}</span>
            </div>

            {strat.state === 'error' && (
              <div className="mt-1 flex items-center gap-2 p-2 bg-status-incident/5 border border-status-incident/10 rounded">
                <ForgeIcon name="danger-triangle" size="xs" className="text-status-incident" />
                <span className="text-[10px] font-bold text-status-incident uppercase">Execution Error: Check Logs</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 py-2 bg-surface-base/30 border-t border-surface-border">
        <span className="text-[10px] text-text-muted uppercase font-bold">Next Action: Resume Scalper_BNB after log review</span>
      </div>
    </div>
  );
};
