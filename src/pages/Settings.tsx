import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Key, 
  Monitor, 
  Globe, 
  Database, 
  Zap, 
  Save,
  ChevronRight,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  Lock
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { 
  Card, 
  CardHeader, 
  CardFooter,
  Button,
  TextInput,
  Select,
  Toggle,
  Checkbox,
  PageHeader,
  SectionDivider,
  Badge,
  Label
} from '@/src/components/ui';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [showApiKey, setShowApiKey] = useState(false);

  const [compactMode, setCompactMode] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(false);
  const [notifications, setNotifications] = useState({
    critical: true,
    deployment: true,
    security: true,
    finance: false,
    maintenance: true,
    weekly: false
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Monitor },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API & Integrations', icon: Key },
    { id: 'billing', label: 'Billing', icon: Database },
  ];

  return (
    <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
      <div className="max-w-[1000px] mx-auto space-y-8">
        <PageHeader 
          title="System Settings" 
          subtitle="Configure your FORGE environment, notification preferences, and API access."
          icon="settings"
        />

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
          {/* Sidebar Nav */}
          <aside className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-left",
                  activeTab === tab.id 
                    ? "bg-surface-raised border border-surface-border text-text-primary shadow-sm" 
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                )}
              >
                <tab.icon className={cn(
                  "w-4 h-4",
                  activeTab === tab.id ? "text-accent-primary" : "text-text-muted"
                )} />
                <span className="text-heading-sm">{tab.label}</span>
                {activeTab === tab.id && <ChevronRight className="w-3.5 h-3.5 ml-auto text-text-muted" />}
              </button>
            ))}
          </aside>

          {/* Content Area */}
          <div className="space-y-6">
            {activeTab === 'general' && (
              <Card>
                <CardHeader title="General Preferences" icon={Monitor} />
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Display Name</Label>
                      <TextInput defaultValue="Samuel Chris" />
                    </div>
                    <div className="space-y-2">
                      <Label>Default Environment</Label>
                      <Select 
                        options={[
                          { value: 'prod', label: 'Production' },
                          { value: 'staging', label: 'Staging' },
                          { value: 'dev', label: 'Development' },
                        ]}
                        defaultValue="prod"
                      />
                    </div>
                  </div>

                  <SectionDivider />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-heading-sm text-text-primary">Compact Mode</div>
                        <div className="text-label-sm text-text-secondary">Reduce padding and font sizes for high-density views.</div>
                      </div>
                      <Toggle checked={compactMode} onChange={setCompactMode} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-heading-sm text-text-primary">Auto-Refresh Dashboard</div>
                        <div className="text-label-sm text-text-secondary">Automatically poll for new data every 10 seconds.</div>
                      </div>
                      <Toggle checked={autoRefresh} onChange={setAutoRefresh} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-heading-sm text-text-primary">Sound Alerts</div>
                        <div className="text-label-sm text-text-secondary">Play a subtle sound when critical incidents occur.</div>
                      </div>
                      <Toggle checked={soundAlerts} onChange={setSoundAlerts} />
                    </div>
                  </div>
                </div>
                <CardFooter className="justify-end gap-3">
                  <Button variant="ghost">Reset</Button>
                  <Button variant="primary" icon={Save}>Save Changes</Button>
                </CardFooter>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card>
                <CardHeader title="Notification Channels" icon={Bell} />
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-surface-base border border-surface-border">
                      <div className="p-2 rounded bg-accent-subtle text-accent-primary">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="text-heading-sm text-text-primary">Email Notifications</div>
                          <Badge variant="success">Active</Badge>
                        </div>
                        <div className="text-label-sm text-text-secondary">samuelchris58@gmail.com</div>
                      </div>
                      <Button variant="ghost" size="sm">Configure</Button>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-lg bg-surface-base border border-surface-border">
                      <div className="p-2 rounded bg-surface-overlay text-text-muted">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="text-heading-sm text-text-primary">Push Notifications</div>
                          <Badge variant="neutral">Not Configured</Badge>
                        </div>
                        <div className="text-label-sm text-text-secondary">Receive alerts on your mobile device.</div>
                      </div>
                      <Button variant="secondary" size="sm">Setup</Button>
                    </div>
                  </div>

                  <SectionDivider />

                  <div className="space-y-4">
                    <div className="text-heading-sm text-text-primary">Alert Subscriptions</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Checkbox 
                        label="Critical Incidents" 
                        checked={notifications.critical} 
                        onChange={(val) => setNotifications(prev => ({ ...prev, critical: val }))} 
                      />
                      <Checkbox 
                        label="Deployment Success" 
                        checked={notifications.deployment} 
                        onChange={(val) => setNotifications(prev => ({ ...prev, deployment: val }))} 
                      />
                      <Checkbox 
                        label="Security Logins" 
                        checked={notifications.security} 
                        onChange={(val) => setNotifications(prev => ({ ...prev, security: val }))} 
                      />
                      <Checkbox 
                        label="Financial Thresholds" 
                        checked={notifications.finance} 
                        onChange={(val) => setNotifications(prev => ({ ...prev, finance: val }))} 
                      />
                      <Checkbox 
                        label="System Maintenance" 
                        checked={notifications.maintenance} 
                        onChange={(val) => setNotifications(prev => ({ ...prev, maintenance: val }))} 
                      />
                      <Checkbox 
                        label="Weekly Reports" 
                        checked={notifications.weekly} 
                        onChange={(val) => setNotifications(prev => ({ ...prev, weekly: val }))} 
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card>
                <CardHeader title="Security & Access" icon={Shield} />
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-surface-base border border-surface-border">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded bg-status-healthy-bg text-status-healthy">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-heading-sm text-text-primary">Two-Factor Authentication</div>
                          <div className="text-label-sm text-text-secondary">Enabled via Authenticator App</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Manage</Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Current Password</Label>
                      <TextInput type="password" placeholder="••••••••" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>New Password</Label>
                        <TextInput type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label>Confirm New Password</Label>
                        <TextInput type="password" />
                      </div>
                    </div>
                  </div>

                  <SectionDivider />

                  <div className="space-y-4">
                    <div className="text-heading-sm text-text-primary">Active Sessions</div>
                    <div className="space-y-2">
                      {[
                        { device: 'MacBook Pro', location: 'Lagos, Nigeria', status: 'Current Session' },
                        { device: 'iPhone 15', location: 'Lagos, Nigeria', status: '2 hours ago' },
                      ].map((session, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface-base border border-surface-border">
                          <div className="flex items-center gap-3">
                            <Monitor className="w-4 h-4 text-text-muted" />
                            <div>
                              <div className="text-label-md text-text-primary">{session.device}</div>
                              <div className="text-label-xs text-text-secondary">{session.location}</div>
                            </div>
                          </div>
                          <div className="text-label-xs text-text-muted">{session.status}</div>
                        </div>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm" className="text-status-incident">Revoke All Other Sessions</Button>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'api' && (
              <Card>
                <CardHeader title="API Access" icon={Key} />
                <div className="p-6 space-y-6">
                  <div className="p-4 rounded-lg bg-status-info-bg border border-status-info/20 flex gap-3">
                    <Zap className="w-5 h-5 text-status-info shrink-0" />
                    <div className="text-label-sm text-text-primary">
                      Use these keys to integrate FORGE with your custom scripts and external monitoring tools. Keep your secret keys private.
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Public API Key</Label>
                      <div className="flex gap-2">
                        <TextInput readOnly value="forge_pk_live_8842_x992_z001" className="font-mono" />
                        <Button variant="secondary">Copy</Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Secret API Key</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <TextInput 
                            type={showApiKey ? 'text' : 'password'} 
                            readOnly 
                            value="forge_sk_live_9921_a882_b773_c664" 
                            className="font-mono pr-10" 
                          />
                          <button 
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                          >
                            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <Button variant="secondary">Copy</Button>
                      </div>
                    </div>
                  </div>

                  <SectionDivider />

                  <div className="space-y-4">
                    <div className="text-heading-sm text-text-primary">Webhook Endpoints</div>
                    <div className="p-8 border-2 border-dashed border-surface-border rounded-xl text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-surface-raised border border-surface-border flex items-center justify-center mx-auto">
                        <Globe className="w-6 h-6 text-text-muted" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-heading-sm text-text-primary">No webhooks configured</div>
                        <div className="text-label-sm text-text-secondary">Add an endpoint to receive real-time event notifications.</div>
                      </div>
                      <Button variant="secondary" size="sm">Add Endpoint</Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};
