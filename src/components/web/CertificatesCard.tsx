import React from 'react';
import { cn } from '@/src/lib/utils';
import { Certificate } from '@/src/types/webOps';
import { format } from 'date-fns';
import { ForgeIcon } from '../primitives/ForgeIcon';

interface CertificatesCardProps {
  certificates: Certificate[];
}

export const CertificatesCard: React.FC<CertificatesCardProps> = ({ certificates }) => {
  return (
    <div className="bg-surface-raised border border-surface-border rounded-lg flex flex-col h-full">
      <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
        <span className="text-label-sm font-bold text-text-primary uppercase tracking-wider">SSL Certificates</span>
        <span className="text-[10px] font-bold text-text-muted uppercase">{certificates.length} Active</span>
      </div>
      
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {certificates.map((cert, i) => {
          const isCritical = cert.daysRemaining < 15;
          const isWarning = cert.daysRemaining < 60;
          
          return (
            <div key={i} className="p-3 bg-surface-base/50 rounded border border-surface-border/50 hover:border-surface-border transition-colors group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isCritical ? (
                    <ForgeIcon name="shield-warning" size="sm" className="text-status-incident animate-pulse" />
                  ) : isWarning ? (
                    <ForgeIcon name="shield-warning" size="sm" className="text-status-degraded" />
                  ) : (
                    <ForgeIcon name="shield-check" size="sm" className="text-status-healthy" />
                  )}
                  <span className="text-label-xs font-bold text-text-primary font-mono">{cert.domain}</span>
                </div>
                <div className={cn(
                  "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                  cert.autoRenew ? "bg-status-healthy/10 text-status-healthy" : "bg-surface-border text-text-muted"
                )}>
                  Auto: {cert.autoRenew ? 'ON' : 'OFF'}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] text-text-muted uppercase">Expires</span>
                  <span className="text-[10px] font-mono text-text-secondary">
                    {format(new Date(cert.expiresAt), 'MMM dd yyyy')}
                  </span>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className="text-[9px] text-text-muted uppercase">Remaining</span>
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "text-label-xs font-mono font-bold",
                      cert.daysRemaining < 15 ? "text-status-incident" : 
                      cert.daysRemaining < 60 ? "text-status-degraded" : "text-status-healthy"
                    )}>
                      {cert.daysRemaining} days
                    </span>
                    {isCritical && (
                      <button className="p-1 bg-status-incident/10 text-status-incident rounded hover:bg-status-incident/20 transition-colors" title="Renew Now">
                        <ForgeIcon name="refresh" size="xs" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-2 text-[9px] text-text-muted uppercase tracking-tighter">
                Issuer: {cert.issuer}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="px-4 py-2 border-t border-surface-border bg-surface-base/30">
        <button className="text-[10px] font-bold text-emerald-accent uppercase hover:underline">Manage Certificates →</button>
      </div>
    </div>
  );
};
