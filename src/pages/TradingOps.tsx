import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { TradingState } from '@/src/types/trading';
import { ExecutionHealthBar } from '@/src/components/trading/ExecutionHealthBar';
import { PnLExposureRow } from '@/src/components/trading/PnLExposureRow';
import { PositionsTable } from '@/src/components/trading/PositionsTable';
import { OrdersTape } from '@/src/components/trading/OrdersTape';
import { StrategyRuntimePanel } from '@/src/components/trading/StrategyRuntimePanel';
import { RiskGuardrailPanel } from '@/src/components/trading/RiskGuardrailPanel';
import { TradingIncidentFeed } from '@/src/components/trading/TradingIncidentFeed';
import { DecisionLog } from '@/src/components/trading/DecisionLog';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from '@/src/lib/utils';
import { TrendingUp, TrendingDown, Clock, Maximize2, Minimize2, Zap, X } from 'lucide-react';
import { generateMockTradingData } from '@/src/lib/mockData';

export const TradingOps: React.FC = () => {
  const navigate = useNavigate();
  const [isChartFullscreen, setIsChartFullscreen] = useState(false);
  const [timeframe, setTimeframe] = useState('1H');

  useEffect(() => {
    if (isChartFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isChartFullscreen]);

  const { data, isLoading, error } = useQuery<TradingState>({
    queryKey: ['trading-state', timeframe],
    queryFn: async () => {
      // Simulating network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return generateMockTradingData();
    },
    refetchInterval: 5000, // Refresh every 5s for trading
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] gap-4">
        <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-label-md animate-pulse">Synchronizing Trading Engine...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] p-4 text-center">
        <div className="max-w-md w-full p-6 bg-surface-raised border border-status-incident rounded-lg">
          <div className="text-status-incident text-display-lg mb-4">ENGINE DISCONNECTED</div>
          <p className="text-body-md text-text-secondary mb-6">
            Lost connection to the trading execution service. Retrying...
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-accent-primary text-text-inverse rounded-md font-bold hover:bg-accent-dim transition-colors"
          >
            Reconnect Manually
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-[1600px] mx-auto w-full">
      {/* Top Health Bar */}
      <ExecutionHealthBar health={data.health} />

      {/* Historical PnL Chart */}
      <div className={cn(
        "bg-surface-raised border border-surface-border rounded-lg p-4 flex flex-col gap-4 transition-all duration-300",
        isChartFullscreen ? "fixed inset-0 z-[100] rounded-none p-8 bg-surface-base" : "relative"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="text-label-sm font-bold text-text-primary uppercase tracking-wider whitespace-nowrap">Performance History</span>
            <div className="flex items-center gap-1.5">
              {['1H', '4H', '1D', '1W'].map((tf) => (
                <button 
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold transition-all",
                    timeframe === tf 
                      ? "bg-surface-overlay text-accent-primary border border-accent-primary/30" 
                      : "hover:bg-surface-hover text-text-muted"
                  )}
                >
                  {tf}
                </button>
              ))}
            </div>
            {!isChartFullscreen && (
              <button 
                onClick={() => navigate('/trading/p2p')}
                className="flex items-center gap-2 px-3 py-1 rounded bg-accent-subtle text-accent-primary border border-accent-primary/20 hover:bg-accent-subtle/80 transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                <span className="text-label-sm font-bold">P2P MONITORING</span>
              </button>
            )}
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-surface-border sm:border-none pt-3 sm:pt-0">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-mono-sm text-text-secondary">LIVE FEED</span>
            </div>
            <button 
              onClick={() => setIsChartFullscreen(!isChartFullscreen)}
              className="p-1 text-text-muted hover:text-text-primary transition-colors"
            >
              {isChartFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className={cn("w-full transition-all duration-300", isChartFullscreen ? "flex-1" : "h-[200px]")}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.chartData}>
              <defs>
                <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--emerald-accent)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--emerald-accent)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
              <XAxis 
                dataKey="timestamp" 
                hide 
              />
              <YAxis 
                stroke="var(--text-muted)" 
                fontSize={10} 
                tickFormatter={(val) => `$${val}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--surface-overlay)', border: '1px solid var(--surface-border)', borderRadius: '4px' }}
                itemStyle={{ color: 'var(--emerald-accent)', fontSize: '12px' }}
                labelStyle={{ color: 'var(--text-muted)', fontSize: '10px' }}
                formatter={(val: number) => [`$${val.toLocaleString()}`, 'PnL']}
                labelFormatter={(label) => new Date(label).toLocaleTimeString()}
              />
              <Area 
                type="monotone" 
                dataKey="pnl" 
                stroke="var(--emerald-accent)" 
                fillOpacity={1} 
                fill="url(#colorPnl)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* PnL + Exposure Row */}
      <PnLExposureRow pnl={data.pnl} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Positions & Orders */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <PositionsTable positions={data.positions} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-[400px]">
              <OrdersTape orders={data.orders} />
            </div>
            <div className="h-[400px]">
              <DecisionLog decisions={data.decisions} />
            </div>
          </div>
          <TradingIncidentFeed incidents={data.incidents} />
        </div>

        {/* Right Column: Strategies & Risk */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="h-[450px]">
            <StrategyRuntimePanel strategies={data.strategies} />
          </div>
          <div className="h-[350px]">
            <RiskGuardrailPanel risk={data.risk} />
          </div>
        </div>
      </div>
    </div>
  );
};
