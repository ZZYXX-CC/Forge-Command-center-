/**
 * Convex hooks for FORGE real-time data.
 *
 * These hooks use Convex's reactive useQuery to subscribe to live data.
 * They gracefully degrade to undefined when Convex is not configured,
 * allowing components to merge Convex live data with Paperclip roster data.
 */

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { convexClient, isConvexConfigured } from '@/src/lib/convex';
import type { Workflow } from '@/src/types';
import type { CreateWorkItemInput, ExecutorRun, RoutingDecisionInput, UpdateWorkItemInput, VerificationRunInput, WorkEventInput, WorkRegistryDetail, WorkRegistryEvent, WorkRegistryItem } from '@/src/lib/workRegistry';
import type { DispatchRegistryModel } from '@/src/lib/dispatchClient';

export function useAgentLiveStatus() {
  const data = useQuery(
    api.agents.listLiveStatus,
    isConvexConfigured() ? {} : 'skip',
  );
  return data ?? [];
}

export function useOpenPositions() {
  const data = useQuery(
    api.trading.getOpenPositions,
    isConvexConfigured() ? {} : 'skip',
  );
  return data ?? [];
}

export function useTradingPnL() {
  return useQuery(
    api.trading.getPnL,
    isConvexConfigured() ? {} : 'skip',
  ) ?? null;
}

export function useTradingOrders(limit = 50) {
  const data = useQuery(
    api.trading.getOrders,
    isConvexConfigured() ? { limit } : 'skip',
  );
  return data ?? [];
}

export function useP2PSpread(pair?: string) {
  return useQuery(
    api.p2p.getSpread,
    isConvexConfigured() ? { pair } : 'skip',
  ) ?? null;
}

export function useP2PActiveOrders() {
  const data = useQuery(
    api.p2p.getActiveOrders,
    isConvexConfigured() ? {} : 'skip',
  );
  return data ?? [];
}

export function useSiteLiveStatus() {
  const data = useQuery(
    api.sites.getLiveStatus,
    isConvexConfigured() ? {} : 'skip',
  );
  return data ?? [];
}

export function useActiveAlerts(limit = 50) {
  const data = useQuery(
    api.alerts.getActive,
    isConvexConfigured() ? { limit } : 'skip',
  );
  return data ?? [];
}

export function useRecentActivity(limit = 30) {
  const data = useQuery(
    api.activity.getRecent,
    isConvexConfigured() ? { limit } : 'skip',
  );
  return data ?? [];
}

export function useBybitBalances() {
  const data = useQuery(
    api.money.getBybitBalances,
    isConvexConfigured() ? {} : 'skip',
  );
  return data ?? [];
}

export function useWorkItems(limit = 50): WorkRegistryItem[] {
  const data = useQuery(
    api.work.listWorkItems,
    isConvexConfigured() ? { limit } : 'skip',
  );
  return (data ?? []) as WorkRegistryItem[];
}

export function useWorkEvents(limit = 200, workId?: string | null): WorkRegistryEvent[] {
  const data = useQuery(
    api.work.listWorkEvents,
    isConvexConfigured() ? { limit, workId: workId ?? undefined } : 'skip',
  );
  return (data ?? []) as WorkRegistryEvent[];
}

export function useWorkItemDetail(workId?: string | null): WorkRegistryDetail | null {
  const data = useQuery(
    api.work.getWorkItem,
    isConvexConfigured() && workId ? { workId } : 'skip',
  );
  return (data ?? null) as unknown as WorkRegistryDetail | null;
}

export function useWorkflowsForItem(workItemId?: string | null): Workflow[] {
  const data = useQuery(
    api.work.listWorkflowsForItem,
    isConvexConfigured() && workItemId ? { workItemId, limit: 20 } : 'skip',
  );
  return (data ?? []).map((workflow: any) => ({
    id: workflow.workflowId,
    workItemId: workflow.workItemId,
    trigger: workflow.trigger,
    status: workflow.status,
    stages: workflow.stages,
    startTime: workflow.startTime,
    endTime: workflow.endTime,
    executor: workflow.executor,
    surface: workflow.surface,
    output: workflow.output,
    dispatchJobId: workflow.dispatchJobId,
    exitCode: workflow.exitCode,
    verification: workflow.verification,
  })) as Workflow[];
}

export async function createWorkflow(input: Pick<Workflow, 'workItemId' | 'trigger' | 'stages'> & Partial<Pick<Workflow, 'executor' | 'surface'>>): Promise<{ workflowId: string }> {
  if (!convexClient) throw new Error('Convex is not configured. Workflow changes are unavailable in fallback mode.');
  return await convexClient.mutation(api.work.createWorkflow, input);
}

export async function updateWorkflowStage(input: Pick<Workflow, 'stages' | 'status'> & {
  workflowId: string;
  dispatchJobId?: string;
  executor?: string;
  surface?: string;
  output?: string;
  exitCode?: number;
  verification?: Workflow['verification'];
  endTime?: number;
}): Promise<void> {
  if (!convexClient) throw new Error('Convex is not configured. Workflow changes are unavailable in fallback mode.');
  await convexClient.mutation(api.work.updateWorkflowStage, input);
}

export async function recordExecutorRun(input: Omit<ExecutorRun, '_id'>): Promise<void> {
  if (!convexClient) throw new Error('Convex is not configured. Executor run changes are unavailable in fallback mode.');
  await convexClient.mutation(api.work.recordExecutorRun, input);
}

export async function recordRoutingDecision(input: RoutingDecisionInput): Promise<string | void> {
  if (!convexClient) throw new Error('Convex is not configured. Routing decision changes are unavailable in fallback mode.');
  return await convexClient.mutation(api.work.recordRoutingDecision, input);
}

export async function recordVerificationRun(input: VerificationRunInput): Promise<void> {
  if (!convexClient) throw new Error('Convex is not configured. Verification run changes are unavailable in fallback mode.');
  await convexClient.mutation(api.work.recordVerificationRun, input);
}

export async function syncDispatchModelStatus(models: DispatchRegistryModel[]): Promise<void> {
  if (!convexClient) throw new Error('Convex is not configured. Model registry sync is unavailable in fallback mode.');
  await Promise.all(models.map(async (model) => {
    await convexClient!.mutation(api.work.upsertModelRegistry, {
      registryId: model.id,
      provider: model.provider,
      surface: model.surface,
      model: model.model,
      capabilitiesJson: JSON.stringify(model.capabilities ?? []),
      authorityRolesJson: JSON.stringify(model.authority_roles ?? []),
      allowedDomainsJson: JSON.stringify(model.allowed_domains ?? []),
      tier: model.tier,
      trustLevel: model.trust_level,
      quotaJson: JSON.stringify(model.quota ?? {}),
      costJson: JSON.stringify(model.cost ?? {}),
    });
    if (model.runtime) {
      await convexClient!.mutation(api.work.upsertModelRuntimeStatus, {
        registryId: model.id,
        surface: model.surface,
        model: model.model,
        health: model.runtime.health,
        available: Boolean(model.runtime.available),
        via: model.runtime.via ?? undefined,
        quotaUsed: typeof model.runtime.quota_used === 'number' ? model.runtime.quota_used : undefined,
        quotaRemaining: typeof model.runtime.quota_remaining === 'number' ? model.runtime.quota_remaining : undefined,
        circuitState: model.runtime.circuit_state ?? 'closed',
        lastSuccess: typeof model.runtime.last_success === 'number' ? model.runtime.last_success : undefined,
        lastFailure: typeof model.runtime.last_failure === 'number' ? model.runtime.last_failure : undefined,
        lastError: model.runtime.last_error ?? undefined,
      });
    }
  }));
}

export async function createWorkItem(input: CreateWorkItemInput): Promise<{ workId: string }> {
  if (!convexClient) throw new Error('Convex is not configured. Work item changes are unavailable in fallback mode.');
  return await convexClient.mutation(api.work.createWorkItem, input);
}

export async function updateWorkItem(input: UpdateWorkItemInput): Promise<void> {
  if (!convexClient) throw new Error('Convex is not configured. Work item changes are unavailable in fallback mode.');
  await convexClient.mutation(api.work.updateWorkItem, input);
}

export async function addWorkEvent(input: WorkEventInput): Promise<void> {
  if (!convexClient) throw new Error('Convex is not configured. Work item changes are unavailable in fallback mode.');
  await convexClient.mutation(api.work.addWorkEvent, input);
}
