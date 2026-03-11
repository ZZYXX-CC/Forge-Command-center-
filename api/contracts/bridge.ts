export interface BridgeP2PSchema {
  schemaVersion: string;
  kpis: string[];
  sections: string[];
  fallback: string[];
}

export interface BridgeP2PDto {
  bestBuyPrice: number;
  bestSellPrice: number;
  mySpread: number;
  activeOrders: number;
  activeAds: Array<{ id: string; paymentMethod: string; buy: number; sell: number }>;
  recentTrades: Array<{ id: string; side: 'BUY' | 'SELL'; amount: number; price: number; timestamp: string }>;
  tradeHistory: Array<{ bucketStart: string; avgSpreadPct: number; samples: number }>;
  generatedAt: string;
}
