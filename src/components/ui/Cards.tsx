import React, { useState } from 'react';
import { cn } from '@/src/lib/utils';
import { ForgeIcon } from './ForgeIcon';
import { StatusDot, DeltaIndicator, Label } from './Primitives';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'raised' | 'overlay' | 'base';
  border?: boolean;
}

export const Card = ({ 
  children, 
  className, 
  variant = 'raised', 
  border = true 
}: CardProps) => {
  const variants = {
    raised: 'bg-surface-raised',
    overlay: 'bg-surface-overlay',
    base: 'bg-surface-base',
  };

  return (
    <div className={cn(
      "rounded-lg overflow-hidden transition-all",
      variants[variant],
      border && "border border-surface-border",
      className
    )}>
      {children}
    </div>
  );
};

export const CardHeader = ({ 
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
  <div className={cn("px-4 py-3 border-b border-surface-border flex items-center justify-between", className)}>
    <div className="flex items-center gap-3">
      {icon && <ForgeIcon name={icon} size={18} className="text-emerald-accent" />}
      <div className="flex flex-col">
        <h3 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">{title}</h3>
        {subtitle && <span className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">{subtitle}</span>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

export const CardFooter = ({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) => (
  <div className={cn("px-4 py-3 border-t border-surface-border bg-surface-base/30", className)}>
    {children}
  </div>
);

export const KPICard = ({ 
  label, 
  value, 
  delta, 
  status = 'healthy', 
  icon,
  className 
}: { 
  label: string; 
  value: string | number; 
  delta?: number; 
  status?: 'healthy' | 'degraded' | 'incident' | 'info' | 'neutral';
  icon?: string;
  className?: string;
}) => (
  <Card className={cn("p-4 group hover:border-emerald-accent/30 transition-all", className)}>
    <div className="flex items-center justify-between mb-2">
      <Label size="xs">{label}</Label>
      {icon && <ForgeIcon name={icon} size={16} className="text-text-muted group-hover:text-emerald-accent transition-colors" />}
    </div>
    <div className="flex items-end justify-between">
      <div className="flex flex-col">
        <div className="text-heading-lg font-mono text-text-mono leading-none">{value}</div>
        {delta !== undefined && <DeltaIndicator value={delta} className="mt-1" />}
      </div>
      <StatusDot status={status} size="lg" pulse={status === 'incident'} />
    </div>
  </Card>
);

export const StatRow = ({ 
  label, 
  value, 
  status,
  className 
}: { 
  label: string; 
  value: React.ReactNode; 
  status?: 'healthy' | 'degraded' | 'incident' | 'info' | 'neutral';
  className?: string; 
}) => (
  <div className={cn("flex items-center justify-between py-2 border-b border-surface-border last:border-none", className)}>
    <div className="flex items-center gap-2">
      {status && <StatusDot status={status} size="sm" />}
      <span className="text-label-xs font-bold text-text-secondary uppercase">{label}</span>
    </div>
    <div className="text-label-xs font-mono text-text-mono">{value}</div>
  </div>
);

export const BentoCard = ({
  title,
  subtitle,
  children,
  className,
  icon,
  badge
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  icon?: string;
  badge?: React.ReactNode;
}) => (
  <Card className={cn("flex flex-col group relative overflow-hidden", className)}>
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
      {icon && <ForgeIcon name={icon} size={80} />}
    </div>
    <div className="p-6 flex-1 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-heading-md font-bold text-text-primary uppercase tracking-widest">{title}</h3>
          {subtitle && <p className="text-label-xs text-text-muted mt-1 uppercase">{subtitle}</p>}
        </div>
        {badge}
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  </Card>
);

export const ExpandableRow = ({ 
  header, 
  children,
  className 
}: { 
  header: React.ReactNode; 
  children: React.ReactNode;
  className?: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={cn("border-b border-surface-border last:border-none", className)}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-4 py-3 px-4 hover:bg-surface-hover transition-colors text-left"
      >
        <ForgeIcon 
          name="alt-arrow-right" 
          size={14} 
          className={cn("text-text-muted transition-transform", isExpanded && "rotate-90 text-emerald-accent")} 
        />
        <div className="flex-1">{header}</div>
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};
