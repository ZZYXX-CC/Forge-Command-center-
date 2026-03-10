import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ForgeIcon } from './primitives/ForgeIcon';
import { WidgetId, DashboardSettings } from '../lib/useDashboardSettings';
import { cn } from '../lib/utils';
import { X, GripVertical, Check } from 'lucide-react';

interface DashboardCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DashboardSettings;
  onToggleWidget: (id: WidgetId) => void;
  onReorderWidgets: (newOrder: WidgetId[]) => void;
}

const WIDGET_INFO: Record<WidgetId, { label: string; icon: string; description: string }> = {
  health: { 
    label: 'System Health', 
    icon: 'pulse', 
    description: 'Global infrastructure summary and domain status.' 
  },
  trading: { 
    label: 'Trading Ops', 
    icon: 'graph-new', 
    description: 'Real-time PnL, risk status, and strategy performance.' 
  },
  web: { 
    label: 'Web Ops', 
    icon: 'global', 
    description: 'Site reliability, uptime, and session metrics.' 
  },
  deployments: { 
    label: 'Deployments', 
    icon: 'rocket', 
    description: 'Release pipeline status and recent deployments.' 
  },
  messaging: { 
    label: 'Messaging', 
    icon: 'chat-round-dots', 
    description: 'Queue depth, processing rates, and DLQ monitoring.' 
  },
  tasks: { 
    label: 'Task Management', 
    icon: 'checklist-minimalistic', 
    description: 'Operational tasks linked to alerts and recommended actions.' 
  },
  changes: { 
    label: 'Recent Changes', 
    icon: 'clipboard-list', 
    description: 'Audit log of recent system events and actions.' 
  },
};

export const DashboardCustomizer: React.FC<DashboardCustomizerProps> = ({
  isOpen,
  onClose,
  settings,
  onToggleWidget,
  onReorderWidgets,
}) => {
  if (!isOpen) return null;

  const allWidgetIds: WidgetId[] = ['health', 'trading', 'web', 'deployments', 'messaging', 'tasks', 'changes'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-surface-base/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-lg bg-surface-overlay border border-surface-border rounded-xl shadow-raised overflow-hidden flex flex-col max-h-[80vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-surface-border flex justify-between items-center bg-surface-raised">
            <div className="flex items-center gap-3">
              <ForgeIcon name="settings" size="md" className="text-emerald-accent" />
              <div>
                <h2 className="text-heading-md text-text-primary">Customize Dashboard</h2>
                <p className="text-label-sm text-text-muted">Configure your operations workspace</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-surface-hover rounded-md transition-colors text-text-muted hover:text-text-primary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-2">
              <h3 className="text-label-sm text-text-secondary uppercase tracking-wider">Active Widgets</h3>
              <div className="space-y-2">
                {allWidgetIds.map((id) => {
                  const info = WIDGET_INFO[id];
                  const isActive = settings.visibleWidgets.includes(id);

                  return (
                    <div 
                      key={id}
                      onClick={() => onToggleWidget(id)}
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-lg border transition-all cursor-pointer group",
                        isActive 
                          ? "bg-emerald-subtle/20 border-emerald-accent/30 hover:border-emerald-accent/50" 
                          : "bg-surface-raised border-surface-border hover:border-text-muted"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-md flex items-center justify-center transition-colors",
                        isActive ? "bg-emerald-accent text-text-inverse" : "bg-surface-overlay text-text-muted"
                      )}>
                        <ForgeIcon name={info.icon} size="md" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-body-md font-medium",
                            isActive ? "text-text-primary" : "text-text-secondary"
                          )}>
                            {info.label}
                          </span>
                        </div>
                        <p className="text-label-sm text-text-muted truncate">{info.description}</p>
                      </div>

                      <div className={cn(
                        "w-6 h-6 rounded-full border flex items-center justify-center transition-all",
                        isActive 
                          ? "bg-emerald-accent border-emerald-accent text-text-inverse" 
                          : "border-surface-border group-hover:border-text-muted"
                      )}>
                        {isActive && <Check className="w-4 h-4" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-surface-raised border border-surface-border rounded-lg">
              <div className="flex items-start gap-3">
                <ForgeIcon name="info-circle" size="sm" className="text-status-info mt-0.5" />
                <p className="text-label-sm text-text-secondary">
                  Changes are saved automatically to your local browser profile.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-surface-border bg-surface-raised flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-emerald-accent text-text-inverse rounded-md font-bold hover:bg-emerald-mid transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
