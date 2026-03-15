import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { 
  Command,
  X
} from 'lucide-react';
import { ForgeIcon } from '../primitives/ForgeIcon';
import { OverviewState } from '@/src/types';

interface DomainNavProps {
  data: OverviewState;
  activeId?: string;
  isMobile?: boolean;
  onSelect?: () => void;
}

export const DomainNav: React.FC<DomainNavProps> = ({ data, activeId = 'overview', isMobile, onSelect }) => {
  const navigate = useNavigate();
  const navItems = [
    { id: 'bots', label: 'Team Overview', icon: 'cpu', path: '/bots' },
    { id: 'overview', label: 'Morning Brief', icon: 'home-smile', path: '/' },
    { id: 'trading', label: 'Trading Ops', icon: 'graph-new', path: '/trading' },
    { id: 'p2p', label: 'P2P Markets', icon: 'bolt', path: '/p2p' },
    { id: 'sites', label: 'Sites', icon: 'global', path: '/sites' },
    { id: 'money', label: 'Money', icon: 'wallet-money', path: '/money' },
    { id: 'tasks', label: 'Tasks', icon: 'checklist-minimalistic', path: '/tasks' },
    { id: 'clients', label: 'Clients', icon: 'users-group-two-rounded', path: '/clients' },
    { id: 'content', label: 'Content', icon: 'camera', path: '/content' },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    onSelect?.();
  };

  return (
    <nav className={cn(
      "bg-surface-base flex flex-col py-4 overflow-y-auto",
      isMobile ? "h-full w-full" : "w-[220px] sticky top-12 h-[calc(100vh-48px)] border-r border-surface-border"
    )}>
      {isMobile && (
        <div className="px-4 mb-6 flex items-center justify-between">
          <span className="text-heading-md font-bold tracking-tighter text-text-primary">FORGE</span>
          <button onClick={onSelect} className="p-2 hover:bg-surface-hover rounded-md">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>
      )}

      <div className="flex-1 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = activeId === item.id;
          const domain = data.domains.find(d => d.id === item.id);
          const status = domain?.status || (item.id === 'overview' ? data.globalStatus : 'healthy');

          const statusColors = {
            healthy: 'bg-status-healthy',
            degraded: 'bg-status-degraded',
            incident: 'bg-status-incident',
            offline: 'bg-status-neutral',
            unknown: 'bg-status-neutral'
          };

          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all group",
                isActive 
                  ? "bg-surface-overlay border-l-2 border-accent-primary text-text-primary" 
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              )}
            >
              <ForgeIcon 
                name={item.icon} 
                size="sm"
                className={cn(
                  "transition-colors",
                  isActive ? "text-accent-primary" : "text-text-muted group-hover:text-text-secondary"
                )} 
              />
              <span className="text-heading-sm flex-1 text-left">{item.label}</span>
              <div className={cn("w-1.5 h-1.5 rounded-full", statusColors[status as keyof typeof statusColors])} />
            </button>
          );
        })}
      </div>

      <div className="px-4 py-4 border-t border-surface-border space-y-4">
        <div className="flex items-center justify-between text-text-muted">
          <div className="flex items-center gap-2">
            <Command className="w-3.5 h-3.5" />
            <span className="text-label-sm">⌘K</span>
          </div>
          <span className="text-label-sm">Palette</span>
        </div>
        
        <button 
          onClick={() => handleNav('/settings')}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all group",
            activeId === 'settings' 
              ? "bg-surface-overlay border-l-2 border-accent-primary text-text-primary" 
              : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
          )}
        >
          <ForgeIcon 
            name="settings" 
            size="sm"
            className={cn(
              "transition-colors",
              activeId === 'settings' ? "text-accent-primary" : "text-text-muted group-hover:text-text-secondary"
            )} 
          />
          <span className="text-heading-sm">Settings</span>
        </button>

        <div className="pt-4">
          <div className="px-3 mb-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">UI Components</span>
          </div>
          <div className="space-y-1">
            {[
              { id: 'ui-neural', label: 'Neural Map', icon: 'map', path: '/ui/neural-map' },
              { id: 'ui-primitives', label: 'Primitives', icon: 'widget', path: '/ui/primitives' },
              { id: 'ui-feedback', label: 'Feedback', icon: 'notification-lines', path: '/ui/feedback' },
              { id: 'ui-data', label: 'Data Display', icon: 'chart', path: '/ui/data-display' },
              { id: 'ui-layout', label: 'Layout', icon: 'layers', path: '/ui/layout' },
              { id: 'ui-library', label: 'Component Library', icon: 'clipboard-list', path: '/library' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-1.5 rounded-md transition-all group",
                  activeId === item.id 
                    ? "bg-surface-overlay text-emerald-accent" 
                    : "text-text-muted hover:bg-surface-hover hover:text-text-secondary"
                )}
              >
                <ForgeIcon 
                  name={item.icon} 
                  size="sm"
                  className={cn(
                    "transition-colors",
                    activeId === item.id ? "text-emerald-accent" : "text-text-muted group-hover:text-text-secondary"
                  )} 
                />
                <span className="text-label-md flex-1 text-left">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};
