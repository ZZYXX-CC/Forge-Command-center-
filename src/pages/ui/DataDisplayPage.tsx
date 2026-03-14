import React from 'react';
import { 
  MetricGrid, 
  KPICard, 
  TagList, 
  CopyableValue, 
  UptimeStrip, 
  SparkLine,
  Label,
  MonoText,
  DeltaIndicator
} from '@/src/components/ui';

export const DataDisplayPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-base overflow-y-auto p-6 space-y-8">
      <div>
        <h1 className="text-display-sm font-bold text-text-primary uppercase tracking-tighter">Data Display</h1>
        <p className="text-text-secondary text-label-md">Visualization patterns for operational metrics.</p>
      </div>

      <div className="space-y-12">
        <section className="space-y-4">
          <Label className="text-text-muted uppercase tracking-widest text-[10px]">KPI Cards</Label>
          <MetricGrid cols={4}>
            <KPICard label="Uptime 24H" value="99.98%" delta={0.02} status="healthy" icon="pulse" />
            <KPICard label="Active Sessions" value="12.4k" delta={14} status="info" icon="users-group-two-rounded" />
            <KPICard label="Error Rate" value="0.04%" delta={-2} status="healthy" icon="bug" />
            <KPICard label="Latency p95" value="142ms" delta={8} status="degraded" icon="bolt" />
          </MetricGrid>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <section className="space-y-4">
            <Label className="text-text-muted uppercase tracking-widest text-[10px]">Metadata & Tags</Label>
            <div className="bg-surface-raised border border-surface-border p-6 rounded-xl space-y-6">
              <TagList tags={['Production', 'AWS', 'us-east-1', 'v2.4.1']} />
              <CopyableValue label="API_KEY" value="ak_live_51Mz9X..." />
              <div className="flex gap-4">
                <DeltaIndicator value={12.5} />
                <DeltaIndicator value={-4.2} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <Label className="text-text-muted uppercase tracking-widest text-[10px]">Time Series</Label>
            <div className="bg-surface-raised border border-surface-border p-6 rounded-xl space-y-6">
              <div className="space-y-2">
                <Label className="text-[9px]">UPTIME HISTORY</Label>
                <UptimeStrip history={['healthy', 'healthy', 'degraded', 'healthy', 'incident', 'healthy', 'healthy', 'healthy', 'healthy', 'healthy']} />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px]">PNL SPARKLINE</Label>
                <SparkLine data={Array.from({ length: 20 }, (_, i) => ({ value: Math.random() * 100 }))} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DataDisplayPage;
