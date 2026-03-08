import React, { useState } from 'react';
import { 
  PageHeader, 
  SectionDivider, 
  MetricGrid, 
  KPICard, 
  Card, 
  CardHeader, 
  CardFooter,
  StatRow,
  ForgeIcon,
  Button,
  IconButton,
  ActionButton,
  CopyButton,
  StatusDot,
  StatusBadge,
  ModeChip,
  SeverityChip,
  Label,
  MonoText,
  DeltaIndicator,
  FreshnessIndicator,
  PriorityBadge,
  LiveIndicator,
  TextInput,
  SearchInput,
  Select,
  Toggle,
  Checkbox,
  Badge,
  Kbd,
  CountdownTimer,
  Spinner,
  ProgressBar,
  PulsingDot,
  AlertBanner,
  InlineAlert,
  IncidentBanner,
  HealthStrip,
  TagList,
  CopyableValue,
  SparkLine,
  UptimeStrip,
  Modal,
  Drawer,
  Tooltip
} from '@/src/components/ui';

export const ComponentLibrary: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toggle, setToggle] = useState(true);
  const [check, setCheck] = useState(true);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-base overflow-y-auto pb-20">
      <PageHeader 
        title="Component Library" 
        subtitle="FORGE × NUVUE Design System v2.0" 
        icon="layers"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>Open Modal</Button>
            <Button variant="primary" size="sm" onClick={() => setIsDrawerOpen(true)}>Open Drawer</Button>
          </div>
        }
      />

      <div className="max-w-[1400px] mx-auto p-6 space-y-12">
        
        {/* Primitives */}
        <section>
          <SectionDivider label="Primitives" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-4">
              <Label>Status Indicators</Label>
              <div className="flex flex-wrap gap-4 items-center">
                <StatusDot status="healthy" size="lg" />
                <StatusDot status="degraded" size="lg" />
                <StatusDot status="incident" size="lg" pulse />
                <StatusDot status="info" size="lg" />
                <StatusDot status="neutral" size="lg" />
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status="healthy" />
                <StatusBadge status="degraded" />
                <StatusBadge status="incident" />
                <StatusBadge status="info" />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Chips & Badges</Label>
              <div className="flex flex-wrap gap-2">
                <ModeChip mode="Production" active />
                <ModeChip mode="Staging" />
                <SeverityChip severity="critical" />
                <SeverityChip severity="high" />
                <PriorityBadge priority="P0" />
                <PriorityBadge priority="P3" />
              </div>
              <div className="flex flex-wrap gap-2">
                <LiveIndicator />
                <Badge variant="emerald">New Feature</Badge>
                <Badge variant="warning">Stale</Badge>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Indicators & Text</Label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-4">
                  <DeltaIndicator value={12.5} />
                  <DeltaIndicator value={-4.2} />
                  <DeltaIndicator value={0} />
                </div>
                <FreshnessIndicator timestamp={new Date()} />
                <div className="flex gap-2 items-center">
                  <MonoText color="emerald">0x8842</MonoText>
                  <Kbd>⌘K</Kbd>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section>
          <SectionDivider label="Buttons" />
          <div className="flex flex-wrap gap-4 items-center">
            <Button variant="primary">Primary Action</Button>
            <Button variant="secondary" icon="refresh">Secondary</Button>
            <Button variant="outline" size="sm">Outline Small</Button>
            <Button variant="ghost" icon="settings" iconPosition="right">Ghost Settings</Button>
            <Button variant="danger" icon="trash-bin-trash">Delete</Button>
            <IconButton icon="magnifer" variant="secondary" />
            <ActionButton label="Purge Cache" icon="refresh" />
            <CopyButton value="0x123456789" />
          </div>
        </section>

        {/* Inputs */}
        <section>
          <SectionDivider label="Inputs" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TextInput label="Service Name" placeholder="e.g. auth-api" icon="box" />
            <SearchInput placeholder="Search logs..." />
            <Select 
              label="Environment" 
              options={[
                { value: 'prod', label: 'Production' },
                { value: 'stage', label: 'Staging' }
              ]} 
            />
            <div className="flex flex-col gap-4">
              <Toggle checked={toggle} onChange={setToggle} label="Enable Auto-Scaling" />
              <Checkbox checked={check} onChange={setCheck} label="Confirm Deployment" />
            </div>
          </div>
        </section>

        {/* Cards */}
        <section>
          <SectionDivider label="Cards & KPIs" />
          <MetricGrid cols={4}>
            <KPICard label="Uptime 24H" value="99.98%" delta={0.02} status="healthy" icon="pulse" />
            <KPICard label="Active Sessions" value="12.4k" delta={14} status="info" icon="users-group-two-rounded" />
            <KPICard label="Error Rate" value="0.04%" delta={-2} status="healthy" icon="bug" />
            <KPICard label="Latency p95" value="142ms" delta={8} status="degraded" icon="bolt" />
          </MetricGrid>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader title="System Configuration" subtitle="Last modified by a.chen" icon="settings" />
              <div className="p-4 space-y-1">
                <HealthStrip label="API Gateway" status="healthy" value="v2.4.1" />
                <HealthStrip label="Auth Service" status="degraded" value="v2.3.9" />
                <HealthStrip label="Database" status="healthy" value="Primary" />
              </div>
              <CardFooter>
                <Button variant="ghost" size="xs" className="w-full">View Full Config</Button>
              </CardFooter>
            </Card>

            <Card variant="overlay">
              <CardHeader title="Recent Activity" icon="clipboard-list" />
              <div className="divide-y divide-surface-border">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-label-xs font-bold text-text-primary">Deployment Successful</span>
                    <span className="text-[9px] text-text-muted uppercase">auth-api • v2.4.1</span>
                  </div>
                  <MonoText color="muted" className="text-[10px]">2m ago</MonoText>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-label-xs font-bold text-text-primary">Config Updated</span>
                    <span className="text-[9px] text-text-muted uppercase">trading-engine • scaling_factor</span>
                  </div>
                  <MonoText color="muted" className="text-[10px]">15m ago</MonoText>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Feedback & Alerts */}
        <section>
          <SectionDivider label="Feedback & Alerts" />
          <div className="space-y-4">
            <IncidentBanner title="Major Outage: US-EAST-1 Connectivity" id="INC-0042" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AlertBanner 
                status="warning" 
                title="Certificate Expiring" 
                message="The SSL certificate for api.openclaw.io expires in 14 days. Please renew to avoid service interruption." 
              />
              <div className="space-y-4">
                <InlineAlert status="success" message="System reconciliation complete" />
                <InlineAlert status="error" message="Failed to connect to primary database" />
                <div className="flex items-center gap-6">
                  <div className="flex flex-col gap-2">
                    <Label>Loaders</Label>
                    <div className="flex items-center gap-4">
                      <Spinner size="sm" />
                      <PulsingDot color="emerald" />
                      <CountdownTimer seconds={300} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <Label>Progress</Label>
                    <ProgressBar progress={65} className="mt-2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Data Display & Charts */}
        <section>
          <SectionDivider label="Data Display & Charts" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <Label>Tags & Values</Label>
              <TagList tags={['Production', 'AWS', 'us-east-1', 'v2.4.1']} />
              <CopyableValue label="API_KEY" value="ak_live_51Mz9X..." />
              <Tooltip content="This is a secure value">
                <div className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary cursor-help">
                  <ForgeIcon name="info-circle" size={14} />
                  <span className="text-[10px] font-bold uppercase">Hover for info</span>
                </div>
              </Tooltip>
            </div>
            <div className="space-y-4">
              <Label>Uptime History</Label>
              <UptimeStrip history={['healthy', 'healthy', 'degraded', 'healthy', 'incident', 'healthy', 'healthy', 'healthy', 'healthy', 'healthy']} />
              <Label>Sparkline</Label>
              <SparkLine data={Array.from({ length: 20 }, (_, i) => ({ value: Math.random() * 100 }))} />
            </div>
          </div>
        </section>

      </div>

      {/* Overlays */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="System Configuration">
        <div className="space-y-6">
          <p className="text-body-md text-text-secondary">
            Adjust the global scaling parameters for the trading engine. These changes take effect immediately across all regions.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <TextInput label="Min Instances" defaultValue="2" />
            <TextInput label="Max Instances" defaultValue="10" />
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Audit Log Detail">
        <div className="space-y-6">
          <div className="p-4 bg-surface-base rounded border border-surface-border space-y-4">
            <StatRow label="Event ID" value="evt_8842991" />
            <StatRow label="Timestamp" value="2026-03-08 15:24:12" />
            <StatRow label="Actor" value="a.chen@openclaw.io" />
            <StatRow label="Action" value="CONFIG_UPDATE" />
          </div>
          <div className="space-y-2">
            <Label>Payload Diff</Label>
            <div className="p-4 bg-surface-base rounded border border-surface-border font-mono text-[10px] text-text-primary overflow-x-auto">
              <pre>{JSON.stringify({ scaling: { min: 2, max: 10 } }, null, 2)}</pre>
            </div>
          </div>
          <Button variant="outline" className="w-full" icon="export">Export Event Data</Button>
        </div>
      </Drawer>
    </div>
  );
};
