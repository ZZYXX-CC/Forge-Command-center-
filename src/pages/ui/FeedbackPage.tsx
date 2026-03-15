import React from 'react';
import { 
  Spinner, 
  PulsingDot, 
  CountdownTimer, 
  ProgressBar, 
  AlertBanner, 
  InlineAlert, 
  IncidentBanner,
  Label,
  Toast,
  Notification,
  Button
} from '@/src/components/ui';

export const FeedbackPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-base overflow-y-auto p-6 space-y-8">
      <div>
        <h1 className="text-display-sm font-bold text-text-primary uppercase tracking-tighter">Feedback</h1>
        <p className="text-text-secondary text-label-md">System responses, loading states, and alerts.</p>
      </div>

      <div className="space-y-12">
        <section className="space-y-4">
          <Label className="text-text-muted uppercase tracking-widest text-[10px]">Alerts & Banners</Label>
          <div className="space-y-4">
            <IncidentBanner title="Major Outage: US-EAST-1 Connectivity" id="INC-0042" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AlertBanner 
                status="warning" 
                title="Certificate Expiring" 
                message="The SSL certificate for api.openclaw.io expires in 14 days." 
              />
              <div className="space-y-4">
                <InlineAlert status="success" message="System reconciliation complete" />
                <InlineAlert status="error" message="Failed to connect to primary database" />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <Label className="text-text-muted uppercase tracking-widest text-[10px]">Toasts & Notifications</Label>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label className="text-[9px]">NOTIFICATIONS</Label>
              <div className="space-y-3">
                <Notification 
                  title="Deployment Successful" 
                  message="v2.4.1 has been successfully deployed to all production clusters." 
                  icon="check-circle"
                  unread={true}
                  timestamp="Just now"
                />
                <Notification 
                  title="System Warning" 
                  message="Memory usage on node-04 exceeds 85% threshold." 
                  icon="shield-warning"
                  timestamp="2m ago"
                />
              </div>
            </div>
            <div className="space-y-4">
              <Label className="text-[9px]">TOAST VARIANTS</Label>
              <div className="flex flex-wrap gap-3">
                <Toast message="Action completed successfully" status="success" />
                <Toast message="Connection lost. Retrying..." status="warning" />
                <Toast message="Critical system failure" status="error" />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <Label className="text-text-muted uppercase tracking-widest text-[10px]">Loading & Progress</Label>
          <div className="bg-surface-raised border border-surface-border p-6 rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-center gap-6">
                <Spinner size="md" />
                <PulsingDot color="emerald" />
                <CountdownTimer seconds={300} />
              </div>
              <div className="md:col-span-2 flex items-center">
                <ProgressBar progress={65} className="w-full" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FeedbackPage;
