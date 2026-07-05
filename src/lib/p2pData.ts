import type {
  P2PState,
  P2PSpreadSnapshot,
  P2PHeatmapCell,
  P2PAd,
  P2POrder,
} from '@/src/types';
// import { convex } from '@/src/lib/convex';

const USE_CONVEX_MOCK = true;

function generateMockP2PState(): P2PState {
  const now = Date.now();
  const token = 'USDT';
  const fiat = 'NGN';

  const snapshots: P2PSpreadSnapshot[] = Array.from({ length: 8 }).map((_, i) => {
    const buy = 1492 + i * 2;
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
  });

  const heatmap: P2PHeatmapCell[] = Array.from({ length: 24 }, (_, i) => i).flatMap((hour) =>
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
      hour,
      day,
      opportunityScore: Math.floor(35 + Math.random() * 60),
    }))
  );

  const myAds: P2PAd[] = [
    { id: 'ad-1', side: 'BUY', price: 1496, quantity: 1800, completionRate: 94, status: 'active' },
    { id: 'ad-2', side: 'SELL', price: 1532, quantity: 1400, completionRate: 89, status: 'active' },
    { id: 'ad-3', side: 'BUY', price: 1498, quantity: 500, completionRate: 100, status: 'paused' },
  ];

  const pendingOrders: P2POrder[] = [
    { id: 'po-1', side: 'BUY', amount: 250, price: 1495, status: 'pending_payment', counterparty: 'user_***abc', timestamp: new Date(now - 180000).toISOString() },
    { id: 'po-2', side: 'SELL', amount: 100, price: 1530, status: 'paid', counterparty: 'user_***xyz', timestamp: new Date(now - 60000).toISOString() },
  ];

  const recentTrades: P2POrder[] = Array.from({ length: 5 }).map((_, i) => ({
    id: `rt-${i + 1}`,
    side: (i % 2 === 0 ? 'BUY' : 'SELL') as 'BUY' | 'SELL',
    amount: 150 + i * 20,
    price: 1510 + i * 2,
    status: 'completed' as const,
    counterparty: `user_***${String.fromCharCode(97 + i)}`,
    timestamp: new Date(now - i * 23 * 60000).toISOString(),
  }));

  return {
    pair: `${token}/${fiat}`,
    lastSync: new Date(now).toISOString(),
    streamHealth: 'HEALTHY',
    kpis: {
      spread: 2.76,
      spreadChange: 0.18,
      topOfBook: 1510,
      volatility: 0.48,
      liquidityProxy: 12840,
    },
    snapshots,
    heatmap,
    myAds,
    pendingOrders,
    recentTrades,
  };
}

export async function fetchP2PState(): Promise<P2PState> {
  if (!USE_CONVEX_MOCK) {
    // const data = await convex.query(api.p2p.getState);
    // return data;
  }
  return generateMockP2PState();
}
