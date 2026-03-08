import React from 'react';
import { cn } from '@/src/lib/utils';
import { DeployQueueItem } from '@/src/types/webOps';
import { formatDistanceToNow } from 'date-fns';
import { Box, CheckCircle2, XCircle, Clock, RotateCcw } from 'lucide-react';

interface DeployQueuePanelProps {
  queue: DeployQueueItem[];
}

export const DeployQueuePanel: React.FC<DeployQueuePanelProps> = ({ queue }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Deploy Queue</h3>
        <span className="text-[10px] font-mono text-text-muted">{queue.length} Recent</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {queue.map((item) => (
          <div key={item.id} className="p-3 rounded-lg border border-surface-border bg-surface-raised transition-all hover:border-surface-border/80">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-text-muted" />
                <div className="flex flex-col">
                  <span className="text-label-xs font-bold text-text-primary font-mono">{item.service}</span>
                  <span className="text-[10px] text-text-muted font-mono">{item.version}</span>
                </div>
              </div>
              <div className={cn(
                "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                item.status === 'success' ? "bg-status-healthy/10 text-status-healthy" : 
                item.status === 'failed' ? "bg-status-incident/10 text-status-incident" : 
                item.status === 'in-progress' ? "bg-status-info/10 text-status-info animate-pulse" : 
                item.status === 'rolled-back' ? "bg-status-degraded/10 text-status-degraded" : "bg-surface-border text-text-muted"
              )}>
                {item.status.replace('-', ' ')}
              </div>
            </div>
            
            {item.status === 'in-progress' && item.progressPct !== undefined && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-text-muted uppercase tracking-tighter">Progress</span>
                  <span className="text-[10px] font-mono text-text-primary">{item.progressPct}%</span>
                </div>
                <div className="h-1 bg-surface-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-accent transition-all duration-500"
                    style={{ width: `${item.progressPct}%` }}
                  />
                </div>
                {item.etaSeconds && (
                  <div className="mt-1 flex items-center gap-1 text-[9px] text-text-muted font-mono">
                    <Clock className="w-2.5 h-2.5" />
                    <span>ETA: {item.etaSeconds}s</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2 text-[10px] text-text-muted">
                <span className="font-bold uppercase">{item.triggeredBy}</span>
                <span>•</span>
                <span className="font-mono">
                  {formatDistanceToNow(new Date(item.triggeredAt), { addSuffix: true })}
                </span>
              </div>
              
              {item.status === 'failed' && (
                <button className="flex items-center gap-1 text-[10px] font-bold text-status-incident uppercase hover:underline">
                  <RotateCcw className="w-3 h-3" />
                  Retry
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-surface-border">
        <button className="text-[10px] font-bold text-emerald-accent uppercase hover:underline">View full history →</button>
      </div>
    </div>
  );
};
