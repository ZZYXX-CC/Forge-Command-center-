import React from 'react';
import { NeuralCommandMap } from '@/src/components/ui';

export const NeuralMapPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-base overflow-hidden">
      <header className="px-4 py-2 border-b border-surface-border bg-surface-raised/50 backdrop-blur-md flex items-center justify-between z-10">
        <span className="text-label-sm font-bold text-text-primary uppercase tracking-widest">Neural Map</span>
        <div className="px-2 py-0.5 bg-surface-overlay border border-surface-border rounded text-[9px] font-mono text-text-muted uppercase">
          Interactive
        </div>
      </header>
      <div className="flex-1 p-4">
        <NeuralCommandMap />
      </div>
    </div>
  );
};

export default NeuralMapPage;
