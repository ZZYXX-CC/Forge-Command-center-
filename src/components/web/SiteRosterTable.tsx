import React from 'react';
import { cn } from '@/src/lib/utils';
import { WebSite } from '@/src/types/webOps';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, RefreshCw, BookOpen, ChevronDown, ChevronUp, Globe, Shield, Clock, AlertCircle } from 'lucide-react';

interface SiteRosterTableProps {
  sites: WebSite[];
  expandedSiteId: string | null;
  onToggleExpand: (id: string) => void;
}

export const SiteRosterTable: React.FC<SiteRosterTableProps> = ({ sites, expandedSiteId, onToggleExpand }) => {
  if (sites.length === 0) {
    return (
      <div className="bg-surface-raised border border-surface-border rounded-lg p-12 flex flex-col items-center justify-center text-center">
        <Globe className="w-12 h-12 text-text-muted mb-4 opacity-20" />
        <h3 className="text-heading-md text-text-primary mb-2">No sites match current filters</h3>
        <p className="text-body-sm text-text-secondary">Try adjusting your environment or status filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-raised border border-surface-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-base/50 border-b border-surface-border">
              <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Site Name</th>
              <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Env</th>
              <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider text-right">Uptime</th>
              <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider text-right">Latency p95</th>
              <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Last Check</th>
              <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Last Deploy</th>
              <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider text-center">Errors 1H</th>
              <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((site) => (
              <React.Fragment key={site.id}>
                <tr 
                  onClick={() => onToggleExpand(site.id)}
                  className={cn(
                    "group cursor-pointer transition-colors border-b border-surface-border/50",
                    expandedSiteId === site.id ? "bg-surface-active" : "hover:bg-surface-hover",
                    site.status === 'degraded' && "border-l-2 border-l-status-degraded",
                    site.status === 'down' && "border-l-2 border-l-status-incident"
                  )}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        site.status === 'healthy' ? "bg-status-healthy" : 
                        site.status === 'degraded' ? "bg-status-degraded" : 
                        site.status === 'down' ? "bg-status-incident" : "bg-status-neutral"
                      )} />
                      <span className="text-label-xs font-bold uppercase text-text-primary">{site.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-heading-sm text-text-primary font-mono">{site.domain}</span>
                      <span className="text-[10px] text-text-muted">{site.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className={cn(
                      "inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                      site.environment === 'production' ? "bg-emerald-subtle text-emerald-accent" : 
                      site.environment === 'staging' ? "bg-status-info/10 text-status-info" : 
                      "bg-surface-border text-text-muted"
                    )}>
                      {site.environment.substring(0, 4)}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className={cn(
                      "text-heading-sm font-mono",
                      site.uptimePct24H > 99.5 ? "text-status-healthy" : 
                      site.uptimePct24H > 98 ? "text-status-degraded" : "text-status-incident"
                    )}>
                      {site.uptimePct24H}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className={cn(
                      "text-heading-sm font-mono",
                      site.latencyP95Ms > 1000 ? "text-status-incident" : 
                      site.latencyP95Ms > 500 ? "text-status-degraded" : "text-text-primary"
                    )}>
                      {site.latencyP95Ms}ms
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-label-xs font-mono text-text-secondary">
                      {formatDistanceToNow(new Date(site.lastCheckedAt), { addSuffix: true })}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-label-xs font-mono text-text-primary">{site.lastDeploy.version}</span>
                      <span className="text-[10px] text-text-muted">
                        {formatDistanceToNow(new Date(site.lastDeploy.deployedAt), { addSuffix: true })} • {site.lastDeploy.deployedBy}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {site.errors1H > 0 ? (
                      <span className="px-1.5 py-0.5 rounded bg-status-incident/10 text-status-incident text-[10px] font-bold font-mono">
                        {site.errors1H}
                      </span>
                    ) : (
                      <span className="text-text-muted text-[10px] font-mono">0</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 hover:bg-surface-border rounded text-text-muted hover:text-text-primary" title="View Site">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 hover:bg-surface-border rounded text-text-muted hover:text-text-primary" title="Restart Service">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 hover:bg-surface-border rounded text-text-muted hover:text-text-primary" title="Runbook">
                        <BookOpen className="w-3.5 h-3.5" />
                      </button>
                      {expandedSiteId === site.id ? <ChevronUp className="w-4 h-4 ml-1 text-text-muted" /> : <ChevronDown className="w-4 h-4 ml-1 text-text-muted" />}
                    </div>
                  </td>
                </tr>
                {expandedSiteId === site.id && (
                  <tr>
                    <td colSpan={9} className="bg-surface-base/30 p-0">
                      <SiteRowDetail site={site} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SiteRowDetail: React.FC<{ site: WebSite }> = ({ site }) => {
  return (
    <div className="p-6 border-b border-surface-border animate-in slide-in-from-top-2 duration-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sub-services Health */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-text-secondary mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Sub-Service Health</span>
          </div>
          <div className="space-y-2">
            {[
              { name: 'Frontend Edge', status: 'healthy', latency: '42ms' },
              { name: 'API Proxy', status: site.status === 'healthy' ? 'healthy' : 'degraded', latency: '128ms' },
              { name: 'Static Assets', status: 'healthy', latency: '15ms' },
              { name: 'Auth Bridge', status: 'healthy', latency: '85ms' },
            ].map((sub, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-surface-raised rounded border border-surface-border/50">
                <span className="text-label-xs text-text-primary">{sub.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-text-muted">{sub.latency}</span>
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    sub.status === 'healthy' ? "bg-status-healthy" : "bg-status-degraded"
                  )} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Checks */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-text-secondary mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Recent Checks</span>
          </div>
          <div className="space-y-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-surface-border/30 last:border-0">
                <span className="text-[10px] font-mono text-text-muted">
                  {formatDistanceToNow(new Date(Date.now() - (i + 1) * 60000), { addSuffix: true })}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-status-healthy">200 OK</span>
                  <span className="text-[10px] font-mono text-text-muted">{(Math.random() * 100 + 50).toFixed(0)}ms</span>
                </div>
              </div>
            ))}
          </div>
          <button className="text-[10px] font-bold text-emerald-accent uppercase hover:underline">View all checks →</button>
        </div>

        {/* Error Sample */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-text-secondary mb-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Recent Error Sample</span>
          </div>
          {site.errors1H > 0 ? (
            <div className="space-y-3">
              <div className="p-3 bg-status-incident/5 border border-status-incident/20 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-status-incident uppercase">503 Service Unavailable</span>
                  <span className="text-[10px] font-mono text-text-muted">2m ago</span>
                </div>
                <div className="text-[10px] font-mono text-text-primary truncate">GET /api/v1/orders/pos-123</div>
                <div className="text-[10px] text-text-muted mt-1 leading-relaxed">
                  Upstream connection timeout after 5000ms. Region: us-east-1.
                </div>
              </div>
              <button className="text-[10px] font-bold text-status-incident uppercase hover:underline">View full error log →</button>
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center border border-dashed border-surface-border rounded">
              <span className="text-[10px] text-text-muted uppercase tracking-widest">No errors detected</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
