import { z } from 'zod';

export const P2PMarketSnapshotSchema = z.object({
  timestamp: z.string(),
  token: z.string(),
  fiat: z.string(),
  paymentMethod: z.string(),
  bestBuyPrice: z.number(),
  bestSellPrice: z.number(),
  spreadAbs: z.number(),
  spreadPct: z.number(),
  buyDepthTop5: z.number(),
  sellDepthTop5: z.number(),
  depthImbalance: z.number(),
  volatility1h: z.number(),
  sampleCount: z.number(),
  healthFlag: z.enum(['OK', 'DEGRADED', 'CRITICAL']),
});

export type P2PMarketSnapshot = z.infer<typeof P2PMarketSnapshotSchema>;

export const P2PSpreadHistorySchema = z.object({
  bucketStart: z.string(),
  bucketEnd: z.string(),
  avgSpreadPct: z.number(),
  minSpreadPct: z.number(),
  maxSpreadPct: z.number(),
  p50SpreadPct: z.number(),
  p90SpreadPct: z.number(),
  volatility: z.number(),
  avgDepthImbalance: z.number(),
  samples: z.number(),
});

export type P2PSpreadHistory = z.infer<typeof P2PSpreadHistorySchema>;

export const P2PTradingStateSchema = z.object({
  pair: z.string(),
  lastSync: z.string(),
  streamHealth: z.enum(['HEALTHY', 'DEGRADED', 'OFFLINE']),
  kpis: z.object({
    spread: z.number(),
    spreadChange: z.number(),
    topOfBook: z.number(),
    volatility: z.number(),
    liquidityProxy: z.number(),
  }),
  snapshots: z.array(P2PMarketSnapshotSchema),
  history: z.array(P2PSpreadHistorySchema),
  heatmap: z.array(z.object({
    hour: z.number(),
    day: z.string(),
    opportunityScore: z.number(), // 0-100
  })),
  alerts: z.array(z.object({
    id: z.string(),
    timestamp: z.string(),
    type: z.enum(['INFO', 'WARNING', 'CRITICAL']),
    message: z.string(),
    rule: z.string(),
  })),
  health: z.object({
    latencyP50: z.number(),
    latencyP95: z.number(),
    missingSampleRatio: z.number(),
    lastIngest: z.string(),
    confidenceScore: z.number(),
  })
});

export type P2PTradingState = z.infer<typeof P2PTradingStateSchema>;

export interface TradingHealth {
  mode: 'LIVE' | 'PAPER' | 'BACKTEST';
  auth: 'connected' | 'disconnected' | 'error';
  ws: 'connected' | 'disconnected' | 'reconnecting';
  orderApi: 'healthy' | 'degraded' | 'offline';
  lastUpdate: string;
  isStale: boolean;
}

export interface PnLSummary {
  session: number;
  day: number;
  week: number;
  realized: number;
  unrealized: number;
  marginUsage: number;
  totalOpenRisk: number;
  maxDrawdown: number;
  drawdownLimit: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: number;
  entry: number;
  mark: number;
  liq: number;
  uPnL: number;
  roe: number;
  age: string;
  strategy: string;
  riskFlag: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

export interface Order {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET' | 'STOP';
  status: 'open' | 'filled' | 'canceled' | 'rejected';
  price?: number;
  amount: number;
  filledAmount: number;
  timestamp: string;
  rejectReason?: string;
  retCode?: number;
}

export interface Strategy {
  id: string;
  name: string;
  state: 'running' | 'paused' | 'error' | 'idle';
  heartbeatAge: string;
  lastSignal: string;
  consecutiveLosses: number;
}

export interface RiskConfig {
  maxRiskPerTrade: number;
  maxOpenPositions: number;
  dailyLossLimit: number;
  circuitBreakerStatus: 'active' | 'inactive';
  killSwitchEnabled: boolean;
}

export interface TradingIncident {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  firstSeen: string;
  suggestedAction: string;
  acknowledged: boolean;
}

export interface Decision {
  id: string;
  timestamp: string;
  strategy: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  symbol: string;
  reason: string;
  confidence: number;
}

export interface TradingState {
  health: TradingHealth;
  pnl: PnLSummary;
  positions: Position[];
  orders: Order[];
  strategies: Strategy[];
  risk: RiskConfig;
  incidents: TradingIncident[];
  decisions: Decision[];
  chartData: { timestamp: string; pnl: number }[];
}
