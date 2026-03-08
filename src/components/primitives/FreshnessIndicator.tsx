import React from 'react';
import { cn } from '@/src/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface FreshnessIndicatorProps {
  timestamp: string;
  slaMinutes?: number;
  className?: string;
}

export const FreshnessIndicator: React.FC<FreshnessIndicatorProps> = ({ 
  timestamp, 
  slaMinutes = 5,
  className 
}) => {
  const date = new Date(timestamp);
  const diffMinutes = (Date.now() - date.getTime()) / (1000 * 60);
  
  let statusColor = 'bg-status-healthy';
  if (diffMinutes > slaMinutes * 2) {
    statusColor = 'bg-status-incident';
  } else if (diffMinutes > slaMinutes) {
    statusColor = 'bg-status-degraded';
  }

  return (
    <div className={cn('flex items-center gap-2 text-mono-sm text-text-muted', className)}>
      <div className={cn('w-2 h-2 rounded-full', statusColor)} />
      <span>Updated {formatDistanceToNow(date)} ago</span>
    </div>
  );
};
