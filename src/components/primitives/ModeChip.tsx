import React from 'react';
import { cn } from '@/src/lib/utils';
import { OperationalMode } from '@/src/types';

interface ModeChipProps {
  mode: OperationalMode;
  className?: string;
}

export const ModeChip: React.FC<ModeChipProps> = ({ mode, className }) => {
  const config = {
    live: {
      text: 'text-status-healthy',
      label: 'LIVE'
    },
    paper: {
      text: 'text-status-info',
      label: 'PAPER'
    },
    demo: {
      text: 'text-status-neutral',
      label: 'DEMO'
    },
    halted: {
      text: 'text-status-incident',
      label: 'HALTED'
    }
  };

  const { text, label } = config[mode];

  return (
    <div className={cn(
      'inline-flex items-center px-1.5 py-0.5 rounded-sm bg-surface-overlay border border-surface-border font-mono text-[0.625rem] font-semibold leading-[1.4] tracking-[0.1] uppercase',
      text,
      className
    )}>
      {label}
    </div>
  );
};
