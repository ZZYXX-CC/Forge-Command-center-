import type {
  TradingState,
  TradingHealth,
  TradingPnL,
  TradingPosition,
  TradingOrder,
  TradingStrategy,
  TradingRisk,
  TradingDecision,
} from '@/src/types';
// import { convex } from '@/src/lib/convex';

const USE_CONVEX_MOCK = true;

function generateMockTradingState(): TradingState {
  const now = Date.now();

  const health: TradingHealth = {
    mode: 'LIVE',
    auth: 'connected',
    ws: 'connected',
    orderApi: 'healthy',
    lastUpdate: new Date(now - 4000).toISOString(),
    isStale: false,
  };

  const pnl = {
    session: 1245.5,
    day: 1840.2,
    week: 9320.7,
    realized: 7020.1,
    unrealized: 2300.4,
    marginUsage: 38.2,
    totalOpenRisk: 11.5,
    maxDrawdown: 4.2,
    drawdownLimit: 8,
  };

  const positions: TradingPosition[] = [
    { id: 'p1', symbol: 'BTCUSDT', side: 'LONG', size: 0.25, entry: 64200, mark: 64810, liq: 59100, uPnL: 152.5, roe: 4.8, age: '2h 12m', strategy: 'TrendFollower_V2', riskFlag: 'low' },
    { id: 'p2', symbol: 'ETHUSDT', side: 'SHORT', size: 1.8, entry: 3420, mark: 3378, liq: 3690, uPnL: 75.6, roe: 3.2, age: '49m', strategy: 'MeanReversion_X', riskFlag: 'none' },
    { id: 'p3', symbol: 'SOLUSDT', side: 'LONG', size: 85, entry: 168.2, mark: 172.1, liq: 145, uPnL: 331.5, roe: 2.3, age: '1h 05m', strategy: 'TrendFollower_V2', riskFlag: 'low' },
  ];

  const orders: TradingOrder[] = [
    { id: 'o1', symbol: 'BTCUSDT', side: 'BUY', type: 'LIMIT', status: 'open', price: 64550, amount: 0.12, filledAmount: 0, timestamp: new Date(now - 30000).toISOString() },
    { id: 'o2', symbol: 'SOLUSDT', side: 'SELL', type: 'MARKET', status: 'filled', amount: 120, filledAmount: 120, timestamp: new Date(now - 90000).toISOString() },
    { id: 'o3', symbol: 'ETHUSDT', side: 'SELL', type: 'STOP', status: 'open', price: 3380, amount: 0.5, filledAmount: 0, timestamp: new Date(now - 60000).toISOString() },
  ];

  const strategies: TradingStrategy[] = [
    { id: 's1', name: 'TrendFollower_V2', state: 'running', heartbeatAge: '3s', lastSignal: new Date(now - 120000).toISOString(), consecutiveLosses: 0, pnl: 1245, winRate: 0.68 },
    { id: 's2', name: 'MeanReversion_X', state: 'running', heartbeatAge: '4s', lastSignal: new Date(now - 360000).toISOString(), consecutiveLosses: 1, pnl: -120, winRate: 0.55 },
    { id: 's3', name: 'GridBot_5m', state: 'paused', heartbeatAge: '2m', lastSignal: new Date(now - 600000).toISOString(), consecutiveLosses: 0, pnl: 340, winRate: 0.72 },
    { id: 's4', name: 'Scalper_1m', state: 'running', heartbeatAge: '8s', lastSignal: new Date(now - 15000).toISOString(), consecutiveLosses: 2, pnl: -45, winRate: 0.48 },
  ];

  const risk: TradingRisk = {
    maxRiskPerTrade: 1.5,
    maxOpenPositions: 8,
    dailyLossLimit: 6,
    circuitBreakerStatus: 'active',
    killSwitchEnabled: false,
  };

  const decisions: TradingDecision[] = [
    { id: 'd1', timestamp: new Date(now - 120000).toISOString(), strategy: 'TrendFollower_V2', action: 'BUY', symbol: 'BTCUSDT', reason: 'Breakout + volume confirmation', confidence: 0.82 },
    { id: 'd2', timestamp: new Date(now - 360000).toISOString(), strategy: 'MeanReversion_X', action: 'SELL', symbol: 'ETHUSDT', reason: 'RSI overbought at resistance', confidence: 0.71 },
  ];

  const chartData = Array.from({ length: 20 }).map((_, i) => ({
    timestamp: new Date(now - (60 - i) * 60000).toISOString(),
    pnl: 900 + Math.round(Math.sin(i / 3) * 180 + i * 8),
  }));

  return {
    health,
    pnl,
    positions,
    orders,
    strategies,
    risk,
    decisions,
    incidents: [],
    chartData,
  };
}

export async function fetchTradingState(): Promise<TradingState> {
  if (!USE_CONVEX_MOCK) {
    // const data = await convex.query(api.trading.getState);
    // return data;
  }
  return generateMockTradingState();
}
