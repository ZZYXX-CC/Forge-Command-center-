import React from 'react';
import { cn } from '@/src/lib/utils';
import { OverviewState } from '@/src/types';
import { AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface IncidentBannerProps {
  data: OverviewState;
}

export const IncidentBanner: React.FC<IncidentBannerProps> = ({ data }) => {
  if (data.incidents.length === 0) return null;

  const visibleIncidents = data.incidents.slice(0, 3);
  const remainingCount = data.incidents.length - visibleIncidents.length;

  return (
    <div className="flex flex-col w-full">
      {visibleIncidents.map((incident) => (
        <div 
          key={incident.id}
          className="bg-status-incident-bg border-b border-status-incident/30 px-4 py-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
        >
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:min-w-[100px]">
            <span className={cn(
              "text-label-sm font-bold px-1.5 py-0.5 rounded-sm",
              incident.severity === 'critical' ? "bg-status-incident text-text-inverse" : "bg-status-degraded text-text-inverse"
            )}>
              {incident.severity.toUpperCase()}
            </span>
            <span className="sm:hidden text-mono-sm text-status-incident">
              {formatDistanceToNow(new Date(incident.startedAt))}
            </span>
          </div>
          
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 overflow-hidden">
            <span className="text-heading-sm whitespace-nowrap">{incident.affectedSystem}</span>
            <span className="hidden sm:inline text-text-muted">—</span>
            <span className="text-body-sm truncate">{incident.title}</span>
            <span className="hidden sm:inline text-text-muted">—</span>
            <span className="hidden sm:inline text-mono-sm text-status-incident">Active {formatDistanceToNow(new Date(incident.startedAt))}</span>
          </div>

          <div className="flex items-center gap-2 mt-1 sm:mt-0">
            <button className="flex-1 sm:flex-none px-3 py-1 rounded-md bg-surface-overlay border border-surface-border text-label-sm hover:bg-surface-hover transition-colors">
              Acknowledge
            </button>
            <button className="flex-1 sm:flex-none px-3 py-1 rounded-md bg-accent-primary text-text-inverse text-label-sm hover:bg-accent-dim transition-colors flex items-center justify-center gap-1">
              View <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div className="bg-surface-raised border-b border-surface-border px-4 py-1 text-center">
          <span className="text-label-sm text-text-muted">
            {remainingCount} more active incident{remainingCount > 1 ? 's' : ''} collapsed
          </span>
        </div>
      )}
    </div>
  );
};
