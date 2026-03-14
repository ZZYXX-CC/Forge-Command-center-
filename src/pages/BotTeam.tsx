import React from 'react';
import { NeuralCommandMap } from '../components/ui/NeuralCommandMap';
import { Icon } from '@iconify/react';

export const BotTeam: React.FC = () => {
  return (
    <main className="flex-1 flex flex-row min-h-0 bg-surface-base overflow-hidden font-ui">
      {/* Left Sidebar - Global Intelligence */}
      <aside className="w-72 border-r border-surface-border bg-surface-raised/20 hidden xl:flex flex-col z-10">
        <div className="p-6 border-b border-surface-border">
          <div className="flex items-center gap-3 text-emerald-accent mb-1">
            <Icon icon="solar:globus-bold-duotone" width={20} />
            <h2 className="text-label-md font-bold uppercase tracking-widest">Global Intel</h2>
          </div>
          <p className="text-[10px] text-text-muted uppercase tracking-tighter">Neural Network Status: Nominal</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* System Health Section */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">System Health</h3>
            <div className="space-y-3">
              {[
                { label: 'Neural Sync', value: '99.8%', status: 'healthy' },
                { label: 'Data Throughput', value: '4.2 GB/s', status: 'healthy' },
                { label: 'Compute Load', value: '24%', status: 'healthy' },
                { label: 'Risk Level', value: 'LOW', status: 'healthy' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-[11px] text-text-secondary">{stat.label}</span>
                  <span className="text-[11px] font-mono text-text-mono">{stat.value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Events Section */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Recent Events</h3>
            <div className="space-y-4">
              {[
                { time: '13:42', event: 'MIGUEL optimized route for VAEL', type: 'info' },
                { time: '13:38', event: 'Security handshake successful', type: 'success' },
                { time: '13:30', event: 'Pipeline cluster re-balanced', type: 'info' },
              ].map((event, i) => (
                <div key={i} className="flex gap-3">
                  <div className="text-[9px] font-mono text-text-muted mt-0.5">{event.time}</div>
                  <div className="text-[10px] text-text-secondary leading-tight">{event.event}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Active Policies */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Active Policies</h3>
            <div className="p-3 bg-emerald-subtle-bg border border-emerald-subtle/30 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-accent mb-1">
                <Icon icon="solar:shield-check-bold-duotone" width={14} />
                <span className="text-[9px] font-bold uppercase">Compliance Active</span>
              </div>
              <p className="text-[10px] text-text-secondary leading-relaxed italic">
                "All cross-tier communication must be logged and audited."
              </p>
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-surface-border bg-surface-raised/30">
          <div className="flex items-center justify-between text-[10px] text-text-muted uppercase font-bold">
            <span>Uptime</span>
            <span className="text-text-mono">142:12:04</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 relative">
        <NeuralCommandMap />
      </div>
    </main>
  );
};
