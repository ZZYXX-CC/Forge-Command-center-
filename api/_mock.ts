import {
  generateMockOverviewData,
  generateMockWebOpsData,
  generateMockDeploymentData,
} from '../src/lib/mockData';
import type { WebOpsState } from '../src/types/webOps';
import type { DeploymentState } from '../src/types/deployments';
import type { OverviewState } from '../src/types';

type WebOpsEnvironment = WebOpsState['meta']['environment'];

export function overviewState(): OverviewState {
  return generateMockOverviewData();
}

export function webOpsState(env: string = 'all'): WebOpsState {
  const data = generateMockWebOpsData();

  if (env === 'all') {
    return data;
  }

  const environment = env as Exclude<WebOpsEnvironment, 'all'>;

  return {
    ...data,
    meta: { ...data.meta, environment },
    sites: data.sites.filter((site) => site.environment === environment),
  };
}

export function deploymentState(): DeploymentState {
  return generateMockDeploymentData();
}
