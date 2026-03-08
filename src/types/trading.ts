import { z } from 'zod';

export const TradingModeSchema = z.enum(['PAPER', 'DEMO', 'LIVE']);
export type TradingMode = z.infer<typeof TradingModeSchema>;

export const EndpointStatusSchema = z.enum(['connected', 'disconnected', 'degraded', 'stale']);
export type EndpointStatus = z.infer<typeof EndpointStatusSchema>;

export const TradingHealthSchema = z.object({
  mode: TradingModeSchema,
  auth: EndpointStatusSchema,
  ws: EndpointStatusSchema,
  orderApi: EndpointStatusSchema,
  lastUpdate: z.string(),
  isStale: z.boolean(),
});
export type TradingHealth = z.infer<typeof TradingHealthSchema>;

export const PnLSummarySchema = z.object({
  session: z.number(),
  day: z.number(),
  week: z.number(),
  realized: z.number(),
  unrealized: z.number(),
  marginUsage: z.number(), // percentage 0-100
  totalOpenRisk: z.number(),
  maxDrawdown: z.number(),
  drawdownLimit: z.number(),
});
export type PnLSummary = z.infer<typeof PnLSummarySchema>;

export const PositionSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  side: z.enum(['LONG', 'SHORT']),
  size: z.number(),
  entry: z.number(),
  mark: z.number(),
  liq: z.number(),
  uPnL: z.number(),
  roe: z.number(),
  age: z.string(),
  strategy: z.string(),
  riskFlag: z.enum(['none', 'low', 'medium', 'high']),
});
export type Position = z.infer<typeof PositionSchema>;

export const OrderSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  side: z.enum(['BUY', 'SELL']),
  type: z.string(),
  status: z.enum(['filled', 'canceled', 'rejected', 'open']),
  price: z.number().optional(),
  amount: z.number(),
  filledAmount: z.number(),
  timestamp: z.string(),
  rejectReason: z.string().optional(),
  retCode: z.number().optional(),
});
export type Order = z.infer<typeof OrderSchema>;

export const StrategySchema = z.object({
  id: z.string(),
  name: z.string(),
  state: z.enum(['running', 'paused', 'error']),
  heartbeatAge: z.string(),
  lastSignal: z.string(),
  consecutiveLosses: z.number(),
});
export type Strategy = z.infer<typeof StrategySchema>;

export const RiskConfigSchema = z.object({
  maxRiskPerTrade: z.number(),
  maxOpenPositions: z.number(),
  dailyLossLimit: z.number(),
  circuitBreakerStatus: z.enum(['active', 'tripped']),
  killSwitchEnabled: z.boolean(),
});
export type RiskConfig = z.infer<typeof RiskConfigSchema>;

export const TradingIncidentSchema = z.object({
  id: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string(),
  firstSeen: z.string(),
  suggestedAction: z.string(),
  acknowledged: z.boolean(),
});
export type TradingIncident = z.infer<typeof TradingIncidentSchema>;

export const DecisionSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  strategy: z.string(),
  action: z.enum(['BUY', 'SELL', 'HOLD', 'CLOSE']),
  symbol: z.string(),
  reason: z.string(),
  confidence: z.number(),
});
export type Decision = z.infer<typeof DecisionSchema>;

export const TradingStateSchema = z.object({
  health: TradingHealthSchema,
  pnl: PnLSummarySchema,
  positions: z.array(PositionSchema),
  orders: z.array(OrderSchema),
  strategies: z.array(StrategySchema),
  risk: RiskConfigSchema,
  incidents: z.array(TradingIncidentSchema),
  decisions: z.array(DecisionSchema),
  chartData: z.array(z.object({
    timestamp: z.string(),
    pnl: z.number(),
  })),
});
export type TradingState = z.infer<typeof TradingStateSchema>;
