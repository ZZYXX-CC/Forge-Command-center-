import React from 'react';
import { cn } from '@/src/lib/utils';
import { Decision } from '@/src/types/trading';
import { formatDistanceToNow } from 'date-fns';
import { ForgeIcon } from '@/src/components/primitives/ForgeIcon';

interface DecisionLogProps {
  decisions: Decision[];
}

export const DecisionLog: React.FC<DecisionLogProps> = ({ decisions }) => {
  return (
    <div className="bg-surface-raised border border-surface-border rounded-lg flex flex-col h-full">
      <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ForgeIcon name="cpu" size="sm" className="text-emerald-accent" />
          <span className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Decision Logic Log</span>
        </div>
        <span className="text-label-sm text-text-muted">Live Analysis</span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-surface-border scrollbar-thin scrollbar-thumb-surface-border">
        {decisions.map((dec) => (
          <div key={dec.id} className="px-4 py-3 flex flex-col gap-2 hover:bg-surface-hover transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded",
                  dec.action === 'BUY' ? "bg-status-healthy/10 text-status-healthy" : 
                  dec.action === 'SELL' ? "bg-status-incident/10 text-status-incident" : "bg-status-neutral/10 text-text-muted"
                )}>
                  {dec.action}
                </span>
                <span className="text-heading-sm font-bold text-text-primary">{dec.symbol}</span>
              </div>
              <span className="text-[10px] text-text-muted">
                {formatDistanceToNow(new Date(dec.timestamp), { addSuffix: true })}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <ForgeIcon name="target" size="xs" className="text-text-muted" />
                <span className="text-[10px] text-text-secondary font-bold uppercase">{dec.strategy}</span>
              </div>
              <p className="text-body-sm text-text-secondary italic">"{dec.reason}"</p>
            </div>

            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-text-muted uppercase">Confidence</span>
                <div className="w-20 h-1 bg-surface-base rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent-primary"
                    style={{ width: `${dec.confidence * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-accent-primary">{(dec.confidence * 100).toFixed(0)}%</span>
              </div>
              <button className="text-[10px] text-text-muted hover:text-text-primary flex items-center gap-1">
                View Logic <ForgeIcon name="arrow-right-up" size="xs" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-2 bg-surface-base/30 border-t border-surface-border">
        <span className="text-[10px] text-text-muted uppercase font-bold">Next Action: Audit TrendFollower_V2 logic</span>
      </div>
    </div>
  );
};
