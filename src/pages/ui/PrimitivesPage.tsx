import React from 'react';
import { 
  StatusDot, 
  StatusBadge, 
  ModeChip, 
  SeverityChip, 
  PriorityBadge, 
  LiveIndicator, 
  Badge, 
  Kbd, 
  MonoText,
  Label,
  ForgeIcon
} from '@/src/components/ui';

export const PrimitivesPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-base overflow-y-auto p-6 space-y-8">
      <div>
        <h1 className="text-display-sm font-bold text-text-primary uppercase tracking-tighter">Primitives</h1>
        <p className="text-text-secondary text-label-md">Atomic building blocks of the FORGE interface.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <section className="space-y-4">
          <Label className="text-text-muted uppercase tracking-widest text-[10px]">Status Indicators</Label>
          <div className="bg-surface-raised border border-surface-border p-6 rounded-xl space-y-6">
            <div className="flex flex-wrap gap-6 items-center">
              <StatusDot status="healthy" size="lg" />
              <StatusDot status="degraded" size="lg" />
              <StatusDot status="incident" size="lg" pulse />
              <StatusDot status="info" size="lg" />
              <StatusDot status="neutral" size="lg" />
            </div>
            <div className="flex flex-wrap gap-3">
              <StatusBadge status="healthy" />
              <StatusBadge status="degraded" />
              <StatusBadge status="incident" />
              <StatusBadge status="info" />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <Label className="text-text-muted uppercase tracking-widest text-[10px]">Chips & Badges</Label>
          <div className="bg-surface-raised border border-surface-border p-6 rounded-xl space-y-6">
            <div className="flex flex-wrap gap-3">
              <ModeChip mode="Production" active />
              <ModeChip mode="Staging" />
              <SeverityChip severity="critical" />
              <SeverityChip severity="high" />
              <PriorityBadge priority="P0" />
              <PriorityBadge priority="P3" />
            </div>
            <div className="flex flex-wrap gap-3">
              <LiveIndicator />
              <Badge variant="emerald">New Feature</Badge>
              <Badge variant="warning">Stale</Badge>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <Label className="text-text-muted uppercase tracking-widest text-[10px]">Typography & Utilities</Label>
          <div className="bg-surface-raised border border-surface-border p-6 rounded-xl space-y-6">
            <div className="flex items-center gap-4">
              <MonoText color="emerald">0x8842</MonoText>
              <Kbd>⌘K</Kbd>
            </div>
            <div className="flex items-center gap-4">
              <ForgeIcon name="home-smile" size="md" className="text-text-primary" />
              <ForgeIcon name="graph-new" size="md" className="text-emerald-accent" />
              <ForgeIcon name="fire" size="md" className="text-status-incident" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrimitivesPage;
