import React from 'react';
import { cn } from '@/src/lib/utils';
import { WebAlert } from '@/src/types/webOps';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface WebAlertsPanelProps {
  alerts: WebAlert[];
}

export const WebAlertsPanel: React.FC<WebAlertsPanelProps> = ({ alerts }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Active Web Alerts</h3>
        <span className="text-[10px] font-mono text-text-muted">{alerts.length} Active</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 border border-dashed border-surface-border rounded-lg">
            <CheckCircle2 className="w-6 h-6 text-status-healthy mb-2 opacity-50" />
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">✓ No active web alerts</span>
          </div>
        ) : (
          alerts.map((alert) => (
            <div 
              key={alert.id}
              className={cn(
                "p-3 rounded-lg border bg-surface-raised transition-all hover:border-surface-border",
                alert.severity === 'critical' ? "border-status-incident/30" : 
                alert.severity === 'high' ? "border-status-degraded/30" : "border-surface-border/50"
              )}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className={cn(
                  "w-4 h-4 mt-0.5 shrink-0",
                  alert.severity === 'critical' ? "text-status-incident" : 
                  alert.severity === 'high' ? "text-status-degraded" : "text-status-info"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-label-xs font-bold text-text-primary leading-tight mb-1">
                    {alert.title}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-text-muted">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] font-mono">
                        {formatDistanceToNow(Date.now() - alert.ageMs, { addSuffix: true })}
                      </span>
                    </div>
                    {alert.siteId && (
                      <span className="text-[9px] font-bold text-emerald-accent uppercase tracking-tighter">
                        {alert.siteId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {!alert.acknowledged && (
                <div className="mt-3 flex justify-end">
                  <button className="text-[10px] font-bold text-emerald-accent uppercase hover:underline">
                    Acknowledge
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
