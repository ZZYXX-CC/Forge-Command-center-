import React, { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { OverviewState } from '@/src/types';
import { AlertCircle, ChevronRight, CheckCircle2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '../primitives/Toast';
import { useNavigate } from 'react-router-dom';

interface IncidentBannerProps {
  data: OverviewState;
}

export const IncidentBanner: React.FC<IncidentBannerProps> = ({ data }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  // Reset dismissal if the incident count increases
  useEffect(() => {
    if (data.incidents.length > 0) {
      setIsDismissed(false);
    }
  }, [data.incidents.length]);

  const handleAcknowledge = (title: string) => {
    showToast(`Incident Acknowledged: ${title}`, 'success');
  };

  const handleView = (affectedSystem: string) => {
    const system = affectedSystem.toLowerCase();
    if (system.includes('trading')) navigate('/trading');
    else if (system.includes('web') || system.includes('latency')) navigate('/web-ops');
    else if (system.includes('deploy')) navigate('/deployments');
    else if (system.includes('incident')) navigate('/incidents');
    else navigate('/');
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    showToast('Incident banner dismissed. Active incidents still require attention.', 'info');
  };

  if (data.incidents.length === 0 || isDismissed) return null;

  const visibleIncidents = data.incidents.slice(0, 3);
  const remainingCount = data.incidents.length - visibleIncidents.length;

  return (
    <div className="flex flex-col w-full relative group/banner">
      <button 
        onClick={handleDismiss}
        className="absolute top-2 right-2 z-10 p-1 rounded-full bg-status-incident/10 text-status-incident hover:bg-status-incident/20 transition-colors opacity-60 sm:opacity-0 sm:group-hover/banner:opacity-100"
        title="Dismiss all incidents"
      >
        <X className="w-4 h-4" />
      </button>
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
            <button 
              onClick={() => handleAcknowledge(incident.title)}
              className="flex-1 sm:flex-none px-3 py-1 rounded-md bg-surface-overlay border border-surface-border text-label-sm hover:bg-surface-hover transition-colors"
            >
              Acknowledge
            </button>
            <button 
              onClick={() => handleView(incident.affectedSystem)}
              className="flex-1 sm:flex-none px-3 py-1 rounded-md bg-accent-primary text-text-inverse text-label-sm hover:bg-accent-dim transition-colors flex items-center justify-center gap-1"
            >
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
