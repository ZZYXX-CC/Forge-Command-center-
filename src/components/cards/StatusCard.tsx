import React from 'react';
import { cn } from '@/src/lib/utils';
import { StatusBadge } from '../primitives/StatusBadge';
import { SystemStatus } from '@/src/types';
import { FreshnessIndicator } from '../primitives/FreshnessIndicator';

interface StatusCardProps {
  label: string;
  title: string;
  status: SystemStatus;
  timestamp: string;
  children: React.ReactNode;
  footerAction?: React.ReactNode;
  onFooterActionClick?: () => void;
  className?: string;
  isLoading?: boolean;
  error?: string;
  isStale?: boolean;
  isUnavailable?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  label,
  title,
  status,
  timestamp,
  children,
  footerAction,
  onFooterActionClick,
  className,
  isLoading,
  error,
  isStale,
  isUnavailable,
  isEmpty,
  emptyMessage = "No data available for this domain."
}) => {
  if (isLoading) {
    return (
      <div className={cn("bg-surface-raised border border-surface-border rounded-md p-4 space-y-4", className)}>
        <div className="flex justify-between items-center">
          <div className="h-3 w-24 skeleton rounded-sm" />
          <div className="h-5 w-20 skeleton rounded-full" />
        </div>
        <div className="h-6 w-48 skeleton rounded-sm" />
        <div className="space-y-4">
          <div className="h-12 w-full skeleton rounded-md" />
          <div className="h-12 w-full skeleton rounded-md" />
        </div>
        <div className="h-4 w-32 skeleton rounded-sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "bg-surface-raised border-l-2 border-status-incident rounded-md p-4 space-y-4",
        className
      )}>
        <div className="text-label-sm text-status-incident font-bold">ERROR</div>
        <div className="text-body-md text-text-primary">{error}</div>
        <button className="px-3 py-1 bg-surface-overlay border border-surface-border rounded-md text-label-sm hover:bg-surface-hover transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-surface-raised border border-surface-border rounded-md flex flex-col transition-all group hover:shadow-hover focus-within:shadow-focus",
      isStale && "border-l-2 border-status-degraded",
      isUnavailable && "opacity-80",
      className
    )}>
      {/* Header */}
      <div className="p-4 pb-2 flex justify-between items-start">
        <span className="text-label-sm">{label}</span>
        <div className="flex items-center gap-2">
          {isStale && (
            <span className="text-label-sm font-bold text-status-degraded">⚠ STALE</span>
          )}
          <StatusBadge status={isUnavailable ? 'unknown' : status} />
        </div>
      </div>

      {/* Title */}
      <div className="px-4 pb-4">
        <h3 className="text-heading-md">{title}</h3>
      </div>

      {/* Content */}
      <div className="px-4 flex-1 flex flex-col">
        {isUnavailable ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
            <div className="text-display-lg text-text-muted mb-2">UNAVAILABLE</div>
            <div className="text-body-sm italic text-text-muted">
              System connection lost — last known: <FreshnessIndicator timestamp={timestamp} className="inline-flex" />
            </div>
          </div>
        ) : isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center border border-dashed border-surface-border rounded-md bg-surface-base/50">
            <div className="text-body-sm text-text-muted">{emptyMessage}</div>
          </div>
        ) : (
          children
        )}
      </div>

      {/* Footer */}
      <div className="p-4 pt-2 mt-auto border-t border-surface-border flex justify-between items-center">
        <FreshnessIndicator timestamp={timestamp} className={isStale ? "text-status-degraded" : ""} />
        {footerAction && (
          <div 
            onClick={onFooterActionClick}
            className="text-accent-primary hover:text-accent-dim transition-colors cursor-pointer text-label-sm font-bold"
          >
            {footerAction}
          </div>
        )}
      </div>
    </div>
  );
};
