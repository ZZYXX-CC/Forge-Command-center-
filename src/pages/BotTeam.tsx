import React from 'react';
import { ForgeIcon } from '../components/primitives/ForgeIcon';

export const BotTeam: React.FC = () => {
  return (
    <main className="flex-1 p-6 bg-surface-base">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display-md font-bold tracking-tighter text-text-primary uppercase">Bot Team</h1>
            <p className="text-text-secondary text-heading-sm">Monitor and manage your automated bot fleet.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-accent text-text-inverse rounded-md font-bold text-label-sm hover:bg-emerald-mid transition-colors">
            <ForgeIcon name="cpu" size="sm" />
            DEPLOY NEW BOT
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-raised border border-surface-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-heading-sm text-text-primary">Active Bots</div>
              <div className="text-mono-lg text-status-healthy">5</div>
            </div>
            <div className="h-px bg-surface-border" />
            <div className="flex items-center justify-between text-label-sm">
              <span className="text-text-muted">TOTAL FLEET</span>
              <span className="text-text-primary font-mono">6</span>
            </div>
          </div>

          <div className="bg-surface-raised border border-surface-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-heading-sm text-text-primary">Fleet Health</div>
              <div className="text-mono-lg text-status-healthy">100%</div>
            </div>
            <div className="h-px bg-surface-border" />
            <div className="flex items-center justify-between text-label-sm">
              <span className="text-text-muted">ERRORS (24H)</span>
              <span className="text-text-primary font-mono">0</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
