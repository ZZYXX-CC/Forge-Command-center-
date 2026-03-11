import test from 'node:test';
import assert from 'node:assert/strict';
import { mapOverviewToEdgeRisk, validateEdgeRequiredFields } from './edgeAdapter';
import { mapP2PToBridge, validateBridgeSections } from './bridgeAdapter';

test('edge adapter maps required fields', () => {
  const dto = mapOverviewToEdgeRisk({
    meta: { generatedAt: new Date().toISOString() },
    globalStatus: 'healthy',
    tradingSummary: {
      todayPnl: 100,
      openPositions: 2,
      riskStatus: 'within',
      activeStrategies: 4,
      lastOrderAt: new Date().toISOString(),
    },
    taskSummary: { completedToday: 12 },
    priorityAlerts: [],
  });

  const missing = validateEdgeRequiredFields(dto, {
    contractVersion: 'edge-risk-v1',
    required: ['botStatus', 'todayPnlUsd', 'openExposureUsd'],
    freshness: { snapshotTtlSec: 15, warningAfterSec: 30, breachAfterSec: 60 },
  });

  assert.equal(missing.length, 0);
});

test('bridge adapter includes schema sections', () => {
  const dto = mapP2PToBridge({
    pair: 'USDT/NGN',
    lastSync: new Date().toISOString(),
    snapshots: [{
      timestamp: new Date().toISOString(),
      paymentMethod: 'Bank Transfer',
      bestBuyPrice: 1540,
      bestSellPrice: 1580,
      spreadPct: 2.6,
    }],
    history: [{
      bucketStart: new Date().toISOString(),
      avgSpreadPct: 2.6,
      samples: 3600,
    }],
  });

  const missing = validateBridgeSections(dto, {
    schemaVersion: 'bridge-p2p-v1',
    kpis: ['bestBuyPrice', 'bestSellPrice', 'mySpread', 'activeOrders'],
    sections: ['activeAds', 'recentTrades', 'tradeHistory'],
    fallback: ['stale badge', 'partial render', 'retry with backoff'],
  });

  assert.equal(missing.length, 0);
});
