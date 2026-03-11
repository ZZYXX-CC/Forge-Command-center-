const nowIso = () => new Date().toISOString();

export function overviewState() {
  const now = nowIso();
  return {
    meta: { generatedAt: now, freshnessOk: true, staleDomains: [] },
    globalStatus: 'degraded',
    incidentCount: 1,
    incidents: [{ id: 'inc-001', severity: 'critical', title: 'Order routing failure', affectedSystem: 'Trading Engine', durationMs: 840000, startedAt: new Date(Date.now() - 840000).toISOString() }],
    domains: [
      { id: 'overview', name: 'Morning Brief', status: 'healthy', lastCheckedAt: now },
      { id: 'trading', name: 'Trading Ops', status: 'healthy', mode: 'live', lastCheckedAt: now },
      { id: 'p2p', name: 'P2P Markets', status: 'healthy', lastCheckedAt: now },
      { id: 'sites', name: 'Sites', status: 'healthy', lastCheckedAt: now },
      { id: 'money', name: 'Money', status: 'healthy', lastCheckedAt: now },
      { id: 'tasks', name: 'Tasks', status: 'healthy', lastCheckedAt: now },
      { id: 'clients', name: 'Clients', status: 'healthy', lastCheckedAt: now },
      { id: 'bots', name: 'Bot Team', status: 'healthy', lastCheckedAt: now }
    ],
    tradingSummary: { mode: 'live', activeStrategies: 12, openPositions: 43, todayPnl: 1245.5, sessionPnl: 450.2, p2pActiveOrders: 2, riskStatus: 'within', lastOrderAt: new Date(Date.now() - 45000).toISOString() },
    sitesSummary: {
      totalSites: 12,
      healthySites: 11,
      uptimePct24H: 99.98,
      lastDeployAt: new Date(Date.now() - 4 * 3600_000).toISOString(),
      sites: [
        { id: 'site-1', name: 'nuvue.studio', status: 'healthy', uptimePct24H: 100 },
        { id: 'site-2', name: 'openclaw.io', status: 'healthy', uptimePct24H: 99.9 },
        { id: 'site-3', name: 'client-a.com', status: 'degraded', uptimePct24H: 98.5 },
      ]
    },
    moneySummary: { bybitUsdtBalance: 45200.5, fiatBalance: 1250000, unpaidInvoices: 8450, unpaidInvoicesCount: 3, thisMonthTradingIncome: 4200, thisMonthServiceIncome: 12500 },
    clientSummary: { activeProjects: 5, overdueDeliverables: 1, nextDeadline: { client: 'Acme Corp', daysRemaining: 2 } },
    taskSummary: {
      openTasks: 24,
      overdueCount: 2,
      completedToday: 15,
      dueToday: 8,
      topTasks: [
        { id: 'tsk-1', title: 'Review Acme deliverables', completed: false },
        { id: 'tsk-2', title: 'Update trading risk limits', completed: false },
      ]
    },
    botSummary: { totalBots: 6, activeBots: 5, errorBots: 0 },
    recentChanges: [
      { id: 'chg-1', occurredAt: new Date(Date.now() - 600000).toISOString(), type: 'BOT ACTION', description: 'TrendFollower_V2 scaled BTC position', actor: 'bot-1', domain: 'trading' },
      { id: 'chg-2', occurredAt: new Date(Date.now() - 1800000).toISOString(), type: 'DEPLOY', description: 'forge ui deployed', actor: 'iCHRIS', domain: 'sites' }
    ],
    priorityAlerts: [
      { id: 'alt-1', severity: 'high', title: 'Invoice #442 overdue (Acme Corp)', system: 'Finance', ageMs: 172800000, acknowledged: false },
      { id: 'alt-2', severity: 'medium', title: 'SSL cert expiring in 12 days', system: 'Sites', ageMs: 3600000, acknowledged: false },
    ]
  };
}

export function webOpsState(env = 'all') {
  const now = nowIso();
  return {
    meta: { generatedAt: now, environment: env, freshnessOk: true },
    kpis: { sitesUp: 7, sitesTotal: 8, uptimePct24H: 98.6, uptimeDelta: -0.4, activeSessions: 1243, sessionsDelta: 120, errors5xx1H: 14, errorsDelta: 8 },
    sites: [
      { id: 'site-1', name: 'App Main', domain: 'app.openclaw.io', environment: 'production', status: 'healthy', uptimePct24H: 99.9, latencyP95Ms: 120, lastCheckedAt: new Date(Date.now() - 30000).toISOString(), lastDeploy: { version: 'v2.4.1', deployedAt: new Date(Date.now() - 86400000).toISOString(), deployedBy: 'j.smith' }, errors1H: 0 },
      { id: 'site-3', name: 'CDN Assets', domain: 'cdn.openclaw.io', environment: 'production', status: 'degraded', uptimePct24H: 97.2, latencyP95Ms: 340, lastCheckedAt: new Date(Date.now() - 15000).toISOString(), lastDeploy: { version: 'v2.4.0', deployedAt: new Date(Date.now() - 259200000).toISOString(), deployedBy: 'm.ross' }, errors1H: 14, incidentId: 'inc-0041' },
      { id: 'site-5', name: 'Staging Environment', domain: 'staging.openclaw.io', environment: 'staging', status: 'healthy', uptimePct24H: 99.1, latencyP95Ms: 145, lastCheckedAt: new Date(Date.now() - 120000).toISOString(), lastDeploy: { version: 'v2.5.0b', deployedAt: new Date(Date.now() - 3600000).toISOString(), deployedBy: 'dev-bot' }, errors1H: 2 },
    ],
    errorLog: [
      { occurredAt: new Date(Date.now() - 60000).toISOString(), statusCode: 503, route: '/api/v1/orders', siteId: 'site-3', count: 8 },
      { occurredAt: new Date(Date.now() - 120000).toISOString(), statusCode: 500, route: '/assets/main.js', siteId: 'site-3', count: 6 },
    ],
    cdn: [
      { nodeId: 'node-1', region: 'US-EAST-1', regionEmoji: '🌎', status: 'degraded', cacheHitPct: 71, bandwidthGb: 2.3, lastPurgedAt: new Date(Date.now() - 2040000).toISOString(), incidentId: 'inc-0041' },
      { nodeId: 'node-2', region: 'US-WEST-2', regionEmoji: '🌎', status: 'healthy', cacheHitPct: 94, bandwidthGb: 1.8, lastPurgedAt: new Date(Date.now() - 7200000).toISOString() },
    ],
    certificates: [
      { domain: 'forge.app', expiresAt: new Date(Date.now() + 13 * 86400000).toISOString(), daysRemaining: 13, autoRenew: true, issuer: 'LetsEncrypt', status: 'expiring' },
      { domain: 'api.forge.app', expiresAt: new Date(Date.now() + 68 * 86400000).toISOString(), daysRemaining: 68, autoRenew: true, issuer: 'LetsEncrypt', status: 'healthy' },
    ],
    deployQueue: [
      { id: 'dq-1', service: 'forge-web', version: 'v2.4.2', status: 'in-progress', triggeredBy: 'iCHRIS', triggeredAt: new Date(Date.now() - 120000).toISOString(), progressPct: 65, etaSeconds: 90 },
      { id: 'dq-2', service: 'trading-api', version: 'v1.9.1', status: 'queued', triggeredBy: 'dev-bot', triggeredAt: new Date(Date.now() - 60000).toISOString() },
    ],
    alerts: [
      { id: 'wa-1', severity: 'high', title: 'CDN cache miss spike in US-EAST-1', siteId: 'site-3', ageMs: 18 * 60000, acknowledged: false },
      { id: 'wa-2', severity: 'low', title: 'Certificate entering renewal window', ageMs: 2 * 3600000, acknowledged: false },
    ],
    quickActions: [
      { id: 'qa-1', label: 'Purge CDN Cache', domain: 'web', destructive: false },
      { id: 'qa-2', label: 'Rollback Latest Deploy', domain: 'deployments', destructive: true },
      { id: 'qa-3', label: 'Scale API +1', domain: 'infra', destructive: false },
    ]
  };
}

export function deploymentState() {
  const now = nowIso();
  return {
    meta: { generatedAt: now, freshnessOk: true },
    kpis: { activeDeploys: 1, successRate24H: 92.3, avgDeployTimeSeconds: 385, failedLast24H: 1 },
    deployments: [
      { id: 'dep-1', service: 'forge-web', version: 'v2.4.2', environment: 'production', status: 'in-progress', deployedBy: 'iCHRIS', deployedAt: new Date(Date.now() - 120000).toISOString(), durationSeconds: 0, rollbackAvailable: true },
      { id: 'dep-2', service: 'trading-api', version: 'v1.9.0', environment: 'production', status: 'success', deployedBy: 'dev-bot', deployedAt: new Date(Date.now() - 2 * 3600000).toISOString(), durationSeconds: 411, rollbackAvailable: true, logsUrl: '#' },
    ],
    pipelines: [
      { id: 'pl-1', name: 'forge-web-release', status: 'running', lastRunStatus: 'success', lastRunAt: new Date(Date.now() - 3600000).toISOString(), progressPct: 67 },
      { id: 'pl-2', name: 'api-ci', status: 'idle', lastRunStatus: 'failed', lastRunAt: new Date(Date.now() - 7 * 3600000).toISOString(), nextScheduledAt: new Date(Date.now() + 3600000).toISOString() },
    ],
    infraStatus: [
      { provider: 'Vercel', region: 'iad1', status: 'healthy', latencyMs: 84 },
      { provider: 'Bybit WS', region: 'global', status: 'degraded', latencyMs: 182 },
    ]
  };
}

export function messagingState() {
  const now = nowIso();
  return {
    meta: { generatedAt: now, freshnessOk: true },
    kpis: { totalQueueDepth: 214, avgProcessingRate: 930, errorCount1H: 3, dlqTotal: 2 },
    queues: [
      { id: 'q-1', name: 'telegram-events', type: 'priority', status: 'healthy', depth: 48, consumers: 4, throughputPerMin: 530, errorRate1H: 0.2, dlqCount: 0, lastProcessedAt: new Date(Date.now() - 12000).toISOString() },
      { id: 'q-2', name: 'trade-signals', type: 'fifo', status: 'degraded', depth: 166, consumers: 2, throughputPerMin: 400, errorRate1H: 1.1, dlqCount: 2, lastProcessedAt: new Date(Date.now() - 48000).toISOString() },
    ],
    consumers: [
      { id: 'c-1', name: 'signal-worker-a', status: 'active', uptimeMs: 3_600_000, messagesProcessed: 10234, lastSeenAt: new Date(Date.now() - 10000).toISOString() },
      { id: 'c-2', name: 'notify-worker', status: 'idle', uptimeMs: 1_200_000, messagesProcessed: 812, lastSeenAt: new Date(Date.now() - 60000).toISOString() },
    ],
    dlqAlerts: [
      { id: 'd-1', queueId: 'q-2', messageId: 'm-1882', errorCode: 'TIMEOUT', occurredAt: new Date(Date.now() - 20 * 60000).toISOString() },
      { id: 'd-2', queueId: 'q-2', messageId: 'm-1889', errorCode: 'INVALID_PAYLOAD', occurredAt: new Date(Date.now() - 8 * 60000).toISOString() },
    ]
  };
}

export function tradingState(timeframe = '1H') {
  const now = Date.now();
  const chartData = Array.from({ length: timeframe === '1W' ? 40 : timeframe === '1D' ? 24 : timeframe === '4H' ? 32 : 20 }).map((_, i) => ({
    timestamp: new Date(now - (60 - i) * 60000).toISOString(),
    pnl: 900 + Math.round(Math.sin(i / 3) * 180 + i * 8)
  }));
  return {
    health: { mode: 'LIVE', auth: 'connected', ws: 'connected', orderApi: 'healthy', lastUpdate: new Date(now - 4000).toISOString(), isStale: false },
    pnl: { session: 1245.5, day: 1840.2, week: 9320.7, realized: 7020.1, unrealized: 2300.4, marginUsage: 38.2, totalOpenRisk: 11.5, maxDrawdown: 4.2, drawdownLimit: 8 },
    positions: [
      { id: 'p1', symbol: 'BTCUSDT', side: 'LONG', size: 0.25, entry: 64200, mark: 64810, liq: 59100, uPnL: 152.5, roe: 4.8, age: '2h 12m', strategy: 'TrendFollower', riskFlag: 'low' },
      { id: 'p2', symbol: 'ETHUSDT', side: 'SHORT', size: 1.8, entry: 3420, mark: 3378, liq: 3690, uPnL: 75.6, roe: 3.2, age: '49m', strategy: 'MeanRevert', riskFlag: 'none' },
    ],
    orders: [
      { id: 'o1', symbol: 'BTCUSDT', side: 'BUY', type: 'LIMIT', status: 'open', price: 64550, amount: 0.12, filledAmount: 0, timestamp: new Date(now - 30000).toISOString() },
      { id: 'o2', symbol: 'SOLUSDT', side: 'SELL', type: 'MARKET', status: 'filled', amount: 120, filledAmount: 120, timestamp: new Date(now - 90000).toISOString() },
    ],
    strategies: [
      { id: 's1', name: 'TrendFollower_V2', state: 'running', heartbeatAge: '3s', lastSignal: 'BUY BTCUSDT', consecutiveLosses: 0 },
      { id: 's2', name: 'MeanReversion_X', state: 'running', heartbeatAge: '4s', lastSignal: 'SELL ETHUSDT', consecutiveLosses: 1 },
    ],
    risk: { maxRiskPerTrade: 1.5, maxOpenPositions: 8, dailyLossLimit: 6, circuitBreakerStatus: 'inactive', killSwitchEnabled: false },
    incidents: [
      { id: 'ti-1', severity: 'low', title: 'Exchange latency spike detected', firstSeen: new Date(now - 15 * 60000).toISOString(), suggestedAction: 'Monitor / failover if > 250ms', acknowledged: false },
    ],
    decisions: [
      { id: 'd1', timestamp: new Date(now - 120000).toISOString(), strategy: 'TrendFollower_V2', action: 'BUY', symbol: 'BTCUSDT', reason: 'Breakout + volume confirmation', confidence: 0.82 },
      { id: 'd2', timestamp: new Date(now - 360000).toISOString(), strategy: 'MeanReversion_X', action: 'SELL', symbol: 'ETHUSDT', reason: 'RSI overbought at resistance', confidence: 0.71 },
    ],
    chartData,
  };
}

export function p2pTradingState(timeRange = '24h', token = 'USDT', fiat = 'NGN') {
  const now = Date.now();
  return {
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
      { id: 'ad-2', side: 'SELL', price: token === 'BTC' ? 103_300_000 : 1532, quantity: token === 'BTC' ? 0.05 : 1400, completionRate: 89, paymentMethods: ['Bank Transfer', 'Opay'], status: 'ACTIVE' }
    ],
    recentTrades: Array.from({ length: 10 }).map((_, i) => ({
      id: `rt-${i + 1}`,
      timestamp: new Date(now - i * 23 * 60000).toISOString(),
      side: i % 2 === 0 ? 'BUY' : 'SELL',
      usdtAmount: 150 + i * 20,
      fiatAmount: (150 + i * 20) * (token === 'BTC' ? 1 : 1510),
      counterpartyRating: 4.6,
      durationMinutes: 8 + i,
      status: 'COMPLETED'
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
  };
}
