import React, { useState } from 'react';
import { cn } from '@/src/lib/utils';
import { QuickAction } from '@/src/types/webOps';
import { ArrowRight, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface QuickActionsPanelProps {
  actions: QuickAction[];
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({ actions }) => {
  const [toast, setToast] = useState<{ id: string; label: string; status: 'confirm' | 'success' | 'error' } | null>(null);

  const handleActionClick = (action: QuickAction) => {
    if (action.destructive) {
      setToast({ id: action.id, label: action.label, status: 'confirm' });
    } else {
      setToast({ id: action.id, label: action.label, status: 'success' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const confirmAction = () => {
    if (!toast) return;
    setToast({ ...toast, status: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Quick Actions</h3>
        <span className="text-[10px] font-mono text-text-muted">Web Scoped</span>
      </div>

      <div className="flex-1 space-y-2 pr-1">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            className={cn(
              "w-full group flex items-center justify-between p-3 rounded-lg border border-surface-border bg-surface-raised transition-all hover:bg-surface-hover hover:border-surface-border/80",
              action.destructive && "hover:border-status-incident/30"
            )}
          >
            <div className="flex flex-col items-start min-w-0">
              <span className="text-label-xs font-bold text-text-primary leading-tight mb-0.5 text-left">
                {action.label}
              </span>
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">
                {action.domain}
              </span>
            </div>
            <ArrowRight className={cn(
              "w-4 h-4 text-text-muted group-hover:text-text-primary transition-all group-hover:translate-x-0.5",
              action.destructive && "group-hover:text-status-incident"
            )} />
          </button>
        ))}
      </div>

      {/* Confirmation Toast / Overlay */}
      {toast && (
        <div className="absolute inset-0 z-50 bg-surface-base/90 backdrop-blur-sm flex items-center justify-center p-4 rounded-lg animate-in fade-in duration-200">
          <div className={cn(
            "bg-surface-overlay border rounded-lg p-4 w-full shadow-raised flex flex-col gap-4",
            toast.status === 'confirm' ? "border-status-incident" : "border-status-healthy"
          )}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {toast.status === 'confirm' ? (
                  <AlertTriangle className="w-5 h-5 text-status-incident" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-status-healthy" />
                )}
                <div className="flex flex-col">
                  <span className="text-label-md font-bold uppercase tracking-wider text-text-primary">
                    {toast.status === 'confirm' ? 'Confirm Action' : 'Action Triggered'}
                  </span>
                  <span className="text-body-sm text-text-secondary leading-tight">
                    {toast.label}
                  </span>
                </div>
              </div>
              <button onClick={() => setToast(null)} className="text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {toast.status === 'confirm' ? (
              <div className="flex flex-col gap-2">
                <button 
                  onClick={confirmAction}
                  className="w-full py-2 bg-status-incident text-text-inverse rounded font-bold uppercase text-label-sm hover:bg-status-incident/90 transition-colors"
                >
                  Yes, Proceed
                </button>
                <button 
                  onClick={() => setToast(null)}
                  className="w-full py-2 bg-surface-raised border border-surface-border text-text-primary rounded font-bold uppercase text-label-sm hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-status-healthy">
                <div className="w-1.5 h-1.5 rounded-full bg-status-healthy animate-ping" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Processing request...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
