import type { BridgeP2PDto, BridgeP2PSchema } from '../contracts/bridge';

interface P2PLike {
  pair: string;
  snapshots: Array<{
    timestamp: string;
    paymentMethod: string;
    bestBuyPrice: number;
    bestSellPrice: number;
    spreadPct: number;
  }>;
  history: Array<{ bucketStart: string; avgSpreadPct: number; samples: number }>;
  lastSync: string;
}

export const mapP2PToBridge = (state: P2PLike): BridgeP2PDto => {
  const top = state.snapshots[0];

  return {
    bestBuyPrice: top?.bestBuyPrice ?? 0,
    bestSellPrice: top?.bestSellPrice ?? 0,
    mySpread: top?.spreadPct ?? 0,
    activeOrders: Math.min(state.snapshots.length, 6),
    activeAds: state.snapshots.slice(0, 5).map((s, index) => ({
      id: `ad-${index + 1}`,
      paymentMethod: s.paymentMethod,
      buy: s.bestBuyPrice,
      sell: s.bestSellPrice,
    })),
    recentTrades: state.snapshots.slice(0, 6).map((s, index) => ({
      id: `trade-${index + 1}`,
      side: index % 2 === 0 ? 'BUY' : 'SELL',
      amount: 250,
      price: s.bestBuyPrice,
      timestamp: s.timestamp,
    })),
    tradeHistory: state.history.slice(0, 24).map((h) => ({
      bucketStart: h.bucketStart,
      avgSpreadPct: h.avgSpreadPct,
      samples: h.samples,
    })),
    generatedAt: state.lastSync,
  };
};

export const validateBridgeSections = (dto: BridgeP2PDto, schema: BridgeP2PSchema): string[] => {
  const keys = new Set(Object.keys(dto));
  return schema.sections.filter((section) => !keys.has(section));
};
