export default function handler(req: any, res: any) {
  const timeframe = (req.query.timeframe as string) || '1H';
  const now = Date.now();
  const chartData = Array.from({ length: timeframe === '1W' ? 40 : timeframe === '1D' ? 24 : timeframe === '4H' ? 32 : 20 }).map((_, i) => ({
    timestamp: new Date(now - (60 - i) * 60000).toISOString(),
    pnl: 900 + Math.round(Math.sin(i / 3) * 180 + i * 8),
  }));

  res.status(200).json({
    health: { mode: 'LIVE', auth: 'connected', ws: 'connected', orderApi: 'healthy', lastUpdate: new Date(now - 4000).toISOString(), isStale: false },
    pnl: { session: 1245.5, day: 1840.2, week: 9320.7, realized: 7020.1, unrealized: 2300.4, marginUsage: 38.2, totalOpenRisk: 11.5, maxDrawdown: 4.2, drawdownLimit: 8 },
    positions: [
      { id: 'p1', symbol: 'BTCUSDT', side: 'LONG', size: 0.25, entry: 64200, mark: 64810, liq: 59100, uPnL: 152.5, roe: 4.8, age: '2h 12m', strategy: 'TrendFollower', riskFlag: 'low' },
      { id: 'p2', symbol: 'ETHUSDT', side: 'SHORT', size: 1.8, entry: 3420, mark: 3378, liq: 3690, uPnL: 75.6, roe: 3.2, age: '49m', strategy: 'MeanRevert', riskFlag: 'none' }
    ],
    orders: [
      { id: 'o1', symbol: 'BTCUSDT', side: 'BUY', type: 'LIMIT', status: 'open', price: 64550, amount: 0.12, filledAmount: 0, timestamp: new Date(now - 30000).toISOString() },
      { id: 'o2', symbol: 'SOLUSDT', side: 'SELL', type: 'MARKET', status: 'filled', amount: 120, filledAmount: 120, timestamp: new Date(now - 90000).toISOString() }
    ],
    strategies: [
      { id: 's1', name: 'TrendFollower_V2', state: 'running', heartbeatAge: '3s', lastSignal: 'BUY BTCUSDT', consecutiveLosses: 0 },
      { id: 's2', name: 'MeanReversion_X', state: 'running', heartbeatAge: '4s', lastSignal: 'SELL ETHUSDT', consecutiveLosses: 1 }
    ],
    risk: { maxRiskPerTrade: 1.5, maxOpenPositions: 8, dailyLossLimit: 6, circuitBreakerStatus: 'inactive', killSwitchEnabled: false },
    incidents: [
      { id: 'ti-1', severity: 'low', title: 'Exchange latency spike detected', firstSeen: new Date(now - 15 * 60000).toISOString(), suggestedAction: 'Monitor / failover if > 250ms', acknowledged: false }
    ],
    decisions: [
      { id: 'd1', timestamp: new Date(now - 120000).toISOString(), strategy: 'TrendFollower_V2', action: 'BUY', symbol: 'BTCUSDT', reason: 'Breakout + volume confirmation', confidence: 0.82 },
      { id: 'd2', timestamp: new Date(now - 360000).toISOString(), strategy: 'MeanReversion_X', action: 'SELL', symbol: 'ETHUSDT', reason: 'RSI overbought at resistance', confidence: 0.71 }
    ],
    chartData,
  });
}
