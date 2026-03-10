import React from 'react';
import { ForgeIcon } from '../components/primitives/ForgeIcon';

export const Sites: React.FC = () => {
  return (
    <main className="flex-1 p-6 bg-surface-base">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display-md font-bold tracking-tighter text-text-primary uppercase">Sites & Infra</h1>
            <p className="text-text-secondary text-heading-sm">Manage your web presence and infrastructure.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-accent text-text-inverse rounded-md font-bold text-label-sm hover:bg-emerald-mid transition-colors">
            <ForgeIcon name="rocket" size="sm" />
            NEW DEPLOYMENT
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface-raised border border-surface-border rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-overlay flex items-center justify-center border border-surface-border">
                    <ForgeIcon name="global" size="md" className="text-emerald-accent" />
                  </div>
                  <div>
                    <div className="text-heading-sm text-text-primary">Site {i}.studio</div>
                    <div className="text-label-xs text-text-muted">PRODUCTION</div>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-status-healthy" />
              </div>
              
              <div className="h-24 bg-surface-base rounded-md border border-surface-border flex items-center justify-center">
                <span className="text-text-muted text-label-xs">UPTIME GRAPH PLACEHOLDER</span>
              </div>

              <div className="flex items-center justify-between text-label-sm">
                <span className="text-text-muted">UPTIME (24H)</span>
                <span className="text-text-primary font-mono">99.9%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};
