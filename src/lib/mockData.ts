import { OverviewState } from '../types';
import { TradingState, P2PTradingState } from '../types/trading';
import { WebOpsState } from '../types/webOps';
import { DeploymentState } from '../types/deployments';
import { MessagingState } from '../types/messaging';

export const generateMockOverviewData = (): OverviewState => {
  const now = new Date().toISOString();
  
  return {
    meta: {
      generatedAt: now,
      freshnessOk: true,
      staleDomains: [],
    },
    globalStatus: 'healthy',
    incidentCount: 0,
    incidents: [],
    domains: [
      { id: 'trading', name: 'Trading', status: 'healthy', mode: 'live', lastCheckedAt: now },
      { id: 'sites', name: 'Sites', status: 'healthy', mode: 'live', lastCheckedAt: now },
      { id: 'money', name: 'Money', status: 'healthy', mode: 'live', lastCheckedAt: now },
    ],
    tradingSummary: {
      mode: 'live',
      activeStrategies: 5,
      openPositions: 3,
      todayPnl: 12450.25,
      sessionPnl: 3420.10,
      p2pActiveOrders: 14,
      riskStatus: 'within',
      lastOrderAt: now,
    },
    sitesSummary: {
      totalSites: 12,
      healthySites: 12,
      uptimePct24H: 99.98,
      lastDeployAt: now,
      sites: [
        { id: 's1', name: 'Main App', status: 'healthy', uptimePct24H: 99.99 },
        { id: 's2', name: 'API Gateway', status: 'healthy', uptimePct24H: 100 },
        { id: 's3', name: 'Auth Service', status: 'healthy', uptimePct24H: 99.95 },
      ]
    },
    financeSummary: {
      status: 'healthy',
      bybitUsdtBalance: 45200.50,
      fiatBalance: 1250000,
      unpaidInvoices: 8450.00,
      unpaidInvoicesCount: 3,
      thisMonthTradingIncome: 12000.00,
      thisMonthServiceIncome: 4700.00,
      pendingItems: 12,
      flaggedItems: 0,
      lastReconciliationAt: now,
    },
    clientSummary: {
      activeProjects: 5,
      overdueDeliverables: 1,
      nextDeadline: {
        client: 'Acme Corp',
        daysRemaining: 2,
      },
    },
    taskSummary: {
      openTasks: 24,
      overdueCount: 2,
      completedToday: 15,
      dueToday: 8,
      topTasks: [
        { id: 't1', title: 'Review P2P liquidity thresholds', completed: false },
        { id: 't2', title: 'Update SSL certificates', completed: false },
        { id: 't3', title: 'Reconcile February invoices', completed: true },
      ],
    },
    botSummary: {
      totalBots: 6,
      activeBots: 5,
      errorBots: 0,
    },
    contentSummary: {
      pipelineCount: 8,
      inProduction: 45,
      storageUsedPct: 62.5,
      totalAssets: 1240,
    },
    recentChanges: [
      {
        id: 'ch-1',
        type: 'DEPLOY',
        domain: 'sites',
        description: 'Deployed v2.4.1 to production',
        actor: 'Samuel Chris',
        occurredAt: now,
      },
      {
        id: 'ch-2',
        type: 'BOT ACTION',
        domain: 'trading',
        description: 'Started Arbitrage-v4 strategy',
        actor: 'System',
        occurredAt: now,
      },
      {
        id: 'ch-3',
        type: 'ALERT',
        domain: 'money',
        description: 'Updated tax rates for Q1',
        actor: 'Finance Bot',
        occurredAt: now,
      }
    ],
    priorityAlerts: [
      {
        id: 'al-1',
        severity: 'medium',
        title: 'High volatility detected',
        system: 'Trading Engine',
        ageMs: 120000,
        acknowledged: false,
      }
    ],
    recommendedActions: [
      {
        id: 'act-1',
        priority: 'urgent',
        description: 'Rebalance USDT across sub-accounts',
        domain: 'Trading',
        ageMs: 300000,
      },
      {
        id: 'act-2',
        priority: 'high',
        description: 'Review failed deployment in Staging',
        domain: 'Deployments',
        ageMs: 600000,
      },
      {
        id: 'act-3',
        priority: 'medium',
        description: 'Approve pending client invoices',
        domain: 'Finance',
        ageMs: 1200000,
      }
    ],
  };
};

export const generateMockTradingData = (): TradingState => {
  const now = new Date().toISOString();
  return {
    health: {
      mode: 'LIVE',
      auth: 'connected',
      ws: 'connected',
      orderApi: 'healthy',
      lastUpdate: now,
      isStale: false,
    },
    pnl: {
      session: 3420.10,
      day: 12450.25,
      week: 84200.00,
      realized: 11200.00,
      unrealized: 1250.25,
      marginUsage: 15.4,
      totalOpenRisk: 45000.00,
      maxDrawdown: 2.1,
      drawdownLimit: 5.0,
    },
    positions: [
      {
        id: 'pos-1',
        symbol: 'BTCUSDT',
        side: 'LONG',
        size: 0.45,
        entry: 62450.00,
        mark: 63120.50,
        liq: 58200.00,
        uPnL: 301.72,
        roe: 4.8,
        age: '2h 15m',
        strategy: 'TrendFollow-v2',
        riskFlag: 'none',
      },
      {
        id: 'pos-2',
        symbol: 'ETHUSDT',
        side: 'SHORT',
        size: 12.5,
        entry: 3450.20,
        mark: 3420.10,
        liq: 3680.00,
        uPnL: 376.25,
        roe: 8.2,
        age: '45m',
        strategy: 'MeanRevert-v1',
        riskFlag: 'low',
      }
    ],
    orders: [
      {
        id: 'ord-1',
        symbol: 'SOLUSDT',
        side: 'BUY',
        type: 'LIMIT',
        status: 'filled',
        price: 142.50,
        amount: 50,
        filledAmount: 50,
        timestamp: now,
      }
    ],
    strategies: [
      { id: 's1', name: 'TrendFollow-v2', state: 'running', heartbeatAge: '2s', lastSignal: 'BUY', consecutiveLosses: 0 },
      { id: 's2', name: 'MeanRevert-v1', state: 'running', heartbeatAge: '5s', lastSignal: 'SELL', consecutiveLosses: 1 },
      { id: 's3', name: 'Arbitrage-v4', state: 'paused', heartbeatAge: '10m', lastSignal: 'IDLE', consecutiveLosses: 0 },
    ],
    risk: {
      maxRiskPerTrade: 1.5,
      maxOpenPositions: 5,
      dailyLossLimit: 2500,
      circuitBreakerStatus: 'inactive',
      killSwitchEnabled: false,
    },
    incidents: [
      { id: 'i1', severity: 'low', title: 'API Latency Spike', firstSeen: now, suggestedAction: 'Monitor connection', acknowledged: true }
    ],
    decisions: [
      { id: 'd1', timestamp: now, strategy: 'TrendFollow-v2', action: 'BUY', symbol: 'BTCUSDT', reason: 'RSI oversold + Support bounce', confidence: 85 }
    ],
    chartData: Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - (20 - i) * 3600000).toISOString(),
      pnl: 10000 + Math.random() * 5000,
    })),
  };
};

export const generateMockP2PData = (): P2PTradingState => {
  const now = new Date().toISOString();
  return {
    pair: 'USDT/NGN',
    lastSync: now,
    streamHealth: 'HEALTHY',
    kpis: {
      spread: 2.45,
      spreadChange: 0.12,
      topOfBook: 1540.50,
      volatility: 0.35,
      liquidityProxy: 845000,
    },
    snapshots: Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      token: 'USDT',
      fiat: 'NGN',
      paymentMethod: i % 2 === 0 ? 'Bank Transfer' : 'Opay',
      bestBuyPrice: 1540.50 + Math.random() * 5,
      bestSellPrice: 1580.20 + Math.random() * 5,
      spreadAbs: 39.70,
      spreadPct: 2.45 + Math.random() * 0.5,
      buyDepthTop5: 12500,
      sellDepthTop5: 15000,
      depthImbalance: 0.15,
      volatility1h: 0.2,
      sampleCount: 12,
      healthFlag: 'OK',
    })),
    history: Array.from({ length: 24 }, (_, i) => ({
      bucketStart: new Date(Date.now() - (24 - i) * 3600000).toISOString(),
      bucketEnd: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
      avgSpreadPct: 2.2 + Math.random() * 0.8,
      minSpreadPct: 1.8,
      maxSpreadPct: 3.5,
      p50SpreadPct: 2.3,
      p90SpreadPct: 3.1,
      volatility: 0.25,
      avgDepthImbalance: 0.1,
      samples: 60,
    })),
    heatmap: Array.from({ length: 168 }, (_, i) => ({
      hour: i % 24,
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][Math.floor(i / 24)],
      opportunityScore: Math.floor(Math.random() * 100),
    })),
    alerts: [
      { id: 'a1', timestamp: now, type: 'INFO', message: 'Spread widened beyond 3%', rule: 'SpreadMonitor' }
    ],
    health: {
      latencyP50: 120,
      latencyP95: 450,
      missingSampleRatio: 0.02,
      lastIngest: now,
      confidenceScore: 98,
    }
  };
};

export const generateMockWebOpsData = (): WebOpsState => {
  const now = new Date().toISOString();
  return {
    meta: {
      generatedAt: now,
      environment: 'all',
      freshnessOk: true,
    },
    kpis: {
      sitesUp: 11,
      sitesTotal: 12,
      uptimePct24H: 99.98,
      uptimeDelta: 0.02,
      activeSessions: 1450,
      sessionsDelta: 12,
      errors5xx1H: 4,
      errorsDelta: -2,
    },
    sites: [
      {
        id: 's1',
        name: 'Main Exchange',
        domain: 'exchange.example.com',
        environment: 'production',
        status: 'healthy',
        uptimePct24H: 99.99,
        latencyP95Ms: 120,
        lastCheckedAt: now,
        lastDeploy: {
          version: 'v2.4.1',
          deployedAt: now,
          deployedBy: 'Samuel Chris',
        },
        errors1H: 0,
      },
      {
        id: 's2',
        name: 'Auth Service',
        domain: 'auth.example.com',
        environment: 'production',
        status: 'degraded',
        uptimePct24H: 98.50,
        latencyP95Ms: 450,
        lastCheckedAt: now,
        lastDeploy: {
          version: 'v1.2.0',
          deployedAt: now,
          deployedBy: 'System',
        },
        errors1H: 12,
      }
    ],
    errorLog: [],
    cdn: [
      {
        nodeId: 'cdn-us-east',
        region: 'US East',
        regionEmoji: '🇺🇸',
        status: 'healthy',
        cacheHitPct: 94.5,
        bandwidthGb: 120,
        lastPurgedAt: now,
      }
    ],
    certificates: [
      {
        domain: 'example.com',
        expiresAt: now,
        daysRemaining: 45,
        autoRenew: true,
        issuer: 'Let\'s Encrypt',
        status: 'healthy',
      }
    ],
    deployQueue: [],
    alerts: [],
    quickActions: [
      { id: 'qa-1', label: 'Purge CDN Cache', domain: 'cdn', destructive: true },
      { id: 'qa-2', label: 'Restart Auth Service', domain: 'auth', destructive: true },
    ]
  };
};

export const generateMockDeploymentData = (): DeploymentState => {
  const now = new Date().toISOString();
  return {
    meta: {
      generatedAt: now,
      freshnessOk: true,
    },
    kpis: {
      activeDeploys: 1,
      successRate24H: 98.5,
      avgDeployTimeSeconds: 145,
      failedLast24H: 0,
    },
    deployments: [
      {
        id: 'dep-1',
        service: 'API Gateway',
        version: 'v2.4.1',
        environment: 'production',
        status: 'success',
        deployedBy: 'Samuel Chris',
        deployedAt: now,
        durationSeconds: 120,
        rollbackAvailable: true,
      },
      {
        id: 'dep-2',
        service: 'Auth Service',
        version: 'v1.2.0',
        environment: 'staging',
        status: 'in-progress',
        deployedBy: 'System',
        deployedAt: now,
        durationSeconds: 45,
        rollbackAvailable: false,
      }
    ],
    pipelines: [
      {
        id: 'pipe-1',
        name: 'Main Production Pipeline',
        status: 'running',
        lastRunStatus: 'success',
        lastRunAt: now,
        progressPct: 65,
      },
      {
        id: 'pipe-2',
        name: 'Staging Auto-Deploy',
        status: 'idle',
        lastRunStatus: 'success',
        lastRunAt: now,
      }
    ],
    infraStatus: [
      { provider: 'AWS', region: 'us-east-1', status: 'healthy', latencyMs: 45 },
      { provider: 'GCP', region: 'europe-west1', status: 'healthy', latencyMs: 32 },
    ]
  };
};

export const generateMockMessagingData = (): MessagingState => {
  const now = new Date().toISOString();
  return {
    meta: {
      generatedAt: now,
      freshnessOk: true,
    },
    kpis: {
      totalQueueDepth: 1240,
      avgProcessingRate: 450,
      errorCount1H: 0,
      dlqTotal: 0,
    },
    queues: [
      {
        id: 'q-1',
        name: 'order-processing',
        type: 'fifo',
        status: 'healthy',
        depth: 45,
        consumers: 3,
        throughputPerMin: 1200,
        errorRate1H: 0,
        dlqCount: 0,
        lastProcessedAt: now,
      },
      {
        id: 'q-2',
        name: 'notification-service',
        type: 'standard',
        status: 'healthy',
        depth: 1200,
        consumers: 5,
        throughputPerMin: 5000,
        errorRate1H: 0.01,
        dlqCount: 0,
        lastProcessedAt: now,
      }
    ],
    consumers: [
      { id: 'c-1', name: 'order-worker-1', status: 'active', uptimeMs: 3600000, messagesProcessed: 4500, lastSeenAt: now },
      { id: 'c-2', name: 'order-worker-2', status: 'active', uptimeMs: 3600000, messagesProcessed: 4200, lastSeenAt: now },
    ],
    dlqAlerts: []
  };
};
