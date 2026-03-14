import React, { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { ForgeIcon } from './ForgeIcon';

// --- Badge ---
export const Badge = ({ 
  children, 
  variant = 'neutral',
  className 
}: { 
  children: React.ReactNode; 
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'emerald';
  className?: string;
}) => {
  const variants = {
    neutral: 'bg-surface-border text-text-muted',
    success: 'bg-status-healthy-bg text-status-healthy',
    warning: 'bg-status-degraded-bg text-status-degraded',
    error: 'bg-status-incident-bg text-status-incident',
    info: 'bg-status-info-bg text-status-info',
    emerald: 'bg-emerald-accent-bg text-emerald-accent',
  };

  return (
    <span className={cn(
      "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};

// --- Kbd ---
export const Kbd = ({ 
  children,
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) => (
  <kbd className={cn(
    "px-1.5 py-0.5 rounded bg-surface-raised border border-surface-border text-[10px] font-mono text-text-muted shadow-sm",
    className
  )}>
    {children}
  </kbd>
);

// --- CountdownTimer ---
export const CountdownTimer = ({ 
  seconds, 
  onComplete,
  className 
}: { 
  seconds: number; 
  onComplete?: () => void;
  className?: string;
}) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete?.();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className={cn("inline-flex items-center gap-1.5 font-mono text-text-primary", className)}>
      <ForgeIcon name="clock-circle" size={14} className="text-text-muted" />
      <span>{mins}:{secs.toString().padStart(2, '0')}</span>
    </div>
  );
};

// --- Spinner ---
export const Spinner = ({ 
  size = 'md', 
  className 
}: { 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) => {
  const sizes = { sm: 14, md: 24, lg: 40 };
  return (
    <ForgeIcon 
      name="refresh" 
      size={sizes[size]} 
      className={cn("text-emerald-accent animate-spin", className)} 
    />
  );
};

// --- ProgressBar ---
export const ProgressBar = ({ 
  progress, 
  status = 'info',
  label,
  className 
}: { 
  progress: number; 
  status?: 'info' | 'success' | 'error' | 'warning';
  label?: string;
  className?: string;
}) => {
  const colors = {
    info: 'bg-status-info',
    success: 'bg-status-healthy',
    error: 'bg-status-incident',
    warning: 'bg-status-degraded',
  };

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {label && (
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest">
          <span className="text-text-secondary">{label}</span>
          <span className="text-text-primary">{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full h-1 bg-surface-border rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-500", colors[status])}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};

// --- PulsingDot ---
export const PulsingDot = ({ 
  color = 'emerald',
  className 
}: { 
  color?: 'emerald' | 'red' | 'amber' | 'blue';
  className?: string;
}) => {
  const colors = {
    emerald: 'bg-emerald-accent',
    red: 'bg-status-incident',
    amber: 'bg-status-degraded',
    blue: 'bg-status-info',
  };

  return (
    <div className={cn("relative flex h-2 w-2", className)}>
      <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", colors[color])}></span>
      <span className={cn("relative inline-flex rounded-full h-2 w-2", colors[color])}></span>
    </div>
  );
};

// --- Toast ---
export const Toast = ({ 
  message, 
  status = 'info', 
  onClose,
  className 
}: { 
  message: string; 
  status?: 'success' | 'warning' | 'error' | 'info';
  onClose?: () => void;
  className?: string;
}) => {
  const statusStyles = {
    success: 'border-status-healthy/30 bg-status-healthy/10 text-status-healthy',
    warning: 'border-status-degraded/30 bg-status-degraded/10 text-status-degraded',
    error: 'border-status-incident/30 bg-status-incident/10 text-status-incident',
    info: 'border-status-info/30 bg-status-info/10 text-status-info',
  };

  const icons = {
    success: 'check-circle',
    warning: 'shield-warning',
    error: 'fire',
    info: 'info-circle',
  };

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-md shadow-raised animate-in slide-in-from-right-full duration-300",
      statusStyles[status],
      className
    )}>
      <ForgeIcon name={icons[status]} size={18} />
      <span className="text-label-sm font-bold uppercase tracking-wider flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity">
          <ForgeIcon name="close-circle" size={16} />
        </button>
      )}
    </div>
  );
};

// --- Notification ---
export const Notification = ({ 
  title, 
  message, 
  timestamp,
  icon = 'info-circle',
  unread = false,
  className 
}: { 
  title: string; 
  message: string; 
  timestamp?: string;
  icon?: string;
  unread?: boolean;
  className?: string;
}) => (
  <div className={cn(
    "p-4 rounded-xl border border-surface-border bg-surface-raised/50 hover:bg-surface-hover transition-all group relative",
    unread && "border-emerald-accent/30 bg-emerald-accent/5",
    className
  )}>
    {unread && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-accent animate-pulse" />}
    <div className="flex gap-4">
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-surface-border bg-surface-base",
        unread && "border-emerald-accent/20"
      )}>
        <ForgeIcon name={icon} size={20} className={unread ? "text-emerald-accent" : "text-text-muted"} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-label-sm font-bold text-text-primary uppercase tracking-wider truncate">{title}</h4>
          {timestamp && <span className="text-[9px] font-mono text-text-muted uppercase">{timestamp}</span>}
        </div>
        <p className="text-body-sm text-text-secondary line-clamp-2">{message}</p>
      </div>
    </div>
  </div>
);
