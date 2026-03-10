import React from 'react';
import { StatusCard } from './StatusCard';
import { OverviewState } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ForgeIcon } from '../primitives/ForgeIcon';

interface SitesSnapshotCardProps {
  data: OverviewState;
}

export const SitesSnapshotCard: React.FC<SitesSnapshotCardProps> = ({ data }) => {
  const navigate = useNavigate();
  const summary = data.sitesSummary;

  return (
    <StatusCard
      label="SITES & INFRA"
      title="Uptime & Health"
      status={summary.healthySites === summary.totalSites ? 'healthy' : 'degraded'}
      timestamp={data.meta.generatedAt}
      footerAction="Manage sites →"
      onFooterActionClick={() => navigate('/sites')}
    >
      <div className="space-y-6 py-2">
        <div className="flex flex-col">
          <div className="text-label-sm text-text-muted uppercase tracking-wider">Global Uptime (24H)</div>
          <div className="text-display-lg font-mono text-status-healthy">
            {summary.uptimePct24H.toFixed(2)}%
          </div>
        </div>

        <div className="space-y-3">
          {summary.sites.slice(0, 3).map(site => (
            <div key={site.id} className="flex items-center justify-between group cursor-pointer" onClick={() => navigate('/sites')}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  site.status === 'healthy' ? "bg-status-healthy" : site.status === 'degraded' ? "bg-status-degraded" : "bg-status-incident"
                )} />
                <span className="text-heading-sm text-text-secondary group-hover:text-text-primary transition-colors">{site.name}</span>
              </div>
              <span className="text-label-sm text-text-muted font-mono">{site.uptimePct24H}%</span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ForgeIcon name="rocket" size="sm" className="text-text-muted" />
            <span className="text-label-sm text-text-muted">LAST DEPLOY:</span>
          </div>
          <span className="text-label-sm text-text-secondary">
            {new Date(summary.lastDeployAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </StatusCard>
  );
};
