import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Globe, 
  Box, 
  MessageSquare, 
  DollarSign, 
  AlertTriangle, 
  FileText,
  Settings,
  Command,
  X
} from 'lucide-react';
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
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, domainId: null, path: '/' },
    { id: 'trading', label: 'Trading Ops', icon: TrendingUp, domainId: 'trading', path: '/trading' },
    { id: 'web', label: 'Web / Client Ops', icon: Globe, domainId: 'web', path: '/web-ops' },
    { id: 'deployments', label: 'Deployments', icon: Box, domainId: 'deployments', path: '/deployments' },
    { id: 'messaging', label: 'Messaging / Comms', icon: MessageSquare, domainId: 'messaging', path: '/messaging' },
    { id: 'finance', label: 'Finance', icon: DollarSign, domainId: 'finance', path: '/finance' },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, domainId: 'incidents', path: '/incidents' },
    { id: 'audit', label: 'Audit / Logs', icon: FileText, domainId: 'audit', path: '/audit' },
    { id: 'library', label: 'UI Library', icon: LayoutDashboard, domainId: null, path: '/library' },
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
          const domain = item.domainId ? data.domains.find(d => d.id === item.domainId) : null;
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
              <item.icon className={cn(
                "w-4 h-4 transition-colors",
                isActive ? "text-accent-primary" : "text-text-muted group-hover:text-text-secondary"
              )} />
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
          <Settings className={cn(
            "w-4 h-4 transition-colors",
            activeId === 'settings' ? "text-accent-primary" : "text-text-muted group-hover:text-text-secondary"
          )} />
          <span className="text-heading-sm">Settings</span>
        </button>
      </div>
    </nav>
  );
};
