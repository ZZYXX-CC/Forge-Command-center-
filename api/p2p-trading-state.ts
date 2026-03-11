export default function handler(req: any, res: any) {
  const timeRange = (req.query.timeRange as string) || '24h';
  const token = (req.query.token as string) || 'USDT';
  const fiat = (req.query.fiat as string) || 'NGN';
  const now = Date.now();

  res.status(200).json({
    pair: `${token}/${fiat}`,
    lastSync: new Date(now).toISOString(),
    streamHealth: 'HEALTHY',
    kpis: {
      spread: token === 'BTC' ? 1.35 : 2.76,
      spreadChange: 0.18,
      topOfBook: token === 'BTC' ? 101_200_000 : 1510,
      volatility: timeRange === '1h' ? 0.22 : 0.48,
      liquidityProxy: token === 'BTC' ? 92 : 12840,
    },
    snapshots: Array.from({ length: 8 }).map((_, i) => {
      const buy = (token === 'BTC' ? 100_800_000 : 1492) + i * 2;
      const sell = buy * 1.0276;
      const spreadAbs = sell - buy;
      return {
        timestamp: new Date(now - i * 5 * 60000).toISOString(),
        token,
        fiat,
        paymentMethod: 'Bank Transfer',
        bestBuyPrice: Number(buy.toFixed(2)),
        bestSellPrice: Number(sell.toFixed(2)),
        spreadAbs: Number(spreadAbs.toFixed(2)),
        spreadPct: Number(((spreadAbs / buy) * 100).toFixed(3)),
        buyDepthTop5: 4000 + i * 300,
        sellDepthTop5: 3900 + i * 240,
        depthImbalance: Number(((4000 + i * 300) / (3900 + i * 240)).toFixed(3)),
        volatility1h: Number((0.21 + i * 0.01).toFixed(3)),
        sampleCount: 120 + i,
        healthFlag: i > 6 ? 'DEGRADED' : 'OK',
      };
    }),
    history: Array.from({ length: 12 }).map((_, i) => ({
      bucketStart: new Date(now - (12 - i) * 3600000).toISOString(),
      bucketEnd: new Date(now - (11 - i) * 3600000).toISOString(),
      avgSpreadPct: Number((2.1 + Math.sin(i / 2) * 0.4).toFixed(3)),
      minSpreadPct: 1.2,
      maxSpreadPct: 3.6,
      p50SpreadPct: 2.2,
      p90SpreadPct: 3.1,
      volatility: Number((0.25 + i * 0.01).toFixed(3)),
      avgDepthImbalance: Number((1.01 + i * 0.005).toFixed(3)),
      samples: 100 + i * 4,
    })),
    heatmap: Array.from({ length: 24 }).flatMap((_, hour) =>
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({ hour, day, opportunityScore: Math.floor(35 + Math.random() * 60) }))
    ),
    alerts: [
      { id: 'a1', timestamp: new Date(now - 7 * 60000).toISOString(), type: 'WARNING', message: 'Spread widened above 2.5%', rule: 'spread_pct > 2.5' },
      { id: 'a2', timestamp: new Date(now - 22 * 60000).toISOString(), type: 'INFO', message: 'Liquidity normalized', rule: 'buy_depth_top5 > 3500' },
    ],
    activeAds: [
      { id: 'ad-1', side: 'BUY', price: token === 'BTC' ? 100_900_000 : 1496, quantity: token === 'BTC' ? 0.06 : 1800, completionRate: 94, paymentMethods: ['Bank Transfer'], status: 'ACTIVE' },
      { id: 'ad-2', side: 'SELL', price: token === 'BTC' ? 103_300_000 : 1532, quantity: token === 'BTC' ? 0.05 : 1400, completionRate: 89, paymentMethods: ['Bank Transfer', 'Opay'], status: 'ACTIVE' },
    ],
    recentTrades: Array.from({ length: 10 }).map((_, i) => ({
      id: `rt-${i + 1}`,
      timestamp: new Date(now - i * 23 * 60000).toISOString(),
      side: i % 2 === 0 ? 'BUY' : 'SELL',
      usdtAmount: 150 + i * 20,
      fiatAmount: (150 + i * 20) * (token === 'BTC' ? 1 : 1510),
      counterpartyRating: 4.6,
      durationMinutes: 8 + i,
      status: 'COMPLETED',
    })),
    tradeHistory: Array.from({ length: 12 }).map((_, i) => ({
      id: `th-${i + 1}`,
      timestamp: new Date(now - i * 6 * 3600000).toISOString(),
      side: i % 2 === 0 ? 'BUY' : 'SELL',
      status: 'COMPLETED',
      usdtAmount: 120 + i * 30,
      fiatAmount: (120 + i * 30) * (token === 'BTC' ? 1 : 1505),
      paymentMethod: i % 3 === 0 ? 'Bank Transfer' : 'Opay',
    })),
    health: { latencyP50: 180, latencyP95: 420, missingSampleRatio: 0.02, lastIngest: new Date(now - 3000).toISOString(), confidenceScore: 93 },
  });
}
