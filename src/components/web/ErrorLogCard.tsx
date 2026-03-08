import React from 'react';
import { cn } from '@/src/lib/utils';
import { WebErrorLogEntry } from '@/src/types/webOps';
import { format } from 'date-fns';

interface ErrorLogCardProps {
  errors: WebErrorLogEntry[];
}

export const ErrorLogCard: React.FC<ErrorLogCardProps> = ({ errors }) => {
  return (
    <div className="bg-surface-raised border border-surface-border rounded-lg flex flex-col h-full">
      <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
        <span className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Error Log — Last 1H</span>
        <span className="px-1.5 py-0.5 rounded bg-status-incident/10 text-status-incident text-[10px] font-bold uppercase">Live</span>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {errors.length === 0 ? (
          <div className="h-full flex items-center justify-center p-8 text-center">
            <span className="text-label-xs text-text-muted uppercase tracking-widest">No errors in last 1H</span>
          </div>
        ) : (
          <div className="divide-y divide-surface-border/50">
            {errors.map((error, i) => (
              <div 
                key={i} 
                className={cn(
                  "px-4 py-3 flex items-center gap-4 hover:bg-surface-hover transition-colors",
                  error.statusCode >= 500 ? "border-l-2 border-l-status-incident" : "border-l-2 border-l-status-degraded"
                )}
              >
                <div className="flex flex-col min-w-[60px]">
                  <span className="text-[10px] font-mono text-text-muted">
                    {format(new Date(error.occurredAt), 'HH:mm:ss')}
                  </span>
                  <span className={cn(
                    "text-label-xs font-bold font-mono",
                    error.statusCode >= 500 ? "text-status-incident" : "text-status-degraded"
                  )}>
                    {error.statusCode}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono text-text-primary truncate" title={error.route}>
                    {error.route}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">{error.siteId}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center min-w-[32px]">
                  {error.count > 1 && (
                    <span className="px-1.5 py-0.5 rounded bg-status-incident/10 text-status-incident text-[10px] font-bold font-mono">
                      {error.count}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="px-4 py-2 border-t border-surface-border bg-surface-base/30">
        <button className="text-[10px] font-bold text-emerald-accent uppercase hover:underline">View full log →</button>
      </div>
    </div>
  );
};
