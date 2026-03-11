import React from 'react';
import { OverviewState } from '@/src/types';
import { Button } from '@/src/components/ui';
import { FreshnessIndicator } from '../components/primitives/FreshnessIndicator';
import { TradingSnapshotCard } from '../components/cards/TradingSnapshotCard';
import { SitesSnapshotCard } from '../components/cards/SitesSnapshotCard';
import { MoneySnapshotCard } from '../components/cards/MoneySnapshotCard';
import { ClientSnapshotCard } from '../components/cards/ClientSnapshotCard';
import { TaskSnapshotCard } from '../components/cards/TaskSnapshotCard';
import { BotSnapshotCard } from '../components/cards/BotSnapshotCard';
import { RecentChangesCard } from '../components/cards/RecentChangesCard';
import { PriorityAlertsPanel } from '../components/panels/PriorityAlertsPanel';
import { ActionQueuePanel } from '../components/panels/ActionQueuePanel';

interface MorningBriefProps {
  data: OverviewState;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  fetchedAt?: number;
}

export const MorningBrief: React.FC<MorningBriefProps> = ({ data, isLoading, isError, onRetry, fetchedAt }) => {
  const ageSeconds = fetchedAt ? Math.floor((Date.now() - fetchedAt) / 1000) : 0;
  const isStale = ageSeconds > 60 || !data.meta.freshnessOk;
  const isEmpty = data.domains.length === 0;
  const isDisabled = data.globalStatus === 'offline';

  if (isDisabled) {
    return (
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto bg-surface-base flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-display-sm text-text-primary">Morning Brief Disabled</h2>
          <p className="text-text-secondary">Data ingestion is paused while systems are offline.</p>
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto bg-surface-base flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-display-sm text-status-incident">Failed to load Morning Brief</h2>
          <Button variant="primary" onClick={onRetry}>Retry</Button>
        </div>
      </main>
    );
  }

  if (isLoading && isEmpty) {
    return (
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto bg-surface-base flex items-center justify-center">
        <div className="text-text-secondary">Loading Morning Brief…</div>
      </main>
    );
  }

  if (isEmpty) {
    return (
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto bg-surface-base flex items-center justify-center">
        <div className="text-center space-y-2">
          <h2 className="text-display-sm text-text-primary">No Morning Brief data</h2>
          <Button variant="secondary" onClick={onRetry}>Refresh</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 lg:p-6 overflow-y-auto bg-surface-base">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-display-md font-bold tracking-tighter text-text-primary uppercase">Morning Brief</h1>
            <p className="text-text-secondary text-heading-sm">Full day snapshot — everything that matters in 60 seconds.</p>
          </div>
          <div className="flex items-center gap-4 text-text-muted text-label-sm">
            <span className="uppercase tracking-widest">System Status:</span>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-status-healthy-bg border border-status-healthy/20">
              <div className="w-2 h-2 rounded-full bg-status-healthy animate-pulse" />
              <span className="text-status-healthy font-bold">ALL SYSTEMS NOMINAL</span>
            </div>
            {isStale && (
              <div className="px-3 py-1 rounded-full bg-status-degraded-bg border border-status-degraded/20 text-status-degraded font-bold">STALE</div>
            )}
            <FreshnessIndicator timestamp={data.meta.generatedAt} />
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6">
          <TradingSnapshotCard data={data} />
          <MoneySnapshotCard data={data} />
          <SitesSnapshotCard data={data} />
          <TaskSnapshotCard data={data} />
          <ClientSnapshotCard data={data} />
          <BotSnapshotCard data={data} />
          <RecentChangesCard data={data} />
          
          {/* Side Panels integrated into grid for large screens */}
          <div className="xl:col-span-2 2xl:col-span-1 space-y-6">
            <PriorityAlertsPanel data={data} />
            <ActionQueuePanel data={data} />
          </div>
        </div>
      </div>

      {/* Mobile-only panels at bottom if needed, but they are in the grid now */}
      <div className="lg:hidden mt-8 space-y-8 pb-8">
        <div className="h-px bg-surface-border" />
        {/* Panels are already in the grid above, but could be duplicated here if grid layout is too complex for mobile */}
      </div>
    </main>
  );
};
