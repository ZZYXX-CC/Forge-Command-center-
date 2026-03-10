import React from 'react';
import { ForgeIcon } from '../components/primitives/ForgeIcon';

export const Content: React.FC = () => {
  return (
    <main className="flex-1 p-6 bg-surface-base">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display-md font-bold tracking-tighter text-text-primary uppercase">Content & Media</h1>
            <p className="text-text-secondary text-heading-sm">Manage your media assets and content pipeline.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-accent text-text-inverse rounded-md font-bold text-label-sm hover:bg-emerald-mid transition-colors">
            <ForgeIcon name="camera" size="sm" />
            NEW CONTENT
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-raised border border-surface-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-heading-sm text-text-primary">Content Pipeline</div>
              <div className="text-mono-lg text-text-primary">12</div>
            </div>
            <div className="h-px bg-surface-border" />
            <div className="flex items-center justify-between text-label-sm">
              <span className="text-text-muted">IN PRODUCTION</span>
              <span className="text-text-primary font-mono">3</span>
            </div>
          </div>

          <div className="bg-surface-raised border border-surface-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-heading-sm text-text-primary">Storage Used</div>
              <div className="text-mono-lg text-text-primary">45%</div>
            </div>
            <div className="h-px bg-surface-border" />
            <div className="flex items-center justify-between text-label-sm">
              <span className="text-text-muted">TOTAL ASSETS</span>
              <span className="text-text-primary font-mono">1,245</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
