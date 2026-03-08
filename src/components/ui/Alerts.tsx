import React from 'react';
import { cn } from '@/src/lib/utils';
import { ForgeIcon } from './ForgeIcon';
import { Button } from './Buttons';

// --- AlertBanner ---
export const AlertBanner = ({ 
  title, 
  message, 
  status = 'info',
  onClose,
  className 
}: { 
  title: string; 
  message: string; 
  status?: 'info' | 'warning' | 'error' | 'success';
  onClose?: () => void;
  className?: string;
}) => {
  const styles = {
    info: 'bg-status-info/10 border-status-info text-status-info',
    warning: 'bg-status-degraded/10 border-status-degraded text-status-degraded',
    error: 'bg-status-incident/10 border-status-incident text-status-incident',
    success: 'bg-status-healthy/10 border-status-healthy text-status-healthy',
  };

  const icons = {
    info: 'info-circle',
    warning: 'shield-warning',
    error: 'danger-triangle',
    success: 'check-circle',
  };

  return (
    <div className={cn(
      "p-4 border-l-4 rounded-r-lg flex items-start gap-4 animate-in slide-in-from-top-4 duration-300",
      styles[status],
      className
    )}>
      <ForgeIcon name={icons[status]} size={20} />
      <div className="flex-1">
        <h4 className="text-label-sm font-bold uppercase tracking-wider mb-1">{title}</h4>
        <p className="text-body-sm opacity-90">{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity">
          <ForgeIcon name="close-circle" size={18} />
        </button>
      )}
    </div>
  );
};

// --- InlineAlert ---
export const InlineAlert = ({ 
  message, 
  status = 'info',
  className 
}: { 
  message: string; 
  status?: 'info' | 'warning' | 'error' | 'success';
  className?: string;
}) => {
  const styles = {
    info: 'text-status-info',
    warning: 'text-status-degraded',
    error: 'text-status-incident',
    success: 'text-status-healthy',
  };

  const icons = {
    info: 'info-circle',
    warning: 'shield-warning',
    error: 'danger-triangle',
    success: 'check-circle',
  };

  return (
    <div className={cn("flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest", styles[status], className)}>
      <ForgeIcon name={icons[status]} size={12} />
      {message}
    </div>
  );
};

// --- IncidentBanner ---
export const IncidentBanner = ({ 
  title, 
  id,
  className 
}: { 
  title: string; 
  id: string;
  className?: string;
}) => (
  <div className={cn(
    "w-full bg-status-incident text-text-inverse px-6 py-3 flex items-center justify-between animate-pulse",
    className
  )}>
    <div className="flex items-center gap-4">
      <ForgeIcon name="fire" size={20} />
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Active Incident</span>
        <h3 className="text-label-md font-bold uppercase tracking-widest">{title}</h3>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <span className="text-label-sm font-mono font-bold">{id}</span>
      <Button variant="secondary" size="xs" className="bg-white/20 border-white/30 hover:bg-white/30 text-white">
        Join Incident Room
      </Button>
    </div>
  </div>
);

// --- ConfirmDialog ---
export const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmLabel = "Confirm",
  destructive = false 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string; 
  confirmLabel?: string;
  destructive?: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-base/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-overlay border border-surface-border rounded-lg shadow-raised p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <ForgeIcon 
            name={destructive ? "danger-triangle" : "info-circle"} 
            size={24} 
            className={destructive ? "text-status-incident" : "text-emerald-accent"} 
          />
          <h3 className="text-heading-md font-bold uppercase tracking-widest text-text-primary">{title}</h3>
        </div>
        <p className="text-body-md text-text-secondary mb-8 leading-relaxed">
          {message}
        </p>
        <div className="flex items-center gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button 
            variant={destructive ? 'danger' : 'primary'} 
            onClick={() => { onConfirm(); onClose(); }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
