import React from 'react';
import { cn } from '@/src/lib/utils';
import { SystemStatus } from '@/src/types';

interface StatusBadgeProps {
  status: SystemStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = {
    healthy: {
      bg: 'bg-status-healthy-bg',
      text: 'text-status-healthy',
      dot: 'bg-status-healthy',
      label: 'Healthy'
    },
    degraded: {
      bg: 'bg-status-degraded-bg',
      text: 'text-status-degraded',
      dot: 'bg-status-degraded',
      label: 'Degraded'
    },
    incident: {
      bg: 'bg-status-incident-bg',
      text: 'text-status-incident',
      dot: 'bg-status-incident',
      label: 'Incident Active'
    },
    offline: {
      bg: 'bg-status-neutral-bg',
      text: 'text-status-neutral',
      dot: 'bg-status-neutral',
      label: 'Offline'
    },
    unknown: {
      bg: 'bg-status-neutral-bg',
      text: 'text-status-neutral',
      dot: 'bg-status-neutral',
      label: 'Unknown'
    }
  };

  const { bg, text, dot, label } = config[status];

  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-label-sm border border-transparent',
      bg,
      text,
      className
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', dot)} />
      {label}
    </div>
  );
};
