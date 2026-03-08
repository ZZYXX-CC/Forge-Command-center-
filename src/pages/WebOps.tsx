import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WebOpsState, WebSite } from '@/src/types/webOps';
import { WebOpsKPIStrip } from '@/src/components/web/WebOpsKPIStrip';
import { SiteRosterTable } from '@/src/components/web/SiteRosterTable';
import { ErrorLogCard } from '@/src/components/web/ErrorLogCard';
import { CDNStatusCard } from '@/src/components/web/CDNStatusCard';
import { CertificatesCard } from '@/src/components/web/CertificatesCard';
import { WebAlertsPanel } from '@/src/components/web/WebAlertsPanel';
import { DeployQueuePanel } from '@/src/components/web/DeployQueuePanel';
import { QuickActionsPanel } from '@/src/components/web/QuickActionsPanel';
import { cn } from '@/src/lib/utils';
import { RefreshCw, Filter, ChevronDown, Clock, Globe, Shield, Box, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

type Environment = 'all' | 'production' | 'staging' | 'preview';
type StatusFilter = 'all' | 'healthy' | 'degraded' | 'incident';

export const WebOps: React.FC = () => {
  const [env, setEnv] = useState<Environment>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [activeKPIFilter, setActiveKPIFilter] = useState<string | null>(null);
  const [expandedSiteId, setExpandedSiteId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<WebOpsState>({
    queryKey: ['web-ops-state', env],
    queryFn: async () => {
      const res = await fetch(`/api/web-ops-state?env=${env}`);
      if (!res.ok) throw new Error('Failed to fetch web ops state');
      return res.json();
    },
    refetchInterval: 15000,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const filteredSites = useMemo(() => {
    if (!data) return [];
    let sites = data.sites;

    // Environment filter
    if (env !== 'all') {
      sites = sites.filter(s => s.environment === env);
    }

    // Status filter
    if (statusFilter !== 'all') {
      sites = sites.filter(s => {
        if (statusFilter === 'healthy') return s.status === 'healthy';
        if (statusFilter === 'degraded') return s.status === 'degraded';
        if (statusFilter === 'incident') return s.status === 'down';
        return true;
      });
    }

    // KPI filter
    if (activeKPIFilter) {
      if (activeKPIFilter === 'sites-up') {
        sites = sites.filter(s => s.status !== 'healthy');
      } else if (activeKPIFilter === 'uptime') {
        sites = sites.filter(s => s.uptimePct24H < 99.5);
      } else if (activeKPIFilter === 'errors') {
        sites = sites.filter(s => s.errors1H > 0);
      }
    }

    return sites;
  }, [data, env, statusFilter, activeKPIFilter]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-base">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-emerald-accent animate-spin" />
          <span className="text-label-md animate-pulse uppercase tracking-widest text-text-muted">Loading Web Operations...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-base p-6">
        <div className="max-w-md w-full p-8 bg-surface-raised border border-status-incident rounded-lg text-center shadow-raised">
          <AlertTriangle className="w-12 h-12 text-status-incident mx-auto mb-4" />
          <h2 className="text-heading-lg text-text-primary mb-2 uppercase tracking-tighter">Connection Failed</h2>
          <p className="text-body-md text-text-secondary mb-6">Unable to retrieve real-time web operations data. The monitoring service may be temporarily unavailable.</p>
          <button 
            onClick={() => refetch()}
            className="w-full py-3 bg-emerald-accent text-text-inverse rounded font-bold uppercase hover:bg-emerald-mid transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-base">
      {/* Page Header */}
      <header className="px-4 lg:px-6 py-4 border-b border-surface-border bg-surface-raised/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-heading-lg text-text-primary font-bold tracking-tighter uppercase">Web / Client Ops</h1>
            <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted">
              <span className="text-emerald-accent">/web-ops</span>
              <span>•</span>
              <span>{format(new Date(data.meta.generatedAt), 'yyyy-MM-dd HH:mm:ss')}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Environment Selector */}
            <div className="flex bg-surface-base rounded p-1 border border-surface-border">
              {(['all', 'production', 'staging', 'preview'] as Environment[]).map((e) => (
                <button
                  key={e}
                  onClick={() => setEnv(e)}
                  className={cn(
                    "px-3 py-1 rounded text-[10px] font-bold uppercase transition-all",
                    env === e ? "bg-emerald-accent text-text-inverse" : "text-text-muted hover:text-text-primary"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 bg-surface-raised border border-surface-border rounded text-[10px] font-bold uppercase text-text-secondary hover:text-text-primary transition-colors">
                <Filter className="w-3 h-3" />
                Status: {statusFilter}
                <ChevronDown className="w-3 h-3" />
              </button>
              <div className="absolute top-full right-0 mt-1 w-40 bg-surface-overlay border border-surface-border rounded-lg shadow-raised opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {(['all', 'healthy', 'degraded', 'incident'] as StatusFilter[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-surface-hover transition-colors",
                      statusFilter === s ? "text-emerald-accent" : "text-text-secondary"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-accent text-text-inverse rounded font-bold uppercase text-[10px] hover:bg-emerald-mid transition-colors disabled:opacity-50"
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        
        {/* Active Filter Chips */}
        {(env !== 'all' || statusFilter !== 'all' || activeKPIFilter) && (
          <div className="max-w-[1400px] mx-auto mt-3 flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest mr-1">Active Filters:</span>
            {env !== 'all' && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-subtle-bg border border-emerald-accent/20 rounded text-[9px] font-bold text-emerald-accent uppercase">
                Env: {env}
                <button onClick={() => setEnv('all')}><X className="w-2.5 h-2.5" /></button>
              </div>
            )}
            {statusFilter !== 'all' && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-subtle-bg border border-emerald-accent/20 rounded text-[9px] font-bold text-emerald-accent uppercase">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter('all')}><X className="w-2.5 h-2.5" /></button>
              </div>
            )}
            {activeKPIFilter && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-subtle-bg border border-emerald-accent/20 rounded text-[9px] font-bold text-emerald-accent uppercase">
                KPI: {activeKPIFilter.replace('-', ' ')}
                <button onClick={() => setActiveKPIFilter(null)}><X className="w-2.5 h-2.5" /></button>
              </div>
            )}
            <button 
              onClick={() => { setEnv('all'); setStatusFilter('all'); setActiveKPIFilter(null); }}
              className="text-[9px] font-bold text-text-muted uppercase hover:text-text-primary underline underline-offset-2"
            >
              Clear All
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto p-4 lg:p-6 flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* KPI Strip */}
            <WebOpsKPIStrip 
              kpis={data.kpis} 
              activeFilter={activeKPIFilter}
              onFilterClick={setActiveKPIFilter}
            />

            {/* Site Roster */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-accent" />
                  <h2 className="text-label-sm font-bold text-text-primary uppercase tracking-wider">Site Roster</h2>
                </div>
                <span className="text-[10px] font-mono text-text-muted">{filteredSites.length} Sites Showing</span>
              </div>
              <SiteRosterTable 
                sites={filteredSites} 
                expandedSiteId={expandedSiteId}
                onToggleExpand={(id) => setExpandedSiteId(expandedSiteId === id ? null : id)}
              />
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="h-[400px]">
                <ErrorLogCard errors={data.errorLog} />
              </div>
              <div className="h-[400px]">
                <CDNStatusCard nodes={data.cdn} />
              </div>
              <div className="h-[400px]">
                <CertificatesCard certificates={data.certificates} />
              </div>
            </div>
          </div>

          {/* Right Rail */}
          <aside className="w-full lg:w-[320px] space-y-8">
            <div className="bg-surface-raised border border-surface-border rounded-lg p-4 h-[350px] flex flex-col">
              <WebAlertsPanel alerts={data.alerts} />
            </div>
            
            <div className="h-px bg-surface-border" />
            
            <div className="bg-surface-raised border border-surface-border rounded-lg p-4 h-[400px] flex flex-col">
              <DeployQueuePanel queue={data.deployQueue} />
            </div>
            
            <div className="h-px bg-surface-border" />
            
            <div className="bg-surface-raised border border-surface-border rounded-lg p-4">
              <QuickActionsPanel actions={data.quickActions} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const X = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
