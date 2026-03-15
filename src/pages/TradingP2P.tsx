import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/src/lib/utils';
import { 
  KPICard, 
  Card, 
  CardHeader, 
  CardFooter,
  StatRow,
  Badge,
  Button,
  IconButton,
  ActionButton,
  SearchInput,
  Select,
  FilterPillGroup,
  StatusBadge,
  LiveIndicator,
  MonoText,
  ConfirmDialog,
} from '@/src/components/ui';
import { SpreadHeatmap } from '@/src/components/ui/SpreadHeatmap';
import { P2PTradingState } from '@/src/types/trading';
import { format } from 'date-fns';
import { generateMockP2PData } from '@/src/lib/mockData';
import { ForgeIcon } from '@/src/components/primitives/ForgeIcon';

export const TradingP2P: React.FC = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [token, setToken] = useState('USDT');
  const [fiat, setFiat] = useState('NGN');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<P2PTradingState>({
    queryKey: ['p2p-trading-state', timeRange, token, fiat],
    queryFn: async () => {
      // Simulating network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return generateMockP2PData();
    },
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] gap-4">
        <ForgeIcon name="refresh" size="xl" className="text-emerald-accent animate-spin" />
        <span className="text-label-md animate-pulse uppercase tracking-widest text-text-muted">Synchronizing P2P Market Data...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] p-4 text-center">
        <div className="max-w-md w-full p-8 bg-surface-raised border border-status-incident rounded-lg shadow-raised">
          <ForgeIcon name="danger-triangle" size="xl" className="text-status-incident mx-auto mb-4" />
          <h2 className="text-heading-lg text-text-primary mb-2 uppercase tracking-tighter">Market Feed Lost</h2>
          <p className="text-body-md text-text-secondary mb-6">Unable to load P2P trading data. Check your network or system status.</p>
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
    <main className="flex-1 p-4 lg:p-6 overflow-y-auto bg-surface-base">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-heading-lg sm:text-display-md font-bold text-text-primary uppercase tracking-tighter">{data.pair}</h1>
              <LiveIndicator label="Live Stream" />
            </div>
            <div className="flex items-center gap-2 text-label-xs sm:text-label-sm text-text-secondary">
              <ForgeIcon name="clock-circle" size="xs" />
              <span>Last sync: {format(new Date(data.lastSync), 'HH:mm:ss')}</span>
              <span className="mx-1">•</span>
              <ForgeIcon name="pulse" size="xs" className="text-status-healthy" />
              <span className="text-status-healthy">Health: {data.streamHealth}</span>
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
        <div className="grid grid-cols-1 xs:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          <KPICard 
            label="Live Spread"
            value={`${data.kpis.spread}%`}
            delta={data.kpis.spreadChange}
            icon="graph-new"
          />
          <Card className="bg-surface-raised border-surface-border">
            <CardHeader 
              title="Top-of-Book" 
              icon="layers"
              actions={<Badge variant="success">Tight</Badge>}
            />
            <div className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-label-xs text-text-muted uppercase tracking-wider">Best Buy</div>
                  <div className="text-heading-md text-status-healthy font-mono">₦{data.kpis.topOfBook.toLocaleString()}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-label-xs text-text-muted uppercase tracking-wider">Best Sell</div>
                  <div className="text-heading-md text-status-incident font-mono">₦{(data.kpis.topOfBook * 1.0276).toLocaleString()}</div>
                </div>
              </div>
              <div className="h-1 bg-surface-base rounded-full overflow-hidden flex">
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
          <Card className="xl:col-span-2 bg-surface-raised border-surface-border">
            <CardHeader title="Hourly Spread Opportunity" icon="chart-square" />
            <div className="p-6 overflow-x-auto no-scrollbar">
              <SpreadHeatmap data={data.heatmap} />
            </div>
          </Card>

          <Card className="bg-surface-raised border-surface-border flex flex-col">
            <CardHeader title="Operational Alerts" icon="danger-triangle" />
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
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
                    <ForgeIcon 
                      name={alert.type === 'CRITICAL' ? "fire" : alert.type === 'WARNING' ? "shield-warning" : "info-circle"} 
                      size="sm" 
                    />
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
          <Card className="xl:col-span-2 bg-surface-raised border-surface-border">
            <CardHeader 
              title="Market Snapshots" 
              icon="layers"
              actions={
                <div className="flex items-center gap-2">
                  <div className="hidden sm:block">
                    <SearchInput placeholder="Filter snapshots..." className="w-48" />
                  </div>
                  <IconButton icon="filter" variant="ghost" />
                </div>
              }
            />
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-base/30">
                    <th className="px-4 py-3 text-label-xs text-text-muted uppercase tracking-wider">Timestamp</th>
                    <th className="px-4 py-3 text-label-xs text-text-muted uppercase tracking-wider">Method</th>
                    <th className="px-4 py-3 text-label-xs text-text-muted uppercase tracking-wider">Buy/Sell</th>
                    <th className="px-4 py-3 text-label-xs text-text-muted uppercase tracking-wider">Spread %</th>
                    <th className="px-4 py-3 text-label-xs text-text-muted uppercase tracking-wider hidden sm:table-cell">Imbalance</th>
                    <th className="px-4 py-3 text-label-xs text-text-muted uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-label-xs text-text-muted uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {data.snapshots.slice(0, 10).map((s, i) => (
                    <tr key={i} className="hover:bg-surface-hover transition-colors group">
                      <td className="px-4 py-3">
                        <MonoText className="text-text-secondary text-[10px] sm:text-label-xs">{format(new Date(s.timestamp), 'HH:mm:ss')}</MonoText>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-label-xs sm:text-heading-sm text-text-primary truncate max-w-[80px] sm:max-w-none">{s.paymentMethod}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] sm:text-label-sm text-status-healthy font-mono">₦{s.bestBuyPrice.toFixed(1)}</span>
                          <span className="text-[10px] sm:text-label-sm text-status-incident font-mono">₦{s.bestSellPrice.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-label-sm sm:text-heading-sm font-mono",
                            s.spreadPct > 3 ? "text-status-healthy" : "text-text-primary"
                          )}>{s.spreadPct.toFixed(2)}%</span>
                          {s.spreadPct > 3 && <ForgeIcon name="graph-up" size="xs" className="text-status-healthy" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-surface-base rounded-full overflow-hidden flex">
                            <div 
                              className="h-full bg-emerald-accent" 
                              style={{ width: `${(0.5 + s.depthImbalance) * 100}%` }} 
                            />
                          </div>
                          <MonoText className="text-[10px]">{s.depthImbalance.toFixed(2)}</MonoText>
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
              <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
                <span className="text-label-xs text-text-muted">Showing 10 of {data.snapshots.length} samples</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">Previous</Button>
                  <Button variant="ghost" size="sm">Next</Button>
                </div>
              </div>
            </CardFooter>
          </Card>

          <div className="space-y-6">
            <Card className="bg-surface-raised border-surface-border">
              <CardHeader title="Risk & Health" icon="shield-minimalistic" />
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-surface-base border border-surface-border">
                    <div className="text-label-xs text-text-muted uppercase mb-1">Latency p50</div>
                    <div className="text-heading-md text-text-primary font-mono">{data.health.latencyP50}ms</div>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-base border border-surface-border">
                    <div className="text-label-xs text-text-muted uppercase mb-1">Latency p95</div>
                    <div className="text-heading-md text-status-degraded font-mono">{data.health.latencyP95}ms</div>
                  </div>
                </div>
                
                <StatRow label="Missing Sample Ratio" value={`${(data.health.missingSampleRatio * 100).toFixed(1)}%`} status="healthy" />
                <StatRow label="Last Ingest" value={format(new Date(data.health.lastIngest), 'HH:mm:ss')} />
                
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-label-sm text-text-secondary">Confidence Score</span>
                    <span className="text-heading-sm text-status-healthy font-mono">{data.health.confidenceScore}%</span>
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

            <Card className="bg-surface-raised border-surface-border">
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
        <Card className="bg-surface-raised border-surface-border">
          <CardHeader 
            title="Spread History Analytics" 
            icon="pulse"
            actions={
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Chart View</Button>
                <Button variant="secondary" size="sm">Table View</Button>
              </div>
            }
          />
          <div className="p-6">
            <div className="h-48 flex items-end gap-1">
              {data.history.map((h, i) => (
                <div 
                  key={i}
                  className="flex-1 bg-emerald-accent/20 hover:bg-emerald-accent/40 transition-colors rounded-t-sm relative group"
                  style={{ height: `${(h.avgSpreadPct / 4) * 100}%` }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                    <div className="bg-surface-overlay border border-surface-border p-2 rounded shadow-raised whitespace-nowrap">
                      <div className="text-label-xs text-text-muted">{format(new Date(h.bucketStart), 'MMM d, HH:mm')}</div>
                      <div className="text-heading-sm text-text-primary font-mono">Avg: {h.avgSpreadPct.toFixed(2)}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-label-xs text-text-muted font-mono">
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
