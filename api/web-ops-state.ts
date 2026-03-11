export default function handler(req: any, res: any) {
  const env = (req.query.env as string) || 'all';
  const now = new Date().toISOString();
  res.status(200).json({
    meta: { generatedAt: now, environment: env, freshnessOk: true },
    kpis: { sitesUp: 7, sitesTotal: 8, uptimePct24H: 98.6, uptimeDelta: -0.4, activeSessions: 1243, sessionsDelta: 120, errors5xx1H: 14, errorsDelta: 8 },
    sites: [
      { id: 'site-1', name: 'App Main', domain: 'app.openclaw.io', environment: 'production', status: 'healthy', uptimePct24H: 99.9, latencyP95Ms: 120, lastCheckedAt: new Date(Date.now() - 30000).toISOString(), lastDeploy: { version: 'v2.4.1', deployedAt: new Date(Date.now() - 86400000).toISOString(), deployedBy: 'j.smith' }, errors1H: 0 },
      { id: 'site-3', name: 'CDN Assets', domain: 'cdn.openclaw.io', environment: 'production', status: 'degraded', uptimePct24H: 97.2, latencyP95Ms: 340, lastCheckedAt: new Date(Date.now() - 15000).toISOString(), lastDeploy: { version: 'v2.4.0', deployedAt: new Date(Date.now() - 259200000).toISOString(), deployedBy: 'm.ross' }, errors1H: 14, incidentId: 'inc-0041' },
      { id: 'site-5', name: 'Staging Environment', domain: 'staging.openclaw.io', environment: 'staging', status: 'healthy', uptimePct24H: 99.1, latencyP95Ms: 145, lastCheckedAt: new Date(Date.now() - 120000).toISOString(), lastDeploy: { version: 'v2.5.0b', deployedAt: new Date(Date.now() - 3600000).toISOString(), deployedBy: 'dev-bot' }, errors1H: 2 }
    ],
    errorLog: [
      { occurredAt: new Date(Date.now() - 60000).toISOString(), statusCode: 503, route: '/api/v1/orders', siteId: 'site-3', count: 8 },
      { occurredAt: new Date(Date.now() - 120000).toISOString(), statusCode: 500, route: '/assets/main.js', siteId: 'site-3', count: 6 }
    ],
    cdn: [
      { nodeId: 'node-1', region: 'US-EAST-1', regionEmoji: '🌎', status: 'degraded', cacheHitPct: 71, bandwidthGb: 2.3, lastPurgedAt: new Date(Date.now() - 2040000).toISOString(), incidentId: 'inc-0041' },
      { nodeId: 'node-2', region: 'US-WEST-2', regionEmoji: '🌎', status: 'healthy', cacheHitPct: 94, bandwidthGb: 1.8, lastPurgedAt: new Date(Date.now() - 7200000).toISOString() }
    ],
    certificates: [
      { domain: 'forge.app', expiresAt: new Date(Date.now() + 13 * 86400000).toISOString(), daysRemaining: 13, autoRenew: true, issuer: 'LetsEncrypt', status: 'expiring' },
      { domain: 'api.forge.app', expiresAt: new Date(Date.now() + 68 * 86400000).toISOString(), daysRemaining: 68, autoRenew: true, issuer: 'LetsEncrypt', status: 'healthy' }
    ],
    deployQueue: [
      { id: 'dq-1', service: 'forge-web', version: 'v2.4.2', status: 'in-progress', triggeredBy: 'iCHRIS', triggeredAt: new Date(Date.now() - 120000).toISOString(), progressPct: 65, etaSeconds: 90 },
      { id: 'dq-2', service: 'trading-api', version: 'v1.9.1', status: 'queued', triggeredBy: 'dev-bot', triggeredAt: new Date(Date.now() - 60000).toISOString() }
    ],
    alerts: [
      { id: 'wa-1', severity: 'high', title: 'CDN cache miss spike in US-EAST-1', siteId: 'site-3', ageMs: 18 * 60000, acknowledged: false },
      { id: 'wa-2', severity: 'low', title: 'Certificate entering renewal window', ageMs: 2 * 3600000, acknowledged: false }
    ],
    quickActions: [
      { id: 'qa-1', label: 'Purge CDN Cache', domain: 'web', destructive: false },
      { id: 'qa-2', label: 'Rollback Latest Deploy', domain: 'deployments', destructive: true },
      { id: 'qa-3', label: 'Scale API +1', domain: 'infra', destructive: false }
    ]
  });
}
