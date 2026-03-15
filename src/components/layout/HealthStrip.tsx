import React from 'react';
import { cn } from '@/src/lib/utils';
import { StatusBadge } from '../primitives/StatusBadge';
import { ModeChip } from '../primitives/ModeChip';
import { FreshnessIndicator } from '../primitives/FreshnessIndicator';
import { OverviewState } from '@/src/types';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/src/hooks/useTheme';

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
  const { theme, toggleTheme } = useTheme();
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
          <ForgeIcon name="hamburger-menu" size="md" className="text-text-primary" />
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
            <span className="text-label-sm text-text-muted">SITES:</span>
            <ModeChip mode={data.sitesSummary.healthySites === data.sitesSummary.totalSites ? 'live' : 'halted'} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-label-sm text-text-muted">BOTS:</span>
            <ModeChip mode={data.botSummary.activeBots === data.botSummary.totalBots ? 'live' : 'halted'} />
          </div>
        </div>

        <div className="flex-1" />

        {/* Right Side */}
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="hidden sm:block">
            <FreshnessIndicator timestamp={data.meta.generatedAt} />
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-2 py-1 rounded-md hover:bg-surface-hover cursor-pointer border border-surface-border transition-colors">
            <ForgeIcon name="clock-circle" size="sm" className="text-text-secondary" />
            <span className="text-label-sm">24H</span>
            <ForgeIcon name="alt-arrow-down" size="xs" className="text-text-muted" />
          </div>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md hover:bg-surface-hover border border-surface-border text-text-secondary hover:text-emerald-accent transition-all"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <ForgeIcon name="sun-2" size="sm" /> : <ForgeIcon name="moon" size="sm" />}
          </button>
        </div>
      </div>
    </header>
  );
};
