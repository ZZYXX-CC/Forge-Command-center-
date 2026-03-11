import express from "express";
import { createServer as createViteServer } from "vite";
import { z } from "zod";
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mapOverviewToEdgeRisk, validateEdgeRequiredFields } from './api/adapters/edgeAdapter';
import { mapP2PToBridge, validateBridgeSections } from './api/adapters/bridgeAdapter';
import type { EdgeRiskContract } from './api/contracts/edge';
import type { BridgeP2PSchema } from './api/contracts/bridge';

// --- Data Contract Definitions ---

const SystemStatus = z.enum(['healthy', 'degraded', 'incident', 'offline', 'unknown']);
const Severity = z.enum(['critical', 'high', 'medium', 'low', 'info']);
const OperationalMode = z.enum(['live', 'paper', 'demo', 'halted']);
const ActionPriority = z.enum(['urgent', 'high', 'medium', 'low', 'info']);

const OverviewStateSchema = z.object({
  meta: z.object({
    generatedAt: z.string(),
    freshnessOk: z.boolean(),
    staleDomains: z.array(z.string()),
  }),
  globalStatus: SystemStatus,
  incidentCount: z.number(),
  incidents: z.array(z.object({
    id: z.string(),
    severity: Severity,
    title: z.string(),
    affectedSystem: z.string(),
    durationMs: z.number(),
    startedAt: z.string(),
  })),
  domains: z.array(z.object({
    id: z.string(),
    name: z.string(),
    status: SystemStatus,
    mode: OperationalMode.optional(),
    lastCheckedAt: z.string(),
    degradedSinceMs: z.number().optional(),
  })),
  tradingSummary: z.object({
    mode: OperationalMode,
    activeStrategies: z.number(),
    openPositions: z.number(),
    todayPnl: z.number(),
    sessionPnl: z.number(),
    p2pActiveOrders: z.number(),
    riskStatus: z.enum(['within', 'approaching', 'breached']),
    lastOrderAt: z.string(),
  }),
  sitesSummary: z.object({
    totalSites: z.number(),
    healthySites: z.number(),
    uptimePct24H: z.number(),
    lastDeployAt: z.string(),
    sites: z.array(z.object({
      id: z.string(),
      name: z.string(),
      status: SystemStatus,
      uptimePct24H: z.number(),
    })),
  }),
  moneySummary: z.object({
    bybitUsdtBalance: z.number(),
    fiatBalance: z.number(),
    unpaidInvoices: z.number(),
    unpaidInvoicesCount: z.number(),
    thisMonthTradingIncome: z.number(),
    thisMonthServiceIncome: z.number(),
  }),
  clientSummary: z.object({
    activeProjects: z.number(),
    overdueDeliverables: z.number(),
    nextDeadline: z.object({
      client: z.string(),
      daysRemaining: z.number(),
    }),
  }),
  taskSummary: z.object({
    openTasks: z.number(),
    overdueCount: z.number(),
    completedToday: z.number(),
    dueToday: z.number(),
    topTasks: z.array(z.object({
      id: z.string(),
      title: z.string(),
      completed: z.boolean(),
    })),
  }),
  botSummary: z.object({
    totalBots: z.number(),
    activeBots: z.number(),
    errorBots: z.number(),
  }),
  recentChanges: z.array(z.object({
    id: z.string(),
    occurredAt: z.string(),
    type: z.enum(['BOT ACTION', 'SITE EVENT', 'DEPLOY', 'ORDER FILLED', 'ALERT', 'TASK DUE']),
    description: z.string(),
    actor: z.string(),
    domain: z.string(),
  })),
  priorityAlerts: z.array(z.object({
    id: z.string(),
    severity: Severity,
    title: z.string(),
    system: z.string(),
    ageMs: z.number(),
    acknowledged: z.boolean(),
  })),
});

type OverviewState = z.infer<typeof OverviewStateSchema>;

const readJson = <T>(path: string): T => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8')) as T;

const EDGE_CONTRACT_PATH = 'docs/EDGE_TRADING_CONTRACT_v1.json';
const BRIDGE_SCHEMA_PATH = 'docs/BRIDGE_P2P_SCHEMA_v1.json';

const loadEdgeContract = (): EdgeRiskContract => readJson<EdgeRiskContract>(EDGE_CONTRACT_PATH);
const loadBridgeSchema = (): BridgeP2PSchema => readJson<BridgeP2PSchema>(BRIDGE_SCHEMA_PATH);

// --- Mock Data ---

const generateMockData = (): OverviewState => {
  const now = new Date().toISOString();
  return {
    meta: {
      generatedAt: now,
      freshnessOk: true,
      staleDomains: [],
    },
    globalStatus: 'degraded',
    incidentCount: 1,
    incidents: [
      {
        id: 'inc-001',
        severity: 'critical',
        title: 'Order routing failure',
        affectedSystem: 'Trading Engine',
        durationMs: 840000, // 14m
        startedAt: new Date(Date.now() - 840000).toISOString(),
      }
    ],
    domains: [
      { id: 'overview', name: 'Morning Brief', status: 'healthy', lastCheckedAt: now },
      { id: 'trading', name: 'Trading Ops', status: 'healthy', mode: 'live', lastCheckedAt: now },
      { id: 'p2p', name: 'P2P Markets', status: 'healthy', lastCheckedAt: now },
      { id: 'sites', name: 'Sites', status: 'healthy', lastCheckedAt: now },
      { id: 'money', name: 'Money', status: 'healthy', lastCheckedAt: now },
      { id: 'tasks', name: 'Tasks', status: 'healthy', lastCheckedAt: now },
      { id: 'clients', name: 'Clients', status: 'healthy', lastCheckedAt: now },
      { id: 'bots', name: 'Bot Team', status: 'healthy', lastCheckedAt: now },
      { id: 'content', name: 'Content', status: 'healthy', lastCheckedAt: now },
      { id: 'settings', name: 'Settings', status: 'healthy', lastCheckedAt: now },
    ],
    tradingSummary: {
      mode: 'live',
      activeStrategies: 12,
      openPositions: 43,
      todayPnl: 1245.50,
      sessionPnl: 450.20,
      p2pActiveOrders: 2,
      riskStatus: 'within',
      lastOrderAt: new Date(Date.now() - 45000).toISOString(),
    },
    sitesSummary: {
      totalSites: 12,
      healthySites: 11,
      uptimePct24H: 99.98,
      lastDeployAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      sites: [
        { id: 'site-1', name: 'nuvue.studio', status: 'healthy', uptimePct24H: 100 },
        { id: 'site-2', name: 'openclaw.io', status: 'healthy', uptimePct24H: 99.9 },
        { id: 'site-3', name: 'client-a.com', status: 'degraded', uptimePct24H: 98.5 },
        { id: 'site-4', name: 'client-b.io', status: 'healthy', uptimePct24H: 100 },
      ],
    },
    moneySummary: {
      bybitUsdtBalance: 45200.50,
      fiatBalance: 1250000,
      unpaidInvoices: 8450.00,
      unpaidInvoicesCount: 3,
      thisMonthTradingIncome: 4200.00,
      thisMonthServiceIncome: 12500.00,
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
        { id: 'tsk-1', title: 'Review Acme deliverables', completed: false },
        { id: 'tsk-2', title: 'Update trading risk limits', completed: false },
        { id: 'tsk-3', title: 'Shoot nuvue promo video', completed: false },
        { id: 'tsk-4', title: 'P2P reconciliation', completed: true },
      ],
    },
    botSummary: {
      totalBots: 6,
      activeBots: 5,
      errorBots: 0,
    },
    recentChanges: [
      { id: 'chg-1', occurredAt: new Date(Date.now() - 600000).toISOString(), type: 'BOT ACTION', description: 'TrendFollower_V2 scaled up BTC position', actor: 'bot-1', domain: 'trading' },
      { id: 'chg-2', occurredAt: new Date(Date.now() - 1800000).toISOString(), type: 'DEPLOY', description: 'nuvue.studio v2.4.1 deployed', actor: 'iCHRIS', domain: 'sites' },
      { id: 'chg-3', occurredAt: new Date(Date.now() - 3600000).toISOString(), type: 'ORDER FILLED', description: 'P2P Sell Order #8842 filled (500 USDT)', actor: 'system', domain: 'p2p' },
      { id: 'chg-4', occurredAt: new Date(Date.now() - 7200000).toISOString(), type: 'ALERT', description: 'Client-A latency spike detected', actor: 'monitor', domain: 'sites' },
    ],
    priorityAlerts: [
      { id: 'alt-1', severity: 'high', title: 'Invoice #442 overdue (Acme Corp)', system: 'Finance', ageMs: 172800000, acknowledged: false },
      { id: 'alt-2', severity: 'medium', title: 'SSL Cert expiring in 12 days (personal.me)', system: 'Sites', ageMs: 3600000, acknowledged: false },
    ],
  };
};

// --- Server Setup ---

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get("/api/overview-state", (req, res) => {
    res.json(generateMockData());
  });

  app.get('/api/edge-risk-state', (req, res) => {
    const overview = generateMockData();
    const edgeContract = loadEdgeContract();
    const dto = mapOverviewToEdgeRisk(overview);
    const missing = validateEdgeRequiredFields(dto, edgeContract);

    res.json({
      contractVersion: edgeContract.contractVersion,
      freshness: edgeContract.freshness,
      valid: missing.length === 0,
      missing,
      data: dto,
    });
  });

  app.get("/api/web-ops-state", (req, res) => {
    const env = req.query.env || 'all';
    const now = new Date().toISOString();
    
    res.json({
      meta: {
        generatedAt: now,
        environment: env,
        freshnessOk: true,
      },
      kpis: {
        sitesUp: 7,
        sitesTotal: 8,
        uptimePct24H: 98.6,
        uptimeDelta: -0.4,
        activeSessions: 1243,
        sessionsDelta: 120,
        errors5xx1H: 14,
        errorsDelta: 8,
      },
      sites: [
        { id: 'site-1', name: 'App Main', domain: 'app.openclaw.io', environment: 'production', status: 'healthy', uptimePct24H: 99.9, latencyP95Ms: 120, lastCheckedAt: new Date(Date.now() - 30000).toISOString(), lastDeploy: { version: 'v2.4.1', deployedAt: new Date(Date.now() - 86400000).toISOString(), deployedBy: 'j.smith' }, errors1H: 0 },
        { id: 'site-2', name: 'API Gateway', domain: 'api.openclaw.io', environment: 'production', status: 'healthy', uptimePct24H: 99.8, latencyP95Ms: 88, lastCheckedAt: new Date(Date.now() - 45000).toISOString(), lastDeploy: { version: 'v3.1.0', deployedAt: new Date(Date.now() - 172800000).toISOString(), deployedBy: 'a.chen' }, errors1H: 0 },
        { id: 'site-3', name: 'CDN Assets', domain: 'cdn.openclaw.io', environment: 'production', status: 'degraded', uptimePct24H: 97.2, latencyP95Ms: 340, lastCheckedAt: new Date(Date.now() - 15000).toISOString(), lastDeploy: { version: 'v2.4.0', deployedAt: new Date(Date.now() - 259200000).toISOString(), deployedBy: 'm.ross' }, errors1H: 14, incidentId: 'inc-0041' },
        { id: 'site-4', name: 'Dashboard', domain: 'dashboard.openclaw.io', environment: 'production', status: 'healthy', uptimePct24H: 100, latencyP95Ms: 95, lastCheckedAt: new Date(Date.now() - 60000).toISOString(), lastDeploy: { version: 'v2.4.1', deployedAt: new Date(Date.now() - 86400000).toISOString(), deployedBy: 'j.smith' }, errors1H: 0 },
        { id: 'site-5', name: 'Staging Environment', domain: 'staging.openclaw.io', environment: 'staging', status: 'healthy', uptimePct24H: 99.1, latencyP95Ms: 145, lastCheckedAt: new Date(Date.now() - 120000).toISOString(), lastDeploy: { version: 'v2.5.0b', deployedAt: new Date(Date.now() - 3600000).toISOString(), deployedBy: 'dev-bot' }, errors1H: 2 },
        { id: 'site-6', name: 'Preview Feature A', domain: 'preview-1.openclaw.io', environment: 'preview', status: 'healthy', uptimePct24H: 98.4, latencyP95Ms: 201, lastCheckedAt: new Date(Date.now() - 300000).toISOString(), lastDeploy: { version: 'v2.5.1b', deployedAt: new Date(Date.now() - 1800000).toISOString(), deployedBy: 'a.chen' }, errors1H: 0 },
        { id: 'site-7', name: 'Documentation', domain: 'docs.openclaw.io', environment: 'production', status: 'healthy', uptimePct24H: 100, latencyP95Ms: 66, lastCheckedAt: new Date(Date.now() - 600000).toISOString(), lastDeploy: { version: 'v1.2.3', deployedAt: new Date(Date.now() - 604800000).toISOString(), deployedBy: 'docs-bot' }, errors1H: 0 },
        { id: 'site-8', name: 'Status Page', domain: 'status.openclaw.io', environment: 'production', status: 'healthy', uptimePct24H: 100, latencyP95Ms: 44, lastCheckedAt: new Date(Date.now() - 900000).toISOString(), lastDeploy: { version: 'v1.0.8', deployedAt: new Date(Date.now() - 1209600000).toISOString(), deployedBy: 'system' }, errors1H: 0 },
      ],
      errorLog: [
        { occurredAt: new Date(Date.now() - 60000).toISOString(), statusCode: 503, route: '/api/v1/orders', siteId: 'site-3', count: 8 },
        { occurredAt: new Date(Date.now() - 120000).toISOString(), statusCode: 500, route: '/assets/main.js', siteId: 'site-3', count: 6 },
        { occurredAt: new Date(Date.now() - 300000).toISOString(), statusCode: 404, route: '/favicon.ico', siteId: 'site-5', count: 2 },
        { occurredAt: new Date(Date.now() - 600000).toISOString(), statusCode: 502, route: '/api/v1/auth', siteId: 'site-3', count: 1 },
      ],
      cdn: [
        { nodeId: 'node-1', region: 'US-EAST-1', regionEmoji: '🌎', status: 'degraded', cacheHitPct: 71, bandwidthGb: 2.3, lastPurgedAt: new Date(Date.now() - 2040000).toISOString(), incidentId: 'inc-0041' },
        { nodeId: 'node-2', region: 'US-WEST-2', regionEmoji: '🌎', status: 'healthy', cacheHitPct: 94, bandwidthGb: 1.8, lastPurgedAt: new Date(Date.now() - 7200000).toISOString() },
        { nodeId: 'node-3', region: 'EU-WEST-1', regionEmoji: '🌍', status: 'healthy', cacheHitPct: 96, bandwidthGb: 0.9, lastPurgedAt: new Date(Date.now() - 7200000).toISOString() },
        { nodeId: 'node-4', region: 'AP-SOUTH-1', regionEmoji: '🌏', status: 'healthy', cacheHitPct: 91, bandwidthGb: 0.4, lastPurgedAt: new Date(Date.now() - 7200000).toISOString() },
      ],
      certificates: [
        { domain: '*.openclaw.io', expiresAt: '2026-04-22T00:00:00Z', daysRemaining: 44, autoRenew: true, issuer: "Let's Encrypt", status: 'healthy' },
        { domain: 'api.openclaw.io', expiresAt: '2026-03-22T00:00:00Z', daysRemaining: 14, autoRenew: true, issuer: "Let's Encrypt", status: 'expiring' },
        { domain: 'docs.openclaw.io', expiresAt: '2026-06-15T00:00:00Z', daysRemaining: 99, autoRenew: true, issuer: "Let's Encrypt", status: 'healthy' },
        { domain: 'status.openclaw.io', expiresAt: '2026-07-01T00:00:00Z', daysRemaining: 115, autoRenew: false, issuer: 'Cloudflare', status: 'healthy' },
      ],
      deployQueue: [
        { id: 'dep-1', service: 'web-app', version: 'v2.4.2', status: 'in-progress', triggeredBy: 'j.smith', triggeredAt: new Date(Date.now() - 120000).toISOString(), progressPct: 65, etaSeconds: 45 },
        { id: 'dep-2', service: 'api-gateway', version: 'v3.1.1', status: 'queued', triggeredBy: 'a.chen', triggeredAt: new Date(Date.now() - 300000).toISOString() },
        { id: 'dep-3', service: 'cdn-config', version: 'v2.4.1', status: 'success', triggeredBy: 'system', triggeredAt: new Date(Date.now() - 3600000).toISOString() },
        { id: 'dep-4', service: 'auth-service', version: 'v2.4.2', status: 'failed', triggeredBy: 'm.ross', triggeredAt: new Date(Date.now() - 7200000).toISOString() },
      ],
      alerts: [
        { id: 'alt-w1', severity: 'high', title: 'CDN Latency Spike: US-EAST-1', siteId: 'site-3', ageMs: 1800000, acknowledged: false },
        { id: 'alt-w2', severity: 'medium', title: 'SSL Certificate Expiring: api.openclaw.io', siteId: 'site-2', ageMs: 3600000, acknowledged: false },
      ],
      quickActions: [
        { id: 'qa-1', label: 'Purge CDN cache — US-EAST-1', domain: 'cdn.openclaw.io', destructive: true },
        { id: 'qa-2', label: 'Force SSL renewal — api.openclaw.io', domain: 'api.openclaw.io', destructive: false },
        { id: 'qa-3', label: 'Roll back cdn.openclaw.io', domain: 'cdn.openclaw.io', destructive: true },
        { id: 'qa-4', label: 'Trigger health check — all PROD sites', domain: 'openclaw.io', destructive: false },
        { id: 'qa-5', label: 'View incident INC-0041', domain: 'cdn.openclaw.io', destructive: false },
      ],
    });
  });

  app.get("/api/deployment-state", (req, res) => {
    const now = new Date().toISOString();
    res.json({
      meta: { generatedAt: now, freshnessOk: true },
      kpis: {
        activeDeploys: 1,
        successRate24H: 98.4,
        avgDeployTimeSeconds: 145,
        failedLast24H: 1,
      },
      deployments: [
        { id: 'dep-1', service: 'auth-api', version: 'v2.4.1', environment: 'production', status: 'success', deployedBy: 'a.chen', deployedAt: new Date(Date.now() - 1800000).toISOString(), durationSeconds: 120, rollbackAvailable: true },
        { id: 'dep-2', service: 'trading-ui', version: 'v1.9.0', environment: 'production', status: 'success', deployedBy: 'm.ross', deployedAt: new Date(Date.now() - 7200000).toISOString(), durationSeconds: 180, rollbackAvailable: true },
        { id: 'dep-3', service: 'data-pipeline', version: 'v0.8.4-beta', environment: 'staging', status: 'failed', deployedBy: 'system', deployedAt: new Date(Date.now() - 14400000).toISOString(), durationSeconds: 45, rollbackAvailable: false, logsUrl: '/logs/dep-3' },
        { id: 'dep-4', service: 'web-app', version: 'v2.4.2', environment: 'production', status: 'in-progress', deployedBy: 'j.smith', deployedAt: new Date(Date.now() - 120000).toISOString(), durationSeconds: 0, rollbackAvailable: false },
      ],
      pipelines: [
        { id: 'pipe-1', name: 'Main Production Pipeline', status: 'running', lastRunStatus: 'success', lastRunAt: now, progressPct: 65 },
        { id: 'pipe-2', name: 'Staging Integration', status: 'idle', lastRunStatus: 'failed', lastRunAt: new Date(Date.now() - 14400000).toISOString() },
        { id: 'pipe-3', name: 'Preview Branch Builder', status: 'idle', lastRunStatus: 'success', lastRunAt: new Date(Date.now() - 3600000).toISOString() },
      ],
      infraStatus: [
        { provider: 'AWS', region: 'us-east-1', status: 'degraded', latencyMs: 340 },
        { provider: 'AWS', region: 'us-west-2', status: 'healthy', latencyMs: 45 },
        { provider: 'GCP', region: 'europe-west1', status: 'healthy', latencyMs: 28 },
      ],
    });
  });

  app.get("/api/messaging-state", (req, res) => {
    const now = new Date().toISOString();
    res.json({
      meta: { generatedAt: now, freshnessOk: true },
      kpis: {
        totalQueueDepth: 1450,
        avgProcessingRate: 850,
        errorCount1H: 12,
        dlqTotal: 43,
      },
      queues: [
        { id: 'q-1', name: 'order-events', type: 'fifo', status: 'healthy', depth: 12, consumers: 4, throughputPerMin: 1200, errorRate1H: 0.01, dlqCount: 0, lastProcessedAt: now },
        { id: 'q-2', name: 'market-data-updates', type: 'standard', status: 'degraded', depth: 1240, consumers: 8, throughputPerMin: 8500, errorRate1H: 0.05, dlqCount: 43, lastProcessedAt: now },
        { id: 'q-3', name: 'notification-service', type: 'standard', status: 'healthy', depth: 0, consumers: 2, throughputPerMin: 45, errorRate1H: 0, dlqCount: 0, lastProcessedAt: now },
      ],
      consumers: [
        { id: 'c-1', name: 'order-processor-01', status: 'active', uptimeMs: 86400000, messagesProcessed: 124500, lastSeenAt: now },
        { id: 'c-2', name: 'order-processor-02', status: 'active', uptimeMs: 86400000, messagesProcessed: 123800, lastSeenAt: now },
        { id: 'c-3', name: 'market-data-aggregator', status: 'error', uptimeMs: 1200000, messagesProcessed: 4500, lastSeenAt: new Date(Date.now() - 60000).toISOString() },
      ],
      dlqAlerts: [
        { id: 'dlq-1', queueId: 'q-2', messageId: 'msg-8842', errorCode: 'SCHEMA_MISMATCH', occurredAt: new Date(Date.now() - 300000).toISOString(), payload: '{"event": "price_update", "symbol": "BTC", "price": "NaN"}' },
        { id: 'dlq-2', queueId: 'q-2', messageId: 'msg-8843', errorCode: 'TIMEOUT', occurredAt: new Date(Date.now() - 600000).toISOString() },
      ],
    });
  });

  app.get("/api/trading-state", (req, res) => {
    const timeframe = (req.query.timeframe as string) || '1H';
    const now = new Date().toISOString();
    
    let length = 24;
    let interval = 3600000; // 1 hour
    
    if (timeframe === '4H') {
      length = 48;
      interval = 300000; // 5 mins
    } else if (timeframe === '1D') {
      length = 24;
      interval = 3600000; // 1 hour
    } else if (timeframe === '1W') {
      length = 168;
      interval = 3600000; // 1 hour
    } else {
      // Default 1H
      length = 60;
      interval = 60000; // 1 min
    }

    const chartData = Array.from({ length }, (_, i) => ({
      timestamp: new Date(Date.now() - (length - 1 - i) * interval).toISOString(),
      pnl: Math.sin(i / (length / 8)) * 5000 + (i * (10000 / length)) - 2000 + (Math.random() * 500),
    }));

    res.json({
      health: {
        mode: 'LIVE',
        auth: 'connected',
        ws: 'connected',
        orderApi: 'degraded',
        lastUpdate: now,
        isStale: false,
      },
      pnl: {
        session: 1240.50,
        day: 4520.20,
        week: 12840.00,
        realized: 3200.00,
        unrealized: 1320.20,
        marginUsage: 42.5,
        totalOpenRisk: 85000,
        maxDrawdown: 2450,
        drawdownLimit: 5000,
      },
      positions: [
        { id: 'pos-1', symbol: 'BTCUSDT', side: 'LONG', size: 0.45, entry: 64200.50, mark: 65120.20, liq: 58400, uPnL: 413.86, roe: 12.4, age: '4h 12m', strategy: 'TrendFollower_V2', riskFlag: 'low' },
        { id: 'pos-2', symbol: 'ETHUSDT', side: 'SHORT', size: 12.5, entry: 3450.20, mark: 3410.50, liq: 3800, uPnL: 496.25, roe: 8.2, age: '1h 45m', strategy: 'MeanReversion_ETH', riskFlag: 'none' },
        { id: 'pos-3', symbol: 'SOLUSDT', side: 'LONG', size: 150, entry: 142.50, mark: 145.20, liq: 120, uPnL: 405.00, roe: 15.1, age: '12h 30m', strategy: 'Grid_SOL_Aggressive', riskFlag: 'medium' },
      ],
      orders: [
        { id: 'ord-1', symbol: 'BTCUSDT', side: 'BUY', type: 'LIMIT', status: 'filled', price: 64200.50, amount: 0.45, filledAmount: 0.45, timestamp: new Date(Date.now() - 15120000).toISOString() },
        { id: 'ord-2', symbol: 'LINKUSDT', side: 'SELL', type: 'MARKET', status: 'rejected', amount: 500, filledAmount: 0, timestamp: new Date(Date.now() - 3600000).toISOString(), rejectReason: 'Insufficient Margin', retCode: 10001 },
        { id: 'ord-3', symbol: 'AVAXUSDT', side: 'BUY', type: 'LIMIT', status: 'canceled', price: 35.20, amount: 100, filledAmount: 0, timestamp: new Date(Date.now() - 7200000).toISOString() },
      ],
      strategies: [
        { id: 'strat-1', name: 'TrendFollower_V2', state: 'running', heartbeatAge: '2s', lastSignal: 'LONG BTC @ 64200', consecutiveLosses: 0 },
        { id: 'strat-2', name: 'MeanReversion_ETH', state: 'running', heartbeatAge: '5s', lastSignal: 'SHORT ETH @ 3450', consecutiveLosses: 1 },
        { id: 'strat-3', name: 'Grid_SOL_Aggressive', state: 'running', heartbeatAge: '1s', lastSignal: 'BUY SOL @ 142.5', consecutiveLosses: 0 },
        { id: 'strat-4', name: 'Scalper_BNB', state: 'error', heartbeatAge: '14m', lastSignal: 'NONE', consecutiveLosses: 4 },
      ],
      risk: {
        maxRiskPerTrade: 2.5,
        maxOpenPositions: 10,
        dailyLossLimit: 5000,
        circuitBreakerStatus: 'active',
        killSwitchEnabled: false,
      },
      incidents: [
        { id: 't-inc-1', severity: 'high', title: 'Bybit Order API Latency > 800ms', firstSeen: new Date(Date.now() - 1800000).toISOString(), suggestedAction: 'Switch to secondary endpoint or reduce trade frequency', acknowledged: false },
        { id: 't-inc-2', severity: 'medium', title: 'WebSocket Disconnect: Binance User Stream', firstSeen: new Date(Date.now() - 600000).toISOString(), suggestedAction: 'Reconnect stream manually if auto-recovery fails', acknowledged: true },
      ],
      decisions: [
        { id: 'dec-1', timestamp: new Date(Date.now() - 300000).toISOString(), strategy: 'TrendFollower_V2', action: 'BUY', symbol: 'BTCUSDT', reason: 'RSI oversold + MACD crossover on 15m', confidence: 0.85 },
        { id: 'dec-2', timestamp: new Date(Date.now() - 900000).toISOString(), strategy: 'MeanReversion_ETH', action: 'SELL', symbol: 'ETHUSDT', reason: 'Price touched upper Bollinger Band', confidence: 0.72 },
        { id: 'dec-3', timestamp: new Date(Date.now() - 1500000).toISOString(), strategy: 'Grid_SOL_Aggressive', action: 'BUY', symbol: 'SOLUSDT', reason: 'Grid level 142.5 hit', confidence: 0.95 },
      ],
      chartData,
    });
  });

  app.get('/api/p2p-trading-state', (req, res) => {
    const timeRange = (req.query.timeRange as string) || '24h';
    const token = (req.query.token as string) || 'USDT';
    const fiat = (req.query.fiat as string) || 'NGN';
    const now = new Date();
    
    let historyLength = 24;
    let historyInterval = 3600000; // 1 hour
    
    if (timeRange === '1h') {
      historyLength = 60;
      historyInterval = 60000; // 1 min
    } else if (timeRange === '6h') {
      historyLength = 72;
      historyInterval = 300000; // 5 mins
    } else if (timeRange === '72h') {
      historyLength = 72;
      historyInterval = 3600000; // 1 hour
    }

    const p2pState = {
      pair: `${token}/${fiat}`,
      lastSync: now.toISOString(),
      streamHealth: "HEALTHY",
      kpis: {
        spread: 2.76,
        spreadChange: -0.12,
        topOfBook: 1540.2,
        volatility: 0.41,
        liquidityProxy: 24500,
      },
      snapshots: Array.from({ length: 20 }).map((_, i) => ({
        timestamp: new Date(now.getTime() - i * 60000).toISOString(),
        token: "USDT",
        fiat: "NGN",
        paymentMethod: i % 3 === 0 ? "Bank Transfer" : i % 3 === 1 ? "Opay" : "PalmPay",
        bestBuyPrice: 1540.2 + Math.random() * 5,
        bestSellPrice: 1582.7 + Math.random() * 5,
        spreadAbs: 42.5 + Math.random() * 2,
        spreadPct: 2.76 + Math.random() * 0.1,
        buyDepthTop5: 24500 + Math.random() * 1000,
        sellDepthTop5: 19800 + Math.random() * 1000,
        depthImbalance: 0.106 + Math.random() * 0.05,
        volatility1h: 0.41 + Math.random() * 0.05,
        sampleCount: 120,
        healthFlag: "OK",
      })),
      history: Array.from({ length: historyLength }).map((_, i) => ({
        bucketStart: new Date(now.getTime() - (i + 1) * historyInterval).toISOString(),
        bucketEnd: new Date(now.getTime() - i * historyInterval).toISOString(),
        avgSpreadPct: 2.5 + Math.random() * 0.5,
        minSpreadPct: 2.1 + Math.random() * 0.2,
        maxSpreadPct: 3.2 + Math.random() * 0.3,
        p50SpreadPct: 2.4 + Math.random() * 0.2,
        p90SpreadPct: 2.9 + Math.random() * 0.2,
        volatility: 0.35 + Math.random() * 0.1,
        avgDepthImbalance: 0.08 + Math.random() * 0.04,
        samples: 3600,
      })),
      heatmap: Array.from({ length: 24 * 3 }).map((_, i) => ({
        hour: i % 24,
        day: i < 24 ? "Today" : i < 48 ? "Yesterday" : "2 Days Ago",
        opportunityScore: Math.floor(Math.random() * 100),
      })),
      alerts: [
        { id: '1', timestamp: now.toISOString(), type: 'INFO', message: 'Spread compression detected on Bank Transfer', rule: 'spread_compression' },
        { id: '2', timestamp: new Date(now.getTime() - 300000).toISOString(), type: 'WARNING', message: 'Volatility spike on Opay', rule: 'volatility_spike' },
      ],
      health: {
        latencyP50: 142,
        latencyP95: 450,
        missingSampleRatio: 0.02,
        lastIngest: now.toISOString(),
        confidenceScore: 94,
      }
    };
    res.json(p2pState);
  });

  app.get('/api/bridge-p2p-state', (req, res) => {
    const now = new Date();
    const p2pLike = {
      pair: 'USDT/NGN',
      lastSync: now.toISOString(),
      snapshots: Array.from({ length: 12 }).map((_, index) => ({
        timestamp: new Date(now.getTime() - index * 60000).toISOString(),
        paymentMethod: index % 2 === 0 ? 'Bank Transfer' : 'Opay',
        bestBuyPrice: 1540 + Math.random() * 5,
        bestSellPrice: 1580 + Math.random() * 5,
        spreadPct: 2.6 + Math.random() * 0.2,
      })),
      history: Array.from({ length: 24 }).map((_, index) => ({
        bucketStart: new Date(now.getTime() - index * 3600000).toISOString(),
        avgSpreadPct: 2.4 + Math.random() * 0.4,
        samples: 3600,
      })),
    };

    const schema = loadBridgeSchema();
    const dto = mapP2PToBridge(p2pLike);
    const missingSections = validateBridgeSections(dto, schema);

    res.json({
      schemaVersion: schema.schemaVersion,
      fallback: schema.fallback,
      valid: missingSections.length === 0,
      missingSections,
      data: dto,
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
