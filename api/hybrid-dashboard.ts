import { z } from 'zod';
import { overviewState, webOpsState, deploymentState } from './_mock';
import { WebOpsStateSchema } from '../src/types/webOps';
import { DeploymentStateSchema } from '../src/types/deployments';

const OverviewMetaSchema = z.object({
  generatedAt: z.string(),
  freshnessOk: z.boolean(),
});

const MAX_STALENESS_MS = Number(process.env.DASHBOARD_MAX_STALENESS_MS ?? 60_000);

function isHybridEnabled() {
  if (process.env.ENABLE_HYBRID_BACKEND === 'false') return false;
  return process.env.NODE_ENV === 'production' || process.env.ENABLE_HYBRID_BACKEND === 'true';
}

function isFresh(generatedAt: string) {
  const ts = Date.parse(generatedAt);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts <= MAX_STALENESS_MS;
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`Fetch failed (${res.status}) for ${url}`);
  }
  return res.json();
}

async function readOverviewFromSupabase() {
  const baseUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  const table = process.env.SUPABASE_OVERVIEW_TABLE ?? 'dashboard_overview_state';

  if (!baseUrl || !key) throw new Error('Supabase not configured');

  const url = `${baseUrl}/rest/v1/${table}?select=payload&order=generated_at.desc&limit=1`;
  const data = await fetchJson(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  }) as Array<{ payload: unknown }>;

  const payload = data?.[0]?.payload;
  if (!payload || typeof payload !== 'object') throw new Error('Invalid Supabase payload');
  return payload;
}

async function readFromConvex(endpointVar: string) {
  const endpoint = process.env[endpointVar];
  if (!endpoint) throw new Error(`${endpointVar} not configured`);
  return fetchJson(endpoint);
}

export async function getOverviewState() {
  const fallback = overviewState();

  if (!isHybridEnabled()) return fallback;

  try {
    const payload = await readOverviewFromSupabase();
    const parsed = OverviewMetaSchema.safeParse((payload as any).meta);
    if (!parsed.success || !isFresh(parsed.data.generatedAt)) return fallback;

    return payload;
  } catch {
    return fallback;
  }
}

export async function getWebOpsState(env: string = 'all') {
  const fallback = webOpsState(env);

  if (!isHybridEnabled()) return fallback;

  try {
    const payload = await readFromConvex('CONVEX_WEB_OPS_ENDPOINT');
    const parsed = WebOpsStateSchema.safeParse(payload);
    if (!parsed.success || !isFresh(parsed.data.meta.generatedAt)) return fallback;

    if (env !== 'all') {
      return {
        ...parsed.data,
        meta: { ...parsed.data.meta, environment: env as any },
        sites: parsed.data.sites.filter((site) => site.environment === env),
      };
    }

    return parsed.data;
  } catch {
    return fallback;
  }
}

export async function getDeploymentState() {
  const fallback = deploymentState();

  if (!isHybridEnabled()) return fallback;

  try {
    const payload = await readFromConvex('CONVEX_DEPLOYMENT_ENDPOINT');
    const parsed = DeploymentStateSchema.safeParse(payload);
    if (!parsed.success || !isFresh(parsed.data.meta.generatedAt)) return fallback;

    return parsed.data;
  } catch {
    return fallback;
  }
}
