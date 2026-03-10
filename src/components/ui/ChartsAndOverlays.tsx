import React from 'react';
import { cn } from '@/src/lib/utils';
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { ForgeIcon } from './ForgeIcon';

// --- SparkLine ---
export const SparkLine = ({ 
  data, 
  color = 'var(--emerald-accent)',
  height = 30,
  className 
}: { 
  data: { value: number }[]; 
  color?: string;
  height?: number;
  className?: string;
}) => (
  <div className={cn("w-full", className)} style={{ height }}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={1.5} 
          dot={false} 
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

// --- MiniBarChart ---
export const MiniBarChart = ({ 
  data, 
  height = 30,
  className 
}: { 
  data: { value: number; status?: string }[]; 
  height?: number;
  className?: string;
}) => (
  <div className={cn("w-full", className)} style={{ height }}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <Bar dataKey="value" isAnimationActive={false}>
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.status === 'error' ? 'var(--color-status-incident)' : 'var(--emerald-accent)'} 
              fillOpacity={0.6}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

// --- UptimeStrip ---
export const UptimeStrip = ({ 
  history, 
  className 
}: { 
  history: ('healthy' | 'degraded' | 'incident')[]; 
  className?: string;
}) => (
  <div className={cn("flex items-center gap-[2px] h-4", className)}>
    {history.map((status, i) => (
      <div 
        key={i}
        className={cn(
          "flex-1 h-full rounded-[1px] transition-all hover:scale-y-125",
          status === 'healthy' ? "bg-status-healthy/60 hover:bg-status-healthy" : 
          status === 'degraded' ? "bg-status-degraded/60 hover:bg-status-degraded" : 
          "bg-status-incident/60 hover:bg-status-incident"
        )}
        title={status}
      />
    ))}
  </div>
);

// --- Modal ---
export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  className 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
  className?: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-base/90 backdrop-blur-md" onClick={onClose} />
      <div className={cn(
        "relative w-full max-w-2xl bg-surface-overlay border border-surface-border rounded-xl shadow-raised flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200",
        className
      )}>
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
          <h3 className="text-heading-md font-bold uppercase tracking-widest text-text-primary">{title}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <ForgeIcon name="close-circle" size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Drawer ---
export const Drawer = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  side = 'right',
  className 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
  side?: 'left' | 'right';
  className?: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex justify-end">
      <div className="absolute inset-0 bg-surface-base/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        "relative w-full max-w-md bg-surface-overlay border-l border-surface-border h-full shadow-raised flex flex-col animate-in slide-in-from-right duration-300",
        side === 'left' && "mr-auto border-l-0 border-r slide-in-from-left",
        className
      )}>
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
          <h3 className="text-heading-md font-bold uppercase tracking-widest text-text-primary">{title}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <ForgeIcon name="close-circle" size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Tooltip ---
export const Tooltip = ({ 
  content, 
  children,
  className 
}: { 
  content: string; 
  children: React.ReactNode;
  className?: string;
}) => (
  <div className="relative group inline-block">
    {children}
    <div className={cn(
      "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-overlay border border-surface-border rounded text-[10px] font-bold uppercase tracking-widest text-text-primary whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-raised",
      className
    )}>
      {content}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-surface-border" />
    </div>
  </div>
);
