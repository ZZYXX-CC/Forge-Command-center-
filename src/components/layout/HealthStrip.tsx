import React from 'react';
import { cn } from '@/src/lib/utils';
import { StatusBadge } from '../primitives/StatusBadge';
import { ModeChip } from '../primitives/ModeChip';
import { FreshnessIndicator } from '../primitives/FreshnessIndicator';
import { OverviewState } from '@/src/types';
import { ChevronDown, Filter, Clock, Menu, X } from 'lucide-react';

interface HealthStripProps {
  data: OverviewState;
  onMenuToggle?: () => void;
}

export const HealthStrip: React.FC<HealthStripProps> = ({ data, onMenuToggle }) => {
  const hasIncidents = data.incidentCount > 0;

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
        <div className="flex items-center gap-2 lg:gap-3">
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

          <div className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-surface-hover cursor-pointer border border-surface-border transition-colors">
            <Filter className="w-3.5 h-3.5 text-text-secondary" />
            <span className="text-label-sm hidden sm:inline">ALL SYSTEMS</span>
            <ChevronDown className="w-3 h-3 text-text-muted" />
          </div>
        </div>
      </div>
    </header>
  );
};
