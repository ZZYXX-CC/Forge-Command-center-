export default function handler(_req: any, res: any) {
  const now = new Date().toISOString();
  res.status(200).json({
    meta: { generatedAt: now, freshnessOk: true },
    kpis: { activeDeploys: 1, successRate24H: 92.3, avgDeployTimeSeconds: 385, failedLast24H: 1 },
    deployments: [
      { id: 'dep-1', service: 'forge-web', version: 'v2.4.2', environment: 'production', status: 'in-progress', deployedBy: 'iCHRIS', deployedAt: new Date(Date.now() - 120000).toISOString(), durationSeconds: 0, rollbackAvailable: true },
      { id: 'dep-2', service: 'trading-api', version: 'v1.9.0', environment: 'production', status: 'success', deployedBy: 'dev-bot', deployedAt: new Date(Date.now() - 2 * 3600000).toISOString(), durationSeconds: 411, rollbackAvailable: true, logsUrl: '#' }
    ],
    pipelines: [
      { id: 'pl-1', name: 'forge-web-release', status: 'running', lastRunStatus: 'success', lastRunAt: new Date(Date.now() - 3600000).toISOString(), progressPct: 67 },
      { id: 'pl-2', name: 'api-ci', status: 'idle', lastRunStatus: 'failed', lastRunAt: new Date(Date.now() - 7 * 3600000).toISOString(), nextScheduledAt: new Date(Date.now() + 3600000).toISOString() }
    ],
    infraStatus: [
      { provider: 'Vercel', region: 'iad1', status: 'healthy', latencyMs: 84 },
      { provider: 'Bybit WS', region: 'global', status: 'degraded', latencyMs: 182 }
    ]
  });
}
