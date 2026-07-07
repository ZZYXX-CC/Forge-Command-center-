import type { SitesState, Site, DeployEntry } from '@/src/types';
// import { paperclip } from '@/src/lib/paperclip';

const USE_PAPERCLIP_MOCK = true;
const USE_CONVEX_MOCK = true;

function generateMockSitesState(): SitesState {
  const now = Date.now();

  const sites: Site[] = [
    { id: 'site-1', name: 'nuvue.studio', url: 'https://nuvue.studio', type: 'own', status: 'up', uptimePct: 100, latencyMs: 45, errors24h: 0, sslExpiry: new Date(now + 90 * 86400000).toISOString().slice(0, 10), lastDeployAt: new Date(now - 4 * 3600000).toISOString() },
    { id: 'site-2', name: 'openclaw.io', url: 'https://openclaw.io', type: 'own', status: 'up', uptimePct: 99.9, latencyMs: 52, errors24h: 1, sslExpiry: new Date(now + 60 * 86400000).toISOString().slice(0, 10), lastDeployAt: new Date(now - 86400000).toISOString() },
    { id: 'site-3', name: 'forge.app', url: 'https://forge.app', type: 'own', status: 'up', uptimePct: 99.8, latencyMs: 68, errors24h: 0, sslExpiry: new Date(now + 45 * 86400000).toISOString().slice(0, 10), lastDeployAt: new Date(now - 2 * 3600000).toISOString() },
    { id: 'site-4', name: 'Acme Corp Marketing', url: 'https://acme-marketing.com', type: 'client', client: 'Acme Corp', status: 'up', uptimePct: 99.5, latencyMs: 95, errors24h: 3, sslExpiry: new Date(now + 12 * 86400000).toISOString().slice(0, 10), lastDeployAt: new Date(now - 7 * 86400000).toISOString() },
    { id: 'site-5', name: 'TechStart SaaS', url: 'https://app.techstart.io', type: 'client', client: 'TechStart', status: 'up', uptimePct: 99.7, latencyMs: 78, errors24h: 1, lastDeployAt: new Date(now - 3 * 86400000).toISOString() },
    { id: 'site-6', name: 'RetailPro Shop', url: 'https://shop.retailpro.com', type: 'client', client: 'RetailPro', status: 'degraded', uptimePct: 98.2, latencyMs: 210, errors24h: 12, lastDeployAt: new Date(now - 1 * 86400000).toISOString() },
    { id: 'site-7', name: 'Studio Portfolio', url: 'https://portfolio.nuvue.studio', type: 'own', status: 'up', uptimePct: 99.99, latencyMs: 38, errors24h: 0, lastDeployAt: new Date(now - 14 * 86400000).toISOString() },
    { id: 'site-8', name: 'Finance Hub Dashboard', url: 'https://dashboard.financehub.com', type: 'client', client: 'Finance Hub', status: 'up', uptimePct: 99.3, latencyMs: 110, errors24h: 2, sslExpiry: new Date(now + 25 * 86400000).toISOString().slice(0, 10), lastDeployAt: new Date(now - 5 * 86400000).toISOString() },
    { id: 'site-9', name: 'P2P Gateway', url: 'https://gateway.openclaw.io', type: 'own', status: 'up', uptimePct: 99.6, latencyMs: 62, errors24h: 0, lastDeployAt: new Date(now - 6 * 3600000).toISOString() },
    { id: 'site-10', name: 'API Docs', url: 'https://docs.openclaw.io', type: 'own', status: 'up', uptimePct: 99.9, latencyMs: 48, errors24h: 0, lastDeployAt: new Date(now - 30 * 86400000).toISOString() },
    { id: 'site-11', name: 'DevLand Staging', url: 'https://staging.devland.io', type: 'client', client: 'DevLand', status: 'up', uptimePct: 98.8, latencyMs: 145, errors24h: 5, lastDeployAt: new Date(now - 12 * 3600000).toISOString() },
  ];

  const deployHistory: DeployEntry[] = [
    { id: 'dep-1', site: 'forge.app', version: 'v2.4.2', status: 'success', timestamp: new Date(now - 2 * 3600000).toISOString(), actor: 'iCHRIS' },
    { id: 'dep-2', site: 'nuvue.studio', version: 'v2.1.0', status: 'success', timestamp: new Date(now - 4 * 3600000).toISOString(), actor: 'SitesBot' },
    { id: 'dep-3', site: 'RetailPro Shop', version: 'v1.3.1', status: 'failed', timestamp: new Date(now - 86400000).toISOString(), actor: 'DeployBot' },
    { id: 'dep-4', site: 'openclaw.io', version: 'v3.0.0', status: 'success', timestamp: new Date(now - 86400000).toISOString(), actor: 'iCHRIS' },
  ];

  const healthyCount = sites.filter((s) => s.status === 'up').length;
  const avgUptime = sites.reduce((sum, s) => sum + s.uptimePct, 0) / sites.length;
  const sslWarnings = sites.filter((s) => s.sslExpiry && new Date(s.sslExpiry).getTime() - now < 30 * 86400000).length;

  return {
    sites,
    kpis: {
      allUp: healthyCount,
      total: sites.length,
      avgUptime: Math.round(avgUptime * 100) / 100,
      pendingDeploys: 1,
      sslWarnings,
    },
    deployHistory,
  };
}

export async function fetchSitesState(): Promise<SitesState> {
  if (!USE_PAPERCLIP_MOCK) {
    // const data = await paperclip.getSitesState<SitesState>();
    // merge with Convex live pings when USE_CONVEX_MOCK is false
    // return data;
  }
  return generateMockSitesState();
}
