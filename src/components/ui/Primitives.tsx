import React from 'react';
import { cn } from '@/src/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ForgeIcon } from './ForgeIcon';

// --- StatusDot ---
export const StatusDot = ({ 
  status = 'healthy', 
  size = 'md', 
  pulse = false,
  className 
}: { 
  status?: 'healthy' | 'degraded' | 'incident' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}) => {
  const sizeClasses = { sm: 'w-1 h-1', md: 'w-1.5 h-1.5', lg: 'w-2 h-2' };
  const statusColors = {
    healthy: 'bg-status-healthy',
    degraded: 'bg-status-degraded',
    incident: 'bg-status-incident',
    info: 'bg-status-info',
    neutral: 'bg-status-neutral',
  };

  return (
    <div className={cn(
      "rounded-full shrink-0",
      sizeClasses[size],
      statusColors[status],
      pulse && "animate-pulse",
      className
    )} />
  );
};

// --- StatusBadge ---
export const StatusBadge = ({ 
  status = 'healthy', 
  label,
  className 
}: { 
  status?: 'healthy' | 'degraded' | 'incident' | 'info' | 'neutral';
  label?: string;
  className?: string;
}) => {
  const statusStyles = {
    healthy: 'bg-status-healthy-bg text-status-healthy border-status-healthy/20',
    degraded: 'bg-status-degraded-bg text-status-degraded border-status-degraded/20',
    incident: 'bg-status-incident-bg text-status-incident border-status-incident/20',
    info: 'bg-status-info-bg text-status-info border-status-info/20',
    neutral: 'bg-status-neutral-bg text-status-neutral border-status-neutral/20',
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest",
      statusStyles[status],
      className
    )}>
      <StatusDot status={status} size="sm" pulse={status === 'incident'} />
      {label || status}
    </div>
  );
};

// --- ModeChip ---
export const ModeChip = ({ 
  mode, 
  active = false,
  className 
}: { 
  mode: string;
  active?: boolean;
  className?: string;
}) => (
  <div className={cn(
    "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter border transition-all",
    active 
      ? "bg-emerald-accent text-text-inverse border-emerald-accent" 
      : "bg-surface-raised text-text-muted border-surface-border",
    className
  )}>
    {mode}
  </div>
);

// --- SeverityChip ---
export const SeverityChip = ({ 
  severity,
  className 
}: { 
  severity: 'critical' | 'high' | 'medium' | 'low';
  className?: string;
}) => {
  const styles = {
    critical: 'bg-status-incident text-text-inverse',
    high: 'bg-status-degraded text-text-inverse',
    medium: 'bg-status-info text-text-inverse',
    low: 'bg-surface-border text-text-muted',
  };
  return (
    <div className={cn(
      "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest",
      styles[severity],
      className
    )}>
      {severity}
    </div>
  );
};

// --- Label ---
export const Label = ({ 
  children, 
  size = 'xs',
  className 
}: { 
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) => {
  const sizeClasses = {
    xs: 'text-[9px] tracking-widest',
    sm: 'text-label-xs tracking-wider',
    md: 'text-label-sm tracking-wide',
  };
  return (
    <span className={cn(
      "font-bold text-text-muted uppercase",
      sizeClasses[size],
      className
    )}>
      {children}
    </span>
  );
};

// --- MonoText ---
export const MonoText = ({ 
  children, 
  color = 'primary',
  className 
}: { 
  children: React.ReactNode;
  color?: 'primary' | 'secondary' | 'muted' | 'emerald';
  className?: string;
}) => {
  const colorClasses = {
    primary: 'text-text-primary',
    secondary: 'text-text-secondary',
    muted: 'text-text-muted',
    emerald: 'text-text-mono',
  };
  return (
    <span className={cn(
      "font-mono",
      colorClasses[color],
      className
    )}>
      {children}
    </span>
  );
};

// --- DeltaIndicator ---
export const DeltaIndicator = ({ 
  value, 
  inverse = false,
  className 
}: { 
  value: number;
  inverse?: boolean;
  className?: string;
}) => {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  
  // Good/Bad depends on context (e.g. latency up is bad, uptime up is good)
  const isGood = inverse ? !isPositive : isPositive;
  
  if (isNeutral) return <span className={cn("text-[10px] font-mono text-text-muted", className)}>0%</span>;

  return (
    <div className={cn(
      "inline-flex items-center gap-0.5 text-[10px] font-mono",
      isGood ? "text-status-healthy" : "text-status-incident",
      className
    )}>
      <ForgeIcon 
        name={isPositive ? "arrow-right-up" : "arrow-right-down"} 
        size={10} 
        style="linear"
      />
      {Math.abs(value)}%
    </div>
  );
};

// --- FreshnessIndicator ---
export const FreshnessIndicator = ({ 
  timestamp,
  className 
}: { 
  timestamp: string | number | Date;
  className?: string;
}) => (
  <div className={cn("flex items-center gap-1.5 text-[9px] font-mono text-text-muted uppercase", className)}>
    <div className="w-1 h-1 rounded-full bg-status-healthy animate-pulse" />
    <span>Updated {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}</span>
  </div>
);

// --- PriorityBadge ---
export const PriorityBadge = ({ 
  priority,
  className 
}: { 
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  className?: string;
}) => {
  const styles = {
    P0: 'bg-status-incident/20 text-status-incident border-status-incident/30',
    P1: 'bg-status-degraded/20 text-status-degraded border-status-degraded/30',
    P2: 'bg-status-info/20 text-status-info border-status-info/30',
    P3: 'bg-surface-border text-text-muted border-transparent',
  };
  return (
    <div className={cn(
      "px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold",
      styles[priority],
      className
    )}>
      {priority}
    </div>
  );
};

// --- LiveIndicator ---
export const LiveIndicator = ({ 
  label = 'Live',
  className 
}: { 
  label?: string;
  className?: string;
}) => (
  <div className={cn(
    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-status-healthy/10 text-status-healthy text-[9px] font-bold uppercase tracking-widest border border-status-healthy/20",
    className
  )}>
    <div className="w-1 h-1 rounded-full bg-status-healthy animate-ping" />
    {label}
  </div>
);
