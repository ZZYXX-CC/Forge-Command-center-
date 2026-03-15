import React from 'react';
import { 
  Card, 
  CardHeader, 
  CardFooter, 
  HealthStrip, 
  Label,
  Button,
  SectionDivider,
  Tabs,
  Accordion,
  EmptyState,
  Breadcrumbs,
  Stepper
} from '@/src/components/ui';

export const LayoutPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-base overflow-y-auto p-6 space-y-8">
      <div>
        <h1 className="text-display-sm font-bold text-text-primary uppercase tracking-tighter">Layout</h1>
        <p className="text-text-secondary text-label-md">Structural components and containers.</p>
      </div>

      <div className="space-y-12">
        <section className="space-y-4">
          <Label className="text-text-muted uppercase tracking-widest text-[10px]">Card Variants</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader title="Standard Card" subtitle="Default surface-raised background" icon="settings" />
              <div className="p-4 text-body-sm text-text-secondary">
                Standard container for dashboard widgets and content sections.
              </div>
              <CardFooter>
                <Button variant="ghost" size="xs">Action</Button>
              </CardFooter>
            </Card>

            <Card variant="overlay">
              <CardHeader title="Overlay Card" subtitle="Darker surface-overlay background" icon="layers" />
              <div className="p-4 text-body-sm text-text-secondary">
                Used for secondary content or nested panels to create depth.
              </div>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <Label className="text-text-muted uppercase tracking-widest text-[10px]">Structural Elements</Label>
          <div className="bg-surface-raised border border-surface-border p-6 rounded-xl space-y-8">
            <div className="space-y-2">
              <Label className="text-[9px]">SECTION DIVIDER</Label>
              <SectionDivider label="Section Label" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[9px]">HEALTH STRIP</Label>
              <div className="space-y-1">
                <HealthStrip label="API Gateway" status="healthy" value="v2.4.1" />
                <HealthStrip label="Auth Service" status="degraded" value="v2.3.9" />
                <HealthStrip label="Database" status="incident" value="Primary" />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <Label className="text-text-muted uppercase tracking-widest text-[10px]">Navigation & State</Label>
          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-4">
              <Label className="text-[9px]">BREADCRUMBS</Label>
              <Breadcrumbs 
                items={[
                  { label: 'System', icon: 'settings' },
                  { label: 'Network', icon: 'global' },
                  { label: 'Gateways' }
                ]} 
              />
            </div>

            <div className="space-y-4">
              <Label className="text-[9px]">STEPPER</Label>
              <Stepper 
                steps={[
                  { label: 'Initialize', description: 'System boot' },
                  { label: 'Auth', description: 'Handshake' },
                  { label: 'Sync', description: 'Data stream' },
                  { label: 'Ready' }
                ]} 
                currentStep={1} 
              />
            </div>

            <div className="space-y-4">
              <Label className="text-[9px]">TABS</Label>
              <Tabs 
                tabs={[
                  { id: 'all', label: 'All Assets', icon: 'layers' },
                  { id: 'active', label: 'Active', icon: 'bolt' },
                  { id: 'archived', label: 'Archived', icon: 'clock-circle' }
                ]} 
                activeTab="all" 
                onChange={() => {}} 
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <Label className="text-text-muted uppercase tracking-widest text-[10px]">Content Containers</Label>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label className="text-[9px]">ACCORDION</Label>
              <Accordion 
                items={[
                  { id: '1', title: 'Network Configuration', icon: 'global', content: 'Detailed network settings and routing tables.' },
                  { id: '2', title: 'Security Policies', icon: 'shield-minimalistic', content: 'Active firewall rules and access control lists.' },
                  { id: '3', title: 'System Logs', icon: 'document-text', content: 'Recent system events and diagnostic information.' }
                ]} 
              />
            </div>
            <div className="space-y-4">
              <Label className="text-[9px]">EMPTY STATE</Label>
              <EmptyState 
                title="No Active Incidents" 
                description="All systems are operating within normal parameters. No manual intervention required." 
                icon="check-circle"
                action={<Button size="sm">Run Diagnostic</Button>}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LayoutPage;
