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
  className 
}: { 
  progress: number; 
  status?: 'info' | 'success' | 'error' | 'warning';
  className?: string;
}) => {
  const colors = {
    info: 'bg-status-info',
    success: 'bg-status-healthy',
    error: 'bg-status-incident',
    warning: 'bg-status-degraded',
  };

  return (
    <div className={cn("w-full h-1 bg-surface-border rounded-full overflow-hidden", className)}>
      <div 
        className={cn("h-full transition-all duration-500", colors[status])}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
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
