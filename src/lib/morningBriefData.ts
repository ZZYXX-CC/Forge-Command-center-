import type {
  OverviewState,
  Incident,
  DomainStatus,
  TradingSummary,
  SitesSummary,
  FinanceSummary,
  ClientSummary,
  TaskSummary,
  BotSummary,
  ActivityEntry,
  Alert,
  TopTask,
} from '@/src/types';
// import { paperclip } from '@/src/lib/paperclip';

const USE_PAPERCLIP_MOCK = true;
const USE_CONVEX_MOCK = true;

function generateMockOverviewState(): OverviewState {
  const now = new Date().toISOString();

  const domains: DomainStatus[] = [
    { id: 'overview', name: 'Morning Brief', status: 'healthy', lastCheckedAt: now },
    { id: 'trading', name: 'Trading Ops', status: 'healthy', mode: 'live', lastCheckedAt: now },
    { id: 'p2p', name: 'P2P Markets', status: 'healthy', lastCheckedAt: now },
    { id: 'sites', name: 'Sites', status: 'healthy', lastCheckedAt: now },
    { id: 'money', name: 'Money', status: 'healthy', lastCheckedAt: now },
    { id: 'tasks', name: 'Tasks', status: 'healthy', lastCheckedAt: now },
    { id: 'clients', name: 'Clients', status: 'healthy', lastCheckedAt: now },
    { id: 'bots', name: 'Bot Team', status: 'healthy', lastCheckedAt: now },
  ];

  const incidents: Incident[] = [
    { id: 'inc-001', severity: 'critical', title: 'Order routing failure', affectedSystem: 'Trading Engine', durationMs: 840000, startedAt: new Date(Date.now() - 840000).toISOString() },
  ];

  const tradingSummary: TradingSummary = {
    mode: 'live',
    activeStrategies: 4,
    openPositions: 3,
    todayPnl: 1245.5,
    sessionPnl: 450.2,
    p2pActiveOrders: 2,
    riskStatus: 'within',
    lastOrderAt: new Date(Date.now() - 45000).toISOString(),
  };

  const sitesSummary: SitesSummary = {
    totalSites: 12,
    healthySites: 11,
    uptimePct24H: 99.98,
    lastDeployAt: new Date(Date.now() - 4 * 3600_000).toISOString(),
    sites: [
      { id: 'site-1', name: 'nuvue.studio', status: 'healthy', uptimePct24H: 100 },
      { id: 'site-2', name: 'openclaw.io', status: 'healthy', uptimePct24H: 99.9 },
      { id: 'site-3', name: 'forge.app', status: 'healthy', uptimePct24H: 99.8 },
      { id: 'site-4', name: 'client-a.com', status: 'degraded', uptimePct24H: 98.5 },
    ],
  };

  const financeSummary: FinanceSummary = {
    status: 'healthy',
    bybitUsdtBalance: 45200.5,
    fiatBalance: 1250000,
    unpaidInvoices: 8450,
    unpaidInvoicesCount: 3,
    thisMonthTradingIncome: 4200,
    thisMonthServiceIncome: 12500,
    pendingItems: 3,
    flaggedItems: 0,
    lastReconciliationAt: now,
  };

  const clientSummary: ClientSummary = {
    activeProjects: 5,
    overdueDeliverables: 1,
    nextDeadline: { client: 'Acme Corp', daysRemaining: 2 },
  };

  const topTasks: TopTask[] = [
    { id: 'tsk-1', title: 'Review Acme deliverables', completed: false },
    { id: 'tsk-2', title: 'Update trading risk limits', completed: false },
    { id: 'tsk-3', title: 'Ship nuvue v2.1', completed: true },
  ];

  const taskSummary: TaskSummary = {
    openTasks: 24,
    overdueCount: 2,
    completedToday: 15,
    dueToday: 8,
    topTasks,
  };

  const botSummary: BotSummary = {
    totalBots: 12,
    activeBots: 10,
    errorBots: 0,
  };

  const recentChanges: ActivityEntry[] = [
    { id: 'chg-1', occurredAt: new Date(Date.now() - 600000).toISOString(), type: 'BOT ACTION', description: 'TrendFollower_V2 scaled BTC position', actor: 'EDGE', domain: 'trading' },
    { id: 'chg-2', occurredAt: new Date(Date.now() - 1800000).toISOString(), type: 'DEPLOY', description: 'forge ui deployed', actor: 'iCHRIS', domain: 'sites' },
    { id: 'chg-3', occurredAt: new Date(Date.now() - 2400000).toISOString(), type: 'ORDER FILLED', description: 'P2P USDT buy completed', actor: 'EDGE', domain: 'p2p' },
  ];

  const priorityAlerts: Alert[] = [
    { id: 'alt-1', severity: 'high', title: 'Invoice #442 overdue (Acme Corp)', system: 'Finance', ageMs: 172800000, acknowledged: false },
    { id: 'alt-2', severity: 'medium', title: 'SSL cert expiring in 12 days', system: 'Sites', ageMs: 3600000, acknowledged: false },
  ];

  return {
    meta: { generatedAt: now, freshnessOk: true, staleDomains: [] },
    globalStatus: 'degraded',
    incidentCount: incidents.length,
    incidents,
    domains,
    tradingSummary,
    sitesSummary,
    financeSummary,
    clientSummary,
    taskSummary,
    botSummary,
    contentSummary: {
      pipelineCount: 7,
      inProduction: 4,
      storageUsedPct: 58,
      totalAssets: 980,
    },
    recentChanges,
    priorityAlerts,
    recommendedActions: [
      {
        id: 'act-1',
        priority: 'high',
        description: 'Follow up on overdue Acme invoice',
        domain: 'money',
        ageMs: 172800000,
      },
    ],
  };
}

export async function fetchOverviewState(): Promise<OverviewState> {
  if (!USE_PAPERCLIP_MOCK) {
    // const data = await paperclip.getOverviewState<OverviewState>();
    // merge with Convex live data when USE_CONVEX_MOCK is false
    // return data;
  }
  return generateMockOverviewState();
}
