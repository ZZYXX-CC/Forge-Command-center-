import React from 'react';
import { ForgeIcon } from '../components/primitives/ForgeIcon';
import { OverviewState } from '../types';

interface ClientsProps {
  data: OverviewState;
}

export const Clients: React.FC<ClientsProps> = ({ data }) => {
  const { clientSummary } = data;
  
  return (
    <main className="flex-1 p-6 bg-surface-base">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display-md font-bold tracking-tighter text-text-primary uppercase">Clients & Projects</h1>
            <p className="text-text-secondary text-heading-sm">Manage your client relationships and deliverables.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-accent text-text-inverse rounded-md font-bold text-label-sm hover:bg-emerald-mid transition-colors">
            <ForgeIcon name="users-group-two-rounded" size="sm" />
            NEW CLIENT
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-raised border border-surface-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-heading-sm text-text-primary">Active Projects</div>
              <div className="text-mono-lg text-text-primary">{clientSummary.activeProjects}</div>
            </div>
            <div className="h-px bg-surface-border" />
            <div className="flex items-center justify-between text-label-sm">
              <span className="text-text-muted">OVERDUE</span>
              <span className="text-status-incident font-mono">{clientSummary.overdueCount}</span>
            </div>
          </div>

          <div className="bg-surface-raised border border-surface-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-heading-sm text-text-primary">Next Deadline</div>
              <div className="text-mono-lg text-emerald-accent">{clientSummary.nextDeadline.daysRemaining}D</div>
            </div>
            <div className="h-px bg-surface-border" />
            <div className="flex items-center justify-between text-label-sm">
              <span className="text-text-muted">CLIENT</span>
              <span className="text-text-primary font-bold">{clientSummary.nextDeadline.client}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
