import React from 'react';
import { cn } from '@/src/lib/utils';
import { StatusBadge } from '../primitives/StatusBadge';
import { ModeChip } from '../primitives/ModeChip';
import { FreshnessIndicator } from '../primitives/FreshnessIndicator';
import { OverviewState } from '@/src/types';
import { ChevronDown, Filter, Clock, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ForgeIcon } from '../primitives/ForgeIcon';

interface HealthStripProps {
  data: OverviewState;
  onMenuToggle?: () => void;
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  onCustomizeClick?: () => void;
}

export const HealthStrip: React.FC<HealthStripProps> = ({ data, onMenuToggle, currentFilter, onFilterChange, onCustomizeClick }) => {
  const navigate = useNavigate();
  const hasIncidents = data.incidentCount > 0;
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);

  const filters = [
    { id: 'all', label: 'ALL SYSTEMS' },
    { id: 'trading', label: 'TRADING' },
    { id: 'web', label: 'WEB OPS' },
    { id: 'deployments', label: 'DEPLOYMENTS' },
    { id: 'messaging', label: 'MESSAGING' },
  ];

  const activeFilterLabel = filters.find(f => f.id === currentFilter)?.label || 'ALL SYSTEMS';

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 h-12 z-[100] flex items-center px-4 border-b border-surface-border transition-colors duration-500",
      hasIncidents ? "bg-surface-overlay/90" : "bg-surface-overlay"
    )}>
      {/* Background tint for incidents */}
      {hasIncidents && (
        <div className="absolute inset-0 bg-status-incident-bg opacity-20 pointer-events-none" />
      )}

      <div className="flex items-center gap-4 lg:gap-6 w-full relative z-10">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 -ml-1.5 rounded-md hover:bg-surface-hover transition-colors"
        >
          <Menu className="w-5 h-5 text-text-primary" />
        </button>

        {/* Logo */}
        <div className="flex items-center">
          <span className="text-heading-md font-bold tracking-tighter text-text-primary">
            FORGE
          </span>
        </div>

        {/* Global Status */}
        <div 
          onClick={() => navigate('/incidents')}
          className="flex items-center gap-2 lg:gap-3 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <StatusBadge status={data.globalStatus} />
          {hasIncidents && (
            <span className="text-label-sm font-bold text-status-incident animate-pulse whitespace-nowrap">
              {data.incidentCount} <span className="hidden sm:inline">INCIDENT{data.incidentCount > 1 ? 'S' : ''}</span>
            </span>
          )}
        </div>

        <div className="hidden sm:block h-4 w-px bg-surface-border" />

        {/* Mode Chips - Hidden on mobile */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-label-sm text-text-muted">TRADING:</span>
            <ModeChip mode={data.tradingSummary.mode} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-label-sm text-text-muted">WEB:</span>
            <ModeChip mode={data.webOpsSummary.healthySites === data.webOpsSummary.totalSites ? 'live' : 'halted'} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-label-sm text-text-muted">FINANCE:</span>
            <ModeChip mode={data.financeSummary.status === 'healthy' ? 'paper' : 'demo'} />
          </div>
        </div>

        <div className="flex-1" />

        {/* Right Side */}
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="hidden sm:block">
            <FreshnessIndicator timestamp={data.meta.generatedAt} />
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-2 py-1 rounded-md hover:bg-surface-hover cursor-pointer border border-surface-border transition-colors">
            <Clock className="w-3.5 h-3.5 text-text-secondary" />
            <span className="text-label-sm">24H</span>
            <ChevronDown className="w-3 h-3 text-text-muted" />
          </div>

          <div 
            onClick={onCustomizeClick}
            className="hidden md:flex items-center gap-2 px-2 py-1 rounded-md hover:bg-surface-hover cursor-pointer border border-surface-border transition-colors group"
            title="Customize Dashboard"
          >
            <ForgeIcon name="settings" size="sm" className="text-text-secondary group-hover:text-emerald-accent" />
            <span className="text-label-sm hidden sm:inline uppercase">LAYOUT</span>
          </div>

          <div className="relative">
            <div 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "flex items-center gap-2 px-2 py-1 rounded-md hover:bg-surface-hover cursor-pointer border transition-colors",
                isFilterOpen ? "border-accent-primary bg-surface-active" : "border-surface-border"
              )}
            >
              <Filter className={cn("w-3.5 h-3.5", isFilterOpen ? "text-accent-primary" : "text-text-secondary")} />
              <span className="text-label-sm hidden sm:inline uppercase">{activeFilterLabel}</span>
              <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", isFilterOpen ? "text-accent-primary rotate-180" : "text-text-muted")} />
            </div>

            {isFilterOpen && (
              <>
                <div 
                  className="fixed inset-0 z-[110]" 
                  onClick={() => setIsFilterOpen(false)} 
                />
                <div className="absolute top-full right-0 mt-1 w-48 bg-surface-overlay border border-surface-border rounded-md shadow-raised z-[120] py-1 overflow-hidden">
                  {filters.map(f => (
                    <button
                      key={f.id}
                      onClick={() => {
                        onFilterChange(f.id);
                        setIsFilterOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-label-sm hover:bg-surface-hover transition-colors flex items-center justify-between",
                        currentFilter === f.id ? "text-accent-primary bg-accent-subtle/20" : "text-text-secondary"
                      )}
                    >
                      {f.label}
                      {currentFilter === f.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
