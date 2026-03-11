import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  Zap, 
  Shield, 
  Clock, 
  Filter, 
  Download, 
  AlertCircle,
  ChevronRight,
  Search,
  RefreshCw,
  MoreVertical,
  Layers,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { 
  KPICard, 
  Card, 
  CardHeader, 
  CardFooter,
  StatRow,
  ExpandableRow,
  Badge,
  Button,
  IconButton,
  ActionButton,
  TextInput,
  SearchInput,
  Select,
  FilterPillGroup,
  StatusBadge,
  StatusDot,
  LiveIndicator,
  MonoText,
  DeltaIndicator,
  MetricGrid,
  PageHeader,
  SectionDivider,
  HealthStrip,
  SparkLine,
  UptimeStrip,
  Modal,
  Drawer,
  Tooltip,
  ConfirmDialog,
  TagList,
  CopyableValue
} from '@/src/components/ui';
import { SpreadHeatmap } from '@/src/components/ui/SpreadHeatmap';
import { FreshnessIndicator } from '@/src/components/primitives/FreshnessIndicator';
import { P2PTradingState } from '@/src/types/trading';
import { format } from 'date-fns';

export const TradingP2P: React.FC = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [token, setToken] = useState('USDT');
  const [fiat, setFiat] = useState('NGN');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const isDisabled = token === 'BTC' && fiat === 'KES';

  const { data, isLoading, error, refetch } = useQuery<P2PTradingState>({
    queryKey: ['p2p-trading-state', timeRange, token, fiat],
    queryFn: async () => {
      const res = await fetch(`/api/p2p-trading-state?timeRange=${timeRange}&token=${token}&fiat=${fiat}`);
      if (!res.ok) throw new Error('Failed to fetch P2P trading state');
      return res.json();
    },
    enabled: !isDisabled,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    refetchInterval: 5000,
  });

  if (isDisabled) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <h2 className="text-display-md text-text-primary">P2P disabled for selected pair</h2>
          <p className="text-text-secondary">Switch to a supported token/fiat combination.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-6 animate-pulse">
        <div className="h-12 bg-surface-raised rounded-lg w-1/3" />
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-surface-raised rounded-xl" />)}
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-64 bg-surface-raised rounded-xl" />
          <div className="h-64 bg-surface-raised rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-status-incident mx-auto" />
          <h2 className="text-display-md text-text-primary">Failed to load P2P data</h2>
          <Button variant="primary" onClick={() => refetch()}>Retry Connection</Button>
        </div>
      </div>
    );
  }

  if (data.snapshots.length === 0) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-display-md text-text-primary">No P2P snapshot data</h2>
          <Button variant="secondary" onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  const staleSeconds = (Date.now() - new Date(data.lastSync).getTime()) / 1000;
  const isStale = staleSeconds > 60;

  return (
    <main className="flex-1 p-4 lg:p-6 overflow-y-auto bg-[#0B1020]">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-display-md font-bold text-text-primary">{data.pair}</h1>
              <LiveIndicator label="Live Stream" />
            </div>
            <div className="flex items-center gap-2 text-label-sm text-text-secondary">
              <Clock className="w-3.5 h-3.5" />
              <span>Last sync: {format(new Date(data.lastSync), 'HH:mm:ss')}</span>
              <span className="mx-1">•</span>
              <Activity className="w-3.5 h-3.5 text-status-healthy" />
              <span className="text-status-healthy">Health: {data.streamHealth}</span>
              {isStale && <Badge variant="warning">Stale</Badge>}
              <FreshnessIndicator timestamp={data.lastSync} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select 
              value={token} 
              onChange={(e) => setToken(e.target.value)}
              options={[{ value: 'USDT', label: 'USDT' }, { value: 'BTC', label: 'BTC' }]}
            />
            <Select 
              value={fiat} 
              onChange={(e) => setFiat(e.target.value)}
              options={[{ value: 'NGN', label: 'NGN' }, { value: 'KES', label: 'KES' }]}
            />
            <FilterPillGroup 
              options={[
                { value: '1h', label: '1H' },
                { value: '6h', label: '6H' },
                { value: '24h', label: '24H' },
                { value: '72h', label: '72H' },
              ]}
              activeValue={timeRange}
              onChange={setTimeRange}
            />
            <IconButton icon="export" variant="ghost" />
            <IconButton icon="refresh" variant="ghost" onClick={() => refetch()} />
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          <KPICard 
            label="Live Spread"
            value={`${data.kpis.spread}%`}
            delta={data.kpis.spreadChange}
            icon="graph-new"
          />
          <Card className="bg-[#111827] border-[#1F2937]">
            <CardHeader 
              title="Top-of-Book" 
              icon="layers"
              actions={<Badge variant="success">Tight</Badge>}
            />
            <div className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-label-xs text-text-muted uppercase tracking-wider">Best Buy</div>
                  <div className="text-heading-md text-status-healthy">₦{data.kpis.topOfBook.toLocaleString()}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-label-xs text-text-muted uppercase tracking-wider">Best Sell</div>
                  <div className="text-heading-md text-status-incident">₦{(data.kpis.topOfBook * 1.0276).toLocaleString()}</div>
                </div>
              </div>
              <div className="h-1 bg-surface-border rounded-full overflow-hidden flex">
                <div className="h-full bg-status-healthy w-[55%]" />
                <div className="h-full bg-status-incident w-[45%]" />
              </div>
            </div>
          </Card>
          <KPICard 
            label="Volatility (1H)"
            value={`${data.kpis.volatility}%`}
            icon="pulse"
            status={data.kpis.volatility > 0.5 ? 'degraded' : 'healthy'}
          />
          <KPICard 
            label="Liquidity Proxy"
            value={data.kpis.liquidityProxy.toLocaleString()}
            icon="bolt"
            status="healthy"
          />
        </div>

        {/* Main Row: Heatmap + Alerts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 bg-[#111827] border-[#1F2937]">
            <CardHeader title="Hourly Spread Opportunity" icon="chart-square" />
            <div className="p-6">
              <SpreadHeatmap data={data.heatmap} />
            </div>
          </Card>

          <Card className="bg-[#111827] border-[#1F2937] flex flex-col">
            <CardHeader title="Operational Alerts" icon="danger-triangle" />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {data.alerts.map(alert => (
                <div key={alert.id} className={cn(
                  "p-3 rounded-lg border flex gap-3",
                  alert.type === 'CRITICAL' ? "bg-status-incident-bg border-status-incident/20" :
                  alert.type === 'WARNING' ? "bg-status-degraded-bg border-status-degraded/20" :
                  "bg-status-info-bg border-status-info/20"
                )}>
                  <div className={cn(
                    "mt-0.5",
                    alert.type === 'CRITICAL' ? "text-status-incident" :
                    alert.type === 'WARNING' ? "text-status-degraded" :
                    "text-status-info"
                  )}>
                    {alert.type === 'CRITICAL' ? <XCircle className="w-4 h-4" /> :
                     alert.type === 'WARNING' ? <AlertTriangle className="w-4 h-4" /> :
                     <Info className="w-4 h-4" />}
                  </div>
                  <div className="space-y-1">
                    <div className="text-heading-sm text-text-primary">{alert.message}</div>
                    <div className="flex items-center gap-2 text-label-xs text-text-muted">
                      <span>{alert.rule}</span>
                      <span>•</span>
                      <span>{format(new Date(alert.timestamp), 'HH:mm:ss')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <CardFooter>
              <Button variant="ghost" size="sm" className="w-full">View All Alerts</Button>
            </CardFooter>
          </Card>
        </div>

        {/* Data Row: Snapshots + Risk/Health */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 bg-[#111827] border-[#1F2937]">
            <CardHeader 
              title="Market Snapshots" 
              icon="layers"
              actions={
                <div className="flex items-center gap-2">
                  <SearchInput placeholder="Filter snapshots..." className="w-48" />
                  <IconButton icon="filter" variant="ghost" />
                </div>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="px-4 py-3 text-label-xs text-text-muted uppercase tracking-wider">Timestamp</th>
                    <th className="px-4 py-3 text-label-xs text-text-muted uppercase tracking-wider">Method</th>
                    <th className="px-4 py-3 text-label-xs text-text-muted uppercase tracking-wider">Buy/Sell</th>
                    <th className="px-4 py-3 text-label-xs text-text-muted uppercase tracking-wider">Spread %</th>
                    <th className="px-4 py-3 text-label-xs text-text-muted uppercase tracking-wider">Imbalance</th>
                    <th className="px-4 py-3 text-label-xs text-text-muted uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-label-xs text-text-muted uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {data.snapshots.slice(0, 10).map((s, i) => (
                    <tr key={i} className="hover:bg-surface-hover transition-colors group">
                      <td className="px-4 py-3">
                        <MonoText className="text-text-secondary">{format(new Date(s.timestamp), 'HH:mm:ss')}</MonoText>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-heading-sm text-text-primary">{s.paymentMethod}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-label-sm text-status-healthy">₦{s.bestBuyPrice.toFixed(1)}</span>
                          <span className="text-label-sm text-status-incident">₦{s.bestSellPrice.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-heading-sm",
                            s.spreadPct > 3 ? "text-status-healthy" : "text-text-primary"
                          )}>{s.spreadPct.toFixed(2)}%</span>
                          {s.spreadPct > 3 && <ArrowUpRight className="w-3 h-3 text-status-healthy" />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-surface-border rounded-full overflow-hidden flex">
                            <div 
                              className="h-full bg-accent-primary" 
                              style={{ width: `${(0.5 + s.depthImbalance) * 100}%` }} 
                            />
                          </div>
                          <MonoText className="text-label-xs">{s.depthImbalance.toFixed(2)}</MonoText>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.healthFlag === 'OK' ? 'healthy' : 'degraded'} label={s.healthFlag} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <IconButton icon="menu-dots-vertical" variant="ghost" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CardFooter>
              <div className="flex items-center justify-between w-full">
                <span className="text-label-sm text-text-muted">Showing 10 of {data.snapshots.length} samples</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">Previous</Button>
                  <Button variant="ghost" size="sm">Next</Button>
                </div>
              </div>
            </CardFooter>
          </Card>

          <div className="space-y-6">
            <Card className="bg-[#111827] border-[#1F2937]">
              <CardHeader title="Risk & Health" icon="shield-minimalistic" />
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-surface-base border border-surface-border">
                    <div className="text-label-xs text-text-muted uppercase mb-1">Latency p50</div>
                    <div className="text-heading-md text-text-primary">{data.health.latencyP50}ms</div>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-base border border-surface-border">
                    <div className="text-label-xs text-text-muted uppercase mb-1">Latency p95</div>
                    <div className="text-heading-md text-status-degraded">{data.health.latencyP95}ms</div>
                  </div>
                </div>
                
                <StatRow label="Missing Sample Ratio" value={`${(data.health.missingSampleRatio * 100).toFixed(1)}%`} status="healthy" />
                <StatRow label="Last Ingest" value={format(new Date(data.health.lastIngest), 'HH:mm:ss')} />
                
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-label-sm text-text-secondary">Confidence Score</span>
                    <span className="text-heading-sm text-status-healthy">{data.health.confidenceScore}%</span>
                  </div>
                  <div className="h-2 bg-surface-border rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-status-healthy transition-all duration-1000" 
                      style={{ width: `${data.health.confidenceScore}%` }} 
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-[#111827] border-[#1F2937]">
              <CardHeader title="Quick Actions" icon="bolt" />
              <div className="p-4 grid grid-cols-2 gap-3">
                <ActionButton icon="refresh" label="Reset Stream" onClick={() => {}} />
                <ActionButton icon="export" label="Export CSV" onClick={() => {}} />
                <ActionButton icon="shield-minimalistic" label="Audit Logs" onClick={() => {}} />
                <ActionButton 
                  icon="close-circle" 
                  label="Kill Switch" 
                  onClick={() => setIsConfirmOpen(true)} 
                />
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom: History */}
        <Card className="bg-[#111827] border-[#1F2937]">
          <CardHeader 
            title="Spread History Analytics" 
            icon="pulse"
            actions={
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">Chart View</Button>
                <Button variant="secondary" size="sm">Table View</Button>
              </div>
            }
          />
          <div className="p-6">
            <div className="h-48 flex items-end gap-1">
              {data.history.map((h, i) => (
                <div 
                  key={i}
                  className="flex-1 bg-accent-primary/20 hover:bg-accent-primary/40 transition-colors rounded-t-sm relative group"
                  style={{ height: `${(h.avgSpreadPct / 4) * 100}%` }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                    <div className="bg-surface-overlay border border-surface-border p-2 rounded shadow-raised whitespace-nowrap">
                      <div className="text-label-xs text-text-muted">{format(new Date(h.bucketStart), 'MMM d, HH:mm')}</div>
                      <div className="text-heading-sm text-text-primary">Avg: {h.avgSpreadPct.toFixed(2)}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-label-xs text-text-muted">
              <span>{format(new Date(data.history[data.history.length - 1].bucketStart), 'HH:mm')}</span>
              <span>{format(new Date(data.history[Math.floor(data.history.length / 2)].bucketStart), 'HH:mm')}</span>
              <span>{format(new Date(data.history[0].bucketStart), 'HH:mm')}</span>
            </div>
          </div>
        </Card>
      </div>

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setIsConfirmOpen(false);
          // Handle kill switch
        }}
        title="Trigger Emergency Kill Switch?"
        message="This will immediately halt all P2P trading operations and disconnect active streams. This action is logged and requires manual intervention to restore."
        confirmLabel="Execute Kill Switch"
        destructive={true}
      />
    </main>
  );
};
