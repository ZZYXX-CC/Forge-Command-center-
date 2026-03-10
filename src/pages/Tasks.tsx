import React from 'react';
import { ForgeIcon } from '../components/primitives/ForgeIcon';

export const Tasks: React.FC = () => {
  return (
    <main className="flex-1 p-6 bg-surface-base">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display-md font-bold tracking-tighter text-text-primary uppercase">Task Management</h1>
            <p className="text-text-secondary text-heading-sm">Daily operations and task tracking.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-accent text-text-inverse rounded-md font-bold text-label-sm hover:bg-emerald-mid transition-colors">
            <ForgeIcon name="checklist-minimalistic" size="sm" />
            NEW TASK
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-raised border border-surface-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-heading-sm text-text-primary">Open Tasks</div>
              <div className="text-mono-lg text-text-primary">24</div>
            </div>
            <div className="h-px bg-surface-border" />
            <div className="flex items-center justify-between text-label-sm">
              <span className="text-text-muted">OVERDUE</span>
              <span className="text-status-incident font-mono">2</span>
            </div>
          </div>

          <div className="bg-surface-raised border border-surface-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-heading-sm text-text-primary">Due Today</div>
              <div className="text-mono-lg text-emerald-accent">8</div>
            </div>
            <div className="h-px bg-surface-border" />
            <div className="flex items-center justify-between text-label-sm">
              <span className="text-text-muted">COMPLETED TODAY</span>
              <span className="text-status-healthy font-mono">15</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-raised border border-surface-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-border bg-surface-overlay">
            <div className="text-heading-sm text-text-primary">Active Task List</div>
          </div>
          <div className="divide-y divide-surface-border">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="px-6 py-4 flex items-center justify-between group hover:bg-surface-hover transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-5 h-5 rounded border border-surface-border flex items-center justify-center group-hover:border-text-muted transition-colors">
                    {i === 3 && <ForgeIcon name="check-read" size="xs" className="text-emerald-accent" />}
                  </div>
                  <div className={i === 3 ? "text-text-muted line-through" : "text-text-primary"}>
                    Task {i} description goes here...
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-label-xs text-text-muted uppercase">TRADING</div>
                  <div className="text-label-xs text-status-healthy font-bold">LOW</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};
