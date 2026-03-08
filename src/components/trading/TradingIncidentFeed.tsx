import React from 'react';
import { cn } from '@/src/lib/utils';
import { TradingIncident } from '@/src/types/trading';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, ChevronRight, CheckCircle2 } from 'lucide-react';

interface TradingIncidentFeedProps {
  incidents: TradingIncident[];
}

export const TradingIncidentFeed: React.FC<TradingIncidentFeedProps> = ({ incidents }) => {
  if (incidents.length === 0) {
    return (
      <div className="bg-surface-raised border border-surface-border rounded-lg p-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <CheckCircle2 className="w-8 h-8 text-status-healthy/30" />
          <span className="text-text-muted text-body-sm uppercase font-bold">No Trading Anomalies</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-raised border border-surface-border rounded-lg flex flex-col h-full">
      <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
        <span className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Trading Incidents</span>
        <span className="text-label-sm text-status-incident font-bold">{incidents.filter(i => !i.acknowledged).length} New</span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-surface-border scrollbar-thin scrollbar-thumb-surface-border">
        {incidents.map((incident) => (
          <div key={incident.id} className={cn(
            "px-4 py-3 flex flex-col gap-2 hover:bg-surface-hover transition-colors",
            !incident.acknowledged && "bg-status-incident/5"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded",
                  incident.severity === 'critical' ? "bg-status-incident text-text-inverse" : 
                  incident.severity === 'high' ? "bg-status-incident/20 text-status-incident" : "bg-status-degraded/20 text-status-degraded"
                )}>
                  {incident.severity.toUpperCase()}
                </span>
                <span className="text-heading-sm font-bold text-text-primary">{incident.title}</span>
              </div>
              <span className="text-[10px] text-text-muted">
                {formatDistanceToNow(new Date(incident.firstSeen), { addSuffix: true })}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-text-muted uppercase">Suggested Action:</span>
              <span className="text-body-sm text-text-secondary">{incident.suggestedAction}</span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              {!incident.acknowledged ? (
                <button className="px-2 py-1 rounded bg-surface-overlay border border-surface-border text-[10px] font-bold hover:bg-surface-hover">ACKNOWLEDGE</button>
              ) : (
                <div className="flex items-center gap-1 text-[10px] text-status-healthy font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  ACKNOWLEDGED
                </div>
              )}
              <button className="px-2 py-1 rounded bg-accent-primary text-text-inverse text-[10px] font-bold hover:bg-accent-dim flex items-center gap-1">
                INVESTIGATE <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-2 bg-surface-base/30 border-t border-surface-border">
        <span className="text-[10px] text-text-muted uppercase font-bold">Next Action: Resolve Bybit API latency issue</span>
      </div>
    </div>
  );
};
