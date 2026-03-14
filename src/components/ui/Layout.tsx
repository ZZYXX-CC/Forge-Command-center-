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

// --- Tabs ---
export const Tabs = ({ 
  tabs, 
  activeTab, 
  onChange,
  className 
}: { 
  tabs: { id: string; label: string; icon?: string }[]; 
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}) => (
  <div className={cn("flex items-center gap-1 p-1 bg-surface-base border border-surface-border rounded-lg", className)}>
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all",
          activeTab === tab.id 
            ? "bg-emerald-accent text-text-inverse shadow-sm" 
            : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
        )}
      >
        {tab.icon && <ForgeIcon name={tab.icon} size={14} />}
        {tab.label}
      </button>
    ))}
  </div>
);

// --- Accordion ---
export const Accordion = ({ 
  items,
  className 
}: { 
  items: { id: string; title: string; content: React.ReactNode; icon?: string }[];
  className?: string;
}) => {
  const [openId, setOpenId] = React.useState<string | null>(null);

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item) => (
        <div 
          key={item.id} 
          className="border border-surface-border rounded-lg bg-surface-raised/30 overflow-hidden"
        >
          <button
            onClick={() => setOpenId(openId === item.id ? null : item.id)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors"
          >
            <div className="flex items-center gap-3">
              {item.icon && <ForgeIcon name={item.icon} size={16} className="text-emerald-accent" />}
              <span className="text-label-sm font-bold text-text-primary uppercase tracking-wider">{item.title}</span>
            </div>
            <ForgeIcon 
              name="alt-arrow-down" 
              size={14} 
              className={cn("text-text-muted transition-transform", openId === item.id && "rotate-180 text-emerald-accent")} 
            />
          </button>
          {openId === item.id && (
            <div className="px-4 pb-4 pt-1 animate-in slide-in-from-top-2 duration-200">
              <div className="text-body-sm text-text-secondary">
                {item.content}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// --- EmptyState ---
export const EmptyState = ({ 
  title, 
  description, 
  icon = 'ghost',
  action,
  className 
}: { 
  title: string; 
  description?: string; 
  icon?: string;
  action?: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-surface-border rounded-2xl bg-surface-raised/20", className)}>
    <div className="w-16 h-16 rounded-full bg-surface-base flex items-center justify-center mb-4 border border-surface-border shadow-sm">
      <ForgeIcon name={icon} size={32} className="text-text-muted" />
    </div>
    <h3 className="text-heading-md font-bold text-text-primary uppercase tracking-widest">{title}</h3>
    {description && <p className="text-body-sm text-text-muted mt-2 max-w-xs mx-auto">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

// --- Breadcrumbs ---
export const Breadcrumbs = ({ 
  items,
  className 
}: { 
  items: { label: string; href?: string; icon?: string }[];
  className?: string;
}) => (
  <nav className={cn("flex items-center gap-2", className)}>
    {items.map((item, i) => (
      <React.Fragment key={i}>
        <div className="flex items-center gap-1.5 group">
          {item.icon && <ForgeIcon name={item.icon} size={12} className="text-text-muted group-hover:text-emerald-accent transition-colors" />}
          {item.href ? (
            <a href={item.href} className="text-[10px] font-bold text-text-muted hover:text-text-primary uppercase tracking-widest transition-colors">
              {item.label}
            </a>
          ) : (
            <span className="text-[10px] font-bold text-text-primary uppercase tracking-widest">
              {item.label}
            </span>
          )}
        </div>
        {i < items.length - 1 && (
          <ForgeIcon name="alt-arrow-right" size={10} className="text-text-muted/50" />
        )}
      </React.Fragment>
    ))}
  </nav>
);

// --- Stepper ---
export const Stepper = ({ 
  steps, 
  currentStep,
  className 
}: { 
  steps: { label: string; description?: string }[]; 
  currentStep: number;
  className?: string;
}) => (
  <div className={cn("flex items-start justify-between w-full", className)}>
    {steps.map((step, i) => {
      const isCompleted = i < currentStep;
      const isActive = i === currentStep;
      
      return (
        <div key={i} className="flex flex-col items-center flex-1 relative group">
          {/* Connector Line */}
          {i < steps.length - 1 && (
            <div className={cn(
              "absolute top-4 left-[50%] right-[-50%] h-px bg-surface-border z-0",
              isCompleted && "bg-emerald-accent/50"
            )} />
          )}
          
          {/* Step Circle */}
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-300",
            isCompleted ? "bg-emerald-accent border-emerald-accent text-text-inverse" :
            isActive ? "bg-surface-base border-emerald-accent text-emerald-accent shadow-glow" :
            "bg-surface-base border-surface-border text-text-muted"
          )}>
            {isCompleted ? (
              <ForgeIcon name="check-circle" size={16} />
            ) : (
              <span className="text-xs font-bold font-mono">{i + 1}</span>
            )}
          </div>
          
          {/* Step Label */}
          <div className="mt-3 text-center px-2">
            <div className={cn(
              "text-[10px] font-bold uppercase tracking-widest transition-colors",
              isActive ? "text-emerald-accent" : isCompleted ? "text-text-primary" : "text-text-muted"
            )}>
              {step.label}
            </div>
            {step.description && (
              <div className="text-[9px] text-text-muted mt-0.5 max-w-[100px] mx-auto leading-tight">
                {step.description}
              </div>
            )}
          </div>
        </div>
      );
    })}
  </div>
);
