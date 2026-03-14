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
  BottomDrawer,
  LogViewer,
  BentoCard,
  Tooltip,
  Tabs,
  Accordion,
  EmptyState,
  Toast,
  Notification,
  Breadcrumbs,
  Stepper
} from '@/src/components/ui';

export const ComponentLibrary: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSize, setModalSize] = useState<'sm' | 'md' | 'lg' | 'xl' | 'full'>('md');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBottomDrawerOpen, setIsBottomDrawerOpen] = useState(false);
  const [isFullBottomDrawerOpen, setIsFullBottomDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [toggle, setToggle] = useState(true);
  const [check, setCheck] = useState(true);
  const [showToast, setShowToast] = useState(false);

  const openModal = (size: typeof modalSize) => {
    setModalSize(size);
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-base overflow-y-auto pb-20">
      <PageHeader 
        title="Component Library" 
        subtitle="FORGE × NUVUE Design System v2.0" 
        icon="layers"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => openModal('md')}>Open Modal</Button>
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

        {/* Overlays Section */}
        <section>
          <SectionDivider label="Overlays & Drawers" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" onClick={() => openModal('sm')}>Small Modal</Button>
            <Button variant="outline" onClick={() => openModal('lg')}>Large Modal</Button>
            <Button variant="outline" onClick={() => openModal('full')}>Full Page Modal</Button>
            <Button variant="secondary" onClick={() => setIsBottomDrawerOpen(true)}>Bottom Drawer</Button>
            <Button variant="primary" onClick={() => setIsFullBottomDrawerOpen(true)}>Full Bottom Drawer</Button>
          </div>
        </section>

        {/* Logs Section */}
        <section>
          <SectionDivider label="System Monitoring" />
          <div className="grid grid-cols-1 gap-6">
            <LogViewer simulateInput className="h-[400px]" />
          </div>
        </section>

        {/* Cards */}
        <section>
          <SectionDivider label="Cards & Layouts" />
          <MetricGrid cols={4}>
            <KPICard label="Uptime 24H" value="99.98%" delta={0.02} status="healthy" icon="pulse" />
            <KPICard label="Active Sessions" value="12.4k" delta={14} status="info" icon="users-group-two-rounded" />
            <KPICard label="Error Rate" value="0.04%" delta={-2} status="healthy" icon="bug" />
            <KPICard label="Latency p95" value="142ms" delta={8} status="degraded" icon="bolt" />
          </MetricGrid>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <BentoCard 
              title="Global Intelligence" 
              subtitle="Real-time network analysis"
              icon="global"
              className="lg:col-span-2"
              badge={<Badge variant="emerald">Live</Badge>}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-4">
                  <p className="text-body-sm text-text-secondary">
                    The neural core is currently processing 14.2k requests per second across 12 regions. 
                    Latency remains within optimal thresholds.
                  </p>
                  <div className="flex gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-text-muted uppercase">Throughput</span>
                      <span className="text-heading-md font-mono text-emerald-accent">1.2 GB/s</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-text-muted uppercase">Nodes</span>
                      <span className="text-heading-md font-mono text-text-primary">128/128</span>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-base/50 rounded-lg p-4 border border-surface-border">
                  <Label className="mb-3">Regional Load</Label>
                  <div className="space-y-2">
                    <ProgressBar progress={82} label="US-EAST" />
                    <ProgressBar progress={45} label="EU-WEST" />
                    <ProgressBar progress={12} label="AP-SOUTH" />
                  </div>
                </div>
              </div>
            </BentoCard>

            <Card>
              <CardHeader title="System Health" icon="shield-check" />
              <div className="p-4 space-y-2">
                <HealthStrip label="API Gateway" status="healthy" value="v2.4.1" />
                <HealthStrip label="Auth Service" status="degraded" value="v2.3.9" />
                <HealthStrip label="Database" status="healthy" value="Primary" />
                <HealthStrip label="Neural Core" status="healthy" value="v1.0.0" />
              </div>
              <CardFooter>
                <Button variant="ghost" size="xs" className="w-full">Run Diagnostics</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Navigation & Structure */}
        <section>
          <SectionDivider label="Navigation & Structure" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Label>Breadcrumbs</Label>
              <Breadcrumbs 
                items={[
                  { label: 'System', icon: 'settings' },
                  { label: 'Intelligence', icon: 'cpu' },
                  { label: 'Neural Core', icon: 'graph-new' },
                  { label: 'Config' },
                ]}
              />
              
              <Label className="block mt-8">Tabs System</Label>
              <Tabs 
                tabs={[
                  { id: 'overview', label: 'Overview', icon: 'home-smile' },
                  { id: 'analytics', label: 'Analytics', icon: 'graph-new' },
                  { id: 'security', label: 'Security', icon: 'shield-check' },
                  { id: 'logs', label: 'Logs', icon: 'document-text' },
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
              <div className="p-4 rounded-lg border border-surface-border bg-surface-raised/30 min-h-[100px] flex items-center justify-center">
                <span className="text-label-md text-text-muted uppercase tracking-widest">Active View: {activeTab}</span>
              </div>
            </div>

            <div className="space-y-8">
              <Label>Stepper System</Label>
              <Stepper 
                currentStep={1}
                steps={[
                  { label: 'Initialize', description: 'Booting neural core' },
                  { label: 'Syncing', description: 'Replicating data' },
                  { label: 'Validate', description: 'Running integrity checks' },
                  { label: 'Deploy', description: 'Going live' },
                ]}
              />

              <Label className="block mt-8">Accordion System</Label>
              <Accordion 
                items={[
                  { 
                    id: '1', 
                    title: 'Network Configuration', 
                    icon: 'global',
                    content: 'Global routing tables and edge node configurations are managed here. Changes propagate within 300ms.' 
                  },
                  { 
                    id: '2', 
                    title: 'Security Protocols', 
                    icon: 'shield-warning',
                    content: 'Active firewall rules and intrusion detection systems. Current threat level: LOW.' 
                  },
                ]}
              />
            </div>
          </div>
        </section>

        {/* Empty States */}
        <section>
          <SectionDivider label="Empty States" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <EmptyState 
              title="No Active Incidents" 
              description="All systems are operating within normal parameters. No critical issues detected in the last 24 hours."
              icon="check-circle"
              action={<Button variant="outline" size="sm">View History</Button>}
            />
            <EmptyState 
              title="No Search Results" 
              description="We couldn't find any audit logs matching your current filter criteria. Try adjusting your search parameters."
              icon="magnifer"
              action={<Button variant="secondary" size="sm">Clear Filters</Button>}
            />
          </div>
        </section>

        {/* Feedback & Alerts */}
        <section>
          <SectionDivider label="Feedback & Alerts" />
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center">
              <Button variant="outline" size="sm" onClick={() => setShowToast(true)}>Trigger Toast</Button>
              {showToast && (
                <Toast 
                  message="System configuration updated successfully" 
                  status="success" 
                  onClose={() => setShowToast(false)} 
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Notification 
                title="Security Alert" 
                message="New login detected from an unrecognized IP address in Singapore. Please verify if this was you."
                timestamp="2m ago"
                icon="shield-warning"
                unread
              />
              <Notification 
                title="Deployment Success" 
                message="Neural Core v2.4.1 has been successfully deployed to all 12 edge regions."
                timestamp="15m ago"
                icon="rocket"
              />
              <Notification 
                title="System Maintenance" 
                message="Scheduled maintenance for the primary database cluster will begin in 2 hours."
                timestamp="1h ago"
                icon="settings"
              />
            </div>

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

      </div>

      {/* Overlays */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="System Configuration"
        size={modalSize}
      >
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

      <BottomDrawer 
        isOpen={isBottomDrawerOpen} 
        onClose={() => setIsBottomDrawerOpen(false)} 
        title="Quick Actions"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <ActionButton label="Restart Node" icon="restart" />
          <ActionButton label="Flush Cache" icon="refresh" />
          <ActionButton label="View Logs" icon="document-text" />
          <ActionButton label="Escalate" icon="arrow-up" />
        </div>
      </BottomDrawer>

      <BottomDrawer 
        isOpen={isFullBottomDrawerOpen} 
        onClose={() => setIsFullBottomDrawerOpen(false)} 
        title="Global Intelligence Report"
        fullHeight
      >
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KPICard label="Network Health" value="98.2%" status="healthy" />
            <KPICard label="Active Threats" value="0" status="healthy" />
            <KPICard label="System Load" value="42%" status="info" />
          </div>
          <LogViewer simulateInput className="h-[400px]" />
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => setIsFullBottomDrawerOpen(false)}>Close Report</Button>
          </div>
        </div>
      </BottomDrawer>
    </div>
  );
};
