import React, { useState } from 'react';
import { cn } from '@/src/lib/utils';
import { CDNNode } from '@/src/types/webOps';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, AlertCircle, Check, X } from 'lucide-react';

interface CDNStatusCardProps {
  nodes: CDNNode[];
}

export const CDNStatusCard: React.FC<CDNStatusCardProps> = ({ nodes }) => {
  const [isConfirmingPurge, setIsConfirmingPurge] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  const handlePurgeAll = () => {
    setIsPurging(true);
    // Simulate purge
    setTimeout(() => {
      setIsPurging(false);
      setIsConfirmingPurge(false);
    }, 2000);
  };

  return (
    <div className="bg-surface-raised border border-surface-border rounded-lg flex flex-col h-full relative overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
        <span className="text-label-sm font-bold text-text-primary uppercase tracking-wider">CDN & Cache Status</span>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-status-healthy animate-pulse" />
          <span className="text-[10px] font-bold text-status-healthy uppercase">Global</span>
        </div>
      </div>
      
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {nodes.map((node) => (
          <div key={node.nodeId} className="flex items-center justify-between p-3 bg-surface-base/50 rounded border border-surface-border/50">
            <div className="flex items-center gap-3">
              <span className="text-lg">{node.regionEmoji}</span>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-label-xs font-bold text-text-primary">{node.region}</span>
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    node.status === 'healthy' ? "bg-status-healthy" : 
                    node.status === 'degraded' ? "bg-status-degraded" : "bg-status-incident"
                  )} />
                </div>
                <span className="text-[9px] text-text-muted uppercase tracking-tighter">{node.nodeId}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-text-muted uppercase">Hit Rate</span>
                <span className={cn(
                  "text-label-xs font-mono font-bold",
                  node.cacheHitPct > 90 ? "text-status-healthy" : 
                  node.cacheHitPct > 80 ? "text-status-degraded" : "text-status-incident"
                )}>
                  {node.cacheHitPct}%
                </span>
              </div>
              
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-text-muted uppercase">Bandwidth</span>
                <span className="text-label-xs font-mono text-text-primary">{node.bandwidthGb} GB</span>
              </div>
              
              <div className="flex flex-col items-end min-w-[80px]">
                <span className="text-[9px] text-text-muted uppercase">Purged</span>
                <span className="text-[10px] font-mono text-text-secondary">
                  {formatDistanceToNow(new Date(node.lastPurgedAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="px-4 py-3 border-t border-surface-border bg-surface-base/30">
        {!isConfirmingPurge ? (
          <button 
            onClick={() => setIsConfirmingPurge(true)}
            className="w-full py-2 flex items-center justify-center gap-2 bg-surface-border hover:bg-surface-hover text-text-primary rounded text-[10px] font-bold uppercase transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Purge All Cache
          </button>
        ) : (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-status-incident/10 border border-status-incident/30 rounded text-status-incident">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase">Confirm Purge?</span>
            </div>
            <button 
              disabled={isPurging}
              onClick={handlePurgeAll}
              className="px-4 py-2 bg-status-incident text-text-inverse rounded text-[10px] font-bold uppercase hover:bg-status-incident/90 disabled:opacity-50"
            >
              {isPurging ? 'Purging...' : 'Yes'}
            </button>
            <button 
              disabled={isPurging}
              onClick={() => setIsConfirmingPurge(false)}
              className="p-2 bg-surface-border text-text-primary rounded hover:bg-surface-hover disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      
      {isPurging && (
        <div className="absolute inset-0 bg-surface-base/60 backdrop-blur-[1px] flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 text-emerald-accent animate-spin" />
            <span className="text-[10px] font-bold text-emerald-accent uppercase tracking-widest">Invalidating Edge Cache...</span>
          </div>
        </div>
      )}
    </div>
  );
};

const RefreshCw = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
);
