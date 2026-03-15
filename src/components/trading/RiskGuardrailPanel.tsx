import React, { useState } from 'react';
import { cn } from '@/src/lib/utils';
import { RiskConfig } from '@/src/types/trading';
import { ForgeIcon } from '@/src/components/primitives/ForgeIcon';

interface RiskGuardrailPanelProps {
  risk: RiskConfig;
}

export const RiskGuardrailPanel: React.FC<RiskGuardrailPanelProps> = ({ risk }) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleKillSwitch = () => {
    // In a real app, this would call an API
    console.log('KILL SWITCH ACTIVATED');
    setIsConfirming(false);
  };

  return (
    <div className="bg-surface-raised border border-surface-border rounded-lg flex flex-col h-full relative">
      <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ForgeIcon name="shield-minimalistic" size="sm" className="text-emerald-accent" />
          <span className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Risk Guardrails</span>
        </div>
        <div className={cn(
          "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
          risk.circuitBreakerStatus === 'active' ? "bg-status-healthy/10 text-status-healthy" : "bg-status-incident/10 text-status-incident animate-pulse"
        )}>
          {risk.circuitBreakerStatus}
        </div>
      </div>

      <div className="flex-1 p-4 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted uppercase">Max Risk / Trade</span>
              <span className="text-heading-sm font-mono text-text-primary">{risk.maxRiskPerTrade}%</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-text-muted uppercase">Max Positions</span>
              <span className="text-heading-sm font-mono text-text-primary">{risk.maxOpenPositions}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted uppercase">Daily Loss Limit</span>
              <span className="text-heading-sm font-mono text-status-incident">-${risk.dailyLossLimit.toLocaleString()}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-text-muted uppercase">Circuit Breaker</span>
              <span className="text-heading-sm font-mono text-status-healthy">AUTO</span>
            </div>
          </div>
        </div>

        <div className="h-px bg-surface-border" />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-label-sm text-text-secondary">Kill Switch Status</span>
            <span className={cn(
              "text-[10px] font-bold uppercase",
              risk.killSwitchEnabled ? "text-status-incident" : "text-text-muted"
            )}>
              {risk.killSwitchEnabled ? 'ARMED' : 'DISARMED'}
            </span>
          </div>
          
          <button 
            onClick={() => setIsConfirming(true)}
            className={cn(
              "w-full py-3 rounded-md flex items-center justify-center gap-2 transition-all",
              "bg-status-incident/10 border border-status-incident/30 text-status-incident hover:bg-status-incident/20 font-bold uppercase text-label-sm"
            )}
          >
            <ForgeIcon name="restart" size="xs" />
            Emergency Kill Switch
          </button>
          <p className="text-[10px] text-text-muted text-center italic">
            Closes all positions and cancels all open orders immediately.
          </p>
        </div>
      </div>

      <div className="px-4 py-2 bg-surface-base/30 border-t border-surface-border">
        <div className="flex items-center gap-2 text-status-degraded">
          <ForgeIcon name="danger-triangle" size="xs" />
          <span className="text-[10px] uppercase font-bold">Next Action: Review daily loss limit threshold</span>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirming && (
        <div className="absolute inset-0 z-50 bg-surface-base/90 backdrop-blur-sm flex items-center justify-center p-4 rounded-lg">
          <div className="bg-surface-overlay border border-status-incident rounded-lg p-6 w-full max-w-xs shadow-raised flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-status-incident">
                <ForgeIcon name="danger-triangle" size="sm" />
                <span className="text-label-md font-bold uppercase tracking-wider">Confirm Kill</span>
              </div>
              <button onClick={() => setIsConfirming(false)} className="text-text-muted hover:text-text-primary">
                <ForgeIcon name="close-circle" size="sm" />
              </button>
            </div>
            
            <p className="text-body-sm text-text-secondary">
              Are you sure you want to activate the <span className="text-status-incident font-bold">Emergency Kill Switch</span>?
            </p>
            
            <div className="flex flex-col gap-2 mt-2">
              <button 
                onClick={handleKillSwitch}
                className="w-full py-2 bg-status-incident text-text-inverse rounded font-bold uppercase text-label-sm hover:bg-status-incident/90 transition-colors"
              >
                Yes, Kill All Operations
              </button>
              <button 
                onClick={() => setIsConfirming(false)}
                className="w-full py-2 bg-surface-raised border border-surface-border text-text-primary rounded font-bold uppercase text-label-sm hover:bg-surface-hover transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
