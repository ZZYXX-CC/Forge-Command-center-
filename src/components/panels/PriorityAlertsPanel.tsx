import React from 'react';
import { cn } from '@/src/lib/utils';
import { OverviewState, Severity } from '@/src/types';
import { AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '../primitives/Toast';
import { useNavigate } from 'react-router-dom';

interface PriorityAlertsPanelProps {
  data: OverviewState;
}

export const PriorityAlertsPanel: React.FC<PriorityAlertsPanelProps> = ({ data }) => {
  const alerts = data.priorityAlerts;
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleAcknowledge = (e: React.MouseEvent, alertTitle: string) => {
    e.stopPropagation();
    showToast(`Acknowledged: ${alertTitle}`, 'success');
  };

  const handleView = (alertSystem: string) => {
    const domain = alertSystem.toLowerCase();
    if (domain.includes('trading')) navigate('/trading');
    else if (domain.includes('web') || domain.includes('latency')) navigate('/web-ops');
    else if (domain.includes('deploy')) navigate('/deployments');
    else navigate('/');
  };

  const severityColors = {
    critical: 'text-status-incident',
    high: 'text-status-degraded',
    medium: 'text-status-info',
    low: 'text-status-neutral',
    info: 'text-status-neutral'
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-label-md">PRIORITY ALERTS</h3>
        <span className="bg-status-incident-bg text-status-incident px-2 py-0.5 rounded-full text-label-sm font-bold">
          {alerts.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-surface-border rounded-md">
            <CheckCircle2 className="w-8 h-8 text-status-healthy mb-3" />
            <div className="text-heading-sm text-status-healthy">✓ No active alerts</div>
            <div className="text-body-sm text-text-muted">All systems nominal</div>
          </div>
        ) : (
          alerts.map((alert) => (
            <div 
              key={alert.id}
              className={cn(
                "p-3 rounded-md border border-surface-border bg-surface-raised transition-all hover:shadow-hover group",
                alert.acknowledged && "opacity-60 grayscale"
              )}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className={cn("w-4 h-4 mt-0.5", severityColors[alert.severity])} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("text-label-sm font-bold", severityColors[alert.severity])}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-mono-sm text-text-muted">
                      {formatDistanceToNow(Date.now() - alert.ageMs)} ago
                    </span>
                  </div>
                  <div className="text-heading-sm mb-0.5 truncate">{alert.system}</div>
                  <div className="text-body-sm text-text-secondary mb-3 line-clamp-2">
                    {alert.title}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => handleAcknowledge(e, alert.title)}
                      className="flex-1 py-1 px-2 rounded-md bg-surface-overlay border border-surface-border text-label-sm hover:bg-surface-hover transition-colors"
                    >
                      Acknowledge
                    </button>
                    <button 
                      onClick={() => handleView(alert.system)}
                      className="py-1 px-2 rounded-md bg-surface-overlay border border-surface-border text-label-sm hover:bg-surface-hover transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
