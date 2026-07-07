import test from 'node:test';
import assert from 'node:assert/strict';
import { getDeploymentState, getWebOpsState } from './hybrid-dashboard';

const originalFetch = globalThis.fetch;

test('falls back to mock when hybrid disabled', async () => {
  process.env.ENABLE_HYBRID_BACKEND = 'false';
  const state = await getWebOpsState('all');
  assert.equal(state.meta.freshnessOk, true);
  assert.ok(Array.isArray(state.sites));
});

test('uses fallback when convex payload is stale', async () => {
  process.env.ENABLE_HYBRID_BACKEND = 'true';
  process.env.CONVEX_DEPLOYMENT_ENDPOINT = 'https://convex.example/deployments';

  globalThis.fetch = (async () => ({
    ok: true,
    json: async () => ({
      meta: { generatedAt: '2020-01-01T00:00:00.000Z', freshnessOk: false },
      kpis: { activeDeploys: 0, successRate24H: 100, avgDeployTimeSeconds: 10, failedLast24H: 0 },
      deployments: [],
      pipelines: [],
      infraStatus: [],
    }),
  })) as any;

  const state = await getDeploymentState();
  assert.equal(state.meta.freshnessOk, true);
  assert.ok(state.deployments.length > 0);
});

test.after(() => {
  globalThis.fetch = originalFetch;
  delete process.env.ENABLE_HYBRID_BACKEND;
  delete process.env.CONVEX_DEPLOYMENT_ENDPOINT;
});
