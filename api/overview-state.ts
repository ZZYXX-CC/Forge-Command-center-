export default function handler(_req: any, res: any) {
  const now = new Date().toISOString();
  res.status(200).json({
    meta: { generatedAt: now, freshnessOk: true, staleDomains: [] },
    globalStatus: 'degraded',
    incidentCount: 1,
    incidents: [
      {
        id: 'inc-001',
        severity: 'critical',
        title: 'Order routing failure',
        affectedSystem: 'Trading Engine',
        durationMs: 840000,
        startedAt: new Date(Date.now() - 840000).toISOString(),
      },
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
    ],
    tradingSummary: {
      mode: 'live',
      activeStrategies: 12,
      openPositions: 43,
      todayPnl: 1245.5,
      sessionPnl: 450.2,
      p2pActiveOrders: 2,
      riskStatus: 'within',
      lastOrderAt: new Date(Date.now() - 45000).toISOString(),
    },
    sitesSummary: {
      totalSites: 12,
      healthySites: 11,
      uptimePct24H: 99.98,
      lastDeployAt: new Date(Date.now() - 4 * 3600_000).toISOString(),
      sites: [
        { id: 'site-1', name: 'nuvue.studio', status: 'healthy', uptimePct24H: 100 },
        { id: 'site-2', name: 'openclaw.io', status: 'healthy', uptimePct24H: 99.9 },
        { id: 'site-3', name: 'client-a.com', status: 'degraded', uptimePct24H: 98.5 },
      ],
    },
    moneySummary: {
      bybitUsdtBalance: 45200.5,
      fiatBalance: 1250000,
      unpaidInvoices: 8450,
      unpaidInvoicesCount: 3,
      thisMonthTradingIncome: 4200,
      thisMonthServiceIncome: 12500,
    },
    clientSummary: { activeProjects: 5, overdueDeliverables: 1, nextDeadline: { client: 'Acme Corp', daysRemaining: 2 } },
    taskSummary: {
      openTasks: 24,
      overdueCount: 2,
      completedToday: 15,
      dueToday: 8,
      topTasks: [
        { id: 'tsk-1', title: 'Review Acme deliverables', completed: false },
        { id: 'tsk-2', title: 'Update trading risk limits', completed: false },
      ],
    },
    botSummary: { totalBots: 6, activeBots: 5, errorBots: 0 },
    recentChanges: [
      { id: 'chg-1', occurredAt: new Date(Date.now() - 600000).toISOString(), type: 'BOT ACTION', description: 'TrendFollower_V2 scaled BTC position', actor: 'bot-1', domain: 'trading' },
      { id: 'chg-2', occurredAt: new Date(Date.now() - 1800000).toISOString(), type: 'DEPLOY', description: 'forge ui deployed', actor: 'iCHRIS', domain: 'sites' },
    ],
    priorityAlerts: [
      { id: 'alt-1', severity: 'high', title: 'Invoice #442 overdue (Acme Corp)', system: 'Finance', ageMs: 172800000, acknowledged: false },
      { id: 'alt-2', severity: 'medium', title: 'SSL cert expiring in 12 days', system: 'Sites', ageMs: 3600000, acknowledged: false },
    ],
  });
}
