import React from 'react';
import { cn } from '@/src/lib/utils';
import { WebOpsKPIs } from '@/src/types/webOps';
import { ForgeIcon } from '../primitives/ForgeIcon';

interface WebOpsKPIStripProps {
  kpis: WebOpsKPIs;
  activeFilter: string | null;
  onFilterClick: (filter: string | null) => void;
}

export const WebOpsKPIStrip: React.FC<WebOpsKPIStripProps> = ({ kpis, activeFilter, onFilterClick }) => {
  const items = [
    { 
      id: 'sites-up',
      label: 'SITES UP', 
      value: `${kpis.sitesUp} / ${kpis.sitesTotal}`, 
      delta: kpis.uptimeDelta, 
      status: kpis.sitesUp < kpis.sitesTotal ? 'degraded' : 'healthy',
      subLabel: `${Math.abs(kpis.sitesTotal - kpis.sitesUp)} site down`
    },
    { 
      id: 'uptime',
      label: 'UPTIME 24H', 
      value: `${kpis.uptimePct24H}%`, 
      delta: kpis.uptimeDelta, 
      status: kpis.uptimePct24H < 99 ? 'degraded' : 'healthy',
      subLabel: `${kpis.uptimeDelta > 0 ? '↑' : '↓'} ${Math.abs(kpis.uptimeDelta)}%`
    },
    { 
      id: 'sessions',
      label: 'ACTIVE SESSIONS', 
      value: kpis.activeSessions.toLocaleString(), 
      delta: kpis.sessionsDelta, 
      status: 'healthy',
      subLabel: `${kpis.sessionsDelta > 0 ? '↑' : '↓'} ${Math.abs(kpis.sessionsDelta)} vs 1H`
    },
    { 
      id: 'errors',
      label: '5XX ERRORS', 
      value: kpis.errors5xx1H.toString(), 
      delta: -kpis.errorsDelta, // Delta is positive for more errors, which is bad
      status: kpis.errors5xx1H > 0 ? 'degraded' : 'healthy',
      subLabel: `${kpis.errorsDelta > 0 ? '↑' : '↓'} +${Math.abs(kpis.errorsDelta)} vs 1H`
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => {
        const isActive = activeFilter === item.id;
        const isPositive = item.delta >= 0;
        
        return (
          <button
            key={item.id}
            onClick={() => onFilterClick(isActive ? null : item.id)}
            className={cn(
              "flex flex-col p-4 bg-surface-raised border rounded-lg transition-all text-left group",
              isActive 
                ? "border-emerald-accent bg-emerald-subtle-bg shadow-sm" 
                : "border-surface-border hover:border-emerald-accent/50"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{item.label}</span>
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                item.status === 'healthy' ? "bg-status-healthy shadow-[0_0_8px_rgba(95,184,122,0.5)]" : 
                item.status === 'degraded' ? "bg-status-degraded shadow-[0_0_8px_rgba(212,168,71,0.5)]" : 
                "bg-status-incident shadow-[0_0_8px_rgba(201,95,95,0.5)]"
              )} />
            </div>
            
            <div className="text-heading-lg font-mono text-text-primary mb-1">
              {item.value}
            </div>
            
            <div className="flex items-center gap-1.5">
              {isPositive ? (
                <ForgeIcon name="graph-up" size="xs" className={cn(item.id === 'errors' ? "text-status-incident" : "text-status-healthy")} />
              ) : (
                <ForgeIcon name="graph-down" size="xs" className={cn(item.id === 'errors' ? "text-status-healthy" : "text-status-incident")} />
              )}
              <span className={cn(
                "text-[10px] font-bold uppercase",
                item.id === 'errors' 
                  ? (item.delta > 0 ? "text-status-healthy" : "text-status-incident")
                  : (item.delta > 0 ? "text-status-healthy" : "text-status-incident")
              )}>
                {item.subLabel}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
