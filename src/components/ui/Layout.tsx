import React from 'react';
import { cn } from '@/src/lib/utils';
import { ForgeIcon } from './ForgeIcon';
import { StatusDot, Label, MonoText } from './Primitives';
import { Card } from './Cards';

// --- PageHeader ---
export const PageHeader = ({ 
  title, 
  subtitle, 
  icon, 
  actions,
  className 
}: { 
  title: string; 
  subtitle?: string; 
  icon?: string; 
  actions?: React.ReactNode;
  className?: string;
}) => (
  <header className={cn("px-6 py-4 border-b border-surface-border bg-surface-raised/50 backdrop-blur-md sticky top-0 z-30", className)}>
    <div className="max-w-[1400px] mx-auto flex items-center justify-between">
      <div className="flex items-center gap-4">
        {icon && <ForgeIcon name={icon} size={24} className="text-emerald-accent" />}
        <div className="flex flex-col">
          <h1 className="text-heading-lg text-text-primary font-bold tracking-tighter uppercase">{title}</h1>
          {subtitle && <span className="text-[10px] font-mono text-text-muted">{subtitle}</span>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  </header>
);

// --- SectionDivider ---
export const SectionDivider = ({ 
  label, 
  className 
}: { 
  label?: string; 
  className?: string;
}) => (
  <div className={cn("flex items-center gap-4 my-6", className)}>
    {label && <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest shrink-0">{label}</span>}
    <div className="h-px bg-surface-border flex-1" />
  </div>
);

// --- HealthStrip ---
export const HealthStrip = ({ 
  label, 
  status = 'healthy', 
  value,
  className 
}: { 
  label: string; 
  status?: 'healthy' | 'degraded' | 'incident' | 'info' | 'neutral';
  value?: string | number;
  className?: string;
}) => (
  <div className={cn(
    "flex items-center gap-3 px-3 py-1.5 rounded border border-surface-border bg-surface-raised/50",
    className
  )}>
    <StatusDot status={status} size="sm" pulse={status === 'incident'} />
    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{label}</span>
    {value && <span className="text-[10px] font-mono text-text-primary ml-auto">{value}</span>}
  </div>
);

// --- MetricGrid ---
export const MetricGrid = ({ 
  children, 
  cols = 4,
  className 
}: { 
  children: React.ReactNode; 
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}) => {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn("grid gap-4", colClasses[cols], className)}>
      {children}
    </div>
  );
};

// --- TagList ---
export const TagList = ({ 
  tags, 
  className 
}: { 
  tags: string[]; 
  className?: string;
}) => (
  <div className={cn("flex flex-wrap gap-1.5", className)}>
    {tags.map((tag, i) => (
      <span 
        key={i} 
        className="px-1.5 py-0.5 rounded bg-surface-border text-[9px] font-bold uppercase tracking-widest text-text-muted"
      >
        {tag}
      </span>
    ))}
  </div>
);

// --- CopyableValue ---
export const CopyableValue = ({ 
  value, 
  label,
  className 
}: { 
  value: string; 
  label?: string;
  className?: string;
}) => (
  <div className={cn("flex items-center gap-2 px-2 py-1 rounded bg-surface-base border border-surface-border", className)}>
    {label && <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest mr-1">{label}:</span>}
    <span className="text-[10px] font-mono text-text-primary truncate flex-1">{value}</span>
    <button 
      onClick={() => navigator.clipboard.writeText(value)}
      className="text-text-muted hover:text-emerald-accent transition-colors"
    >
      <ForgeIcon name="copy" size={12} />
    </button>
  </div>
);
