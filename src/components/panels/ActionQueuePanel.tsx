import React from 'react';
import { cn } from '@/src/lib/utils';
import { OverviewState, ActionPriority } from '@/src/types';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '../primitives/Toast';
import { useNavigate } from 'react-router-dom';

interface ActionQueuePanelProps {
  data: OverviewState;
}

export const ActionQueuePanel: React.FC<ActionQueuePanelProps> = ({ data }) => {
  const actions = data.recommendedActions;
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleExecuteAction = (actionDescription: string, domain: string) => {
    showToast(`Executing: ${actionDescription}`, 'info');
    
    // Optional navigation based on domain
    if (domain.toLowerCase().includes('trading')) navigate('/trading');
    else if (domain.toLowerCase().includes('web')) navigate('/web-ops');
    else if (domain.toLowerCase().includes('deploy')) navigate('/deployments');
  };

  const priorityColors = {
    urgent: 'bg-status-incident text-text-inverse',
    high: 'bg-status-degraded text-text-inverse',
    medium: 'bg-status-info text-text-inverse',
    low: 'bg-status-neutral text-text-inverse',
    info: 'bg-status-neutral text-text-inverse'
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-label-md">ACTION QUEUE</h3>
        <span className="bg-surface-overlay border border-surface-border text-text-secondary px-2 py-0.5 rounded-full text-label-sm font-bold">
          {actions.length}
        </span>
      </div>

      <div className="space-y-1">
        {actions.map((action, idx) => (
          <div 
            key={action.id}
            onClick={() => handleExecuteAction(action.description, action.domain)}
            className="flex items-center gap-3 p-2 rounded-md hover:bg-surface-hover cursor-pointer transition-colors group"
          >
            <div className="text-mono-sm text-text-muted w-4">{idx + 1}</div>
            
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-sm min-w-[50px] text-center",
              priorityColors[action.priority]
            )}>
              {action.priority.toUpperCase()}
            </span>

            <div className="flex-1 min-w-0">
              <div className="text-heading-sm truncate group-hover:text-accent-primary transition-colors">
                {action.description}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-label-sm text-text-muted uppercase">{action.domain}</span>
                <span className="text-text-muted">•</span>
                <span className="text-mono-sm text-text-muted">
                  {action.ageMs > 0 ? formatDistanceToNow(Date.now() - action.ageMs) : '—'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
