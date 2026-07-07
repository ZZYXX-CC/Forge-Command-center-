import React from 'react';
import { ForgeIcon } from '@/src/components/ui/ForgeIcon';

interface SitesProps {}

export const Sites: React.FC<SitesProps> = () => {
  return (
    <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-display-md tracking-tight">Sites</h1>
            <p className="text-body-sm text-text-secondary">All web properties — uptime, deploys, SSL</p>
          </div>
        </header>
        <div className="p-12 border border-dashed border-surface-border rounded-lg text-center">
          <ForgeIcon name="global" size="xl" className="text-text-muted mx-auto mb-3" />
          <p className="text-body-md text-text-secondary">Sites monitoring — pending integration</p>
        </div>
      </div>
    </main>
  );
};
