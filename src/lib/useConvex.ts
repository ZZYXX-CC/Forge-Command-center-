/**
 * Convex hooks for FORGE real-time data.
 *
 * These hooks use Convex's reactive useQuery to subscribe to live data.
 * They gracefully degrade to undefined when Convex is not configured,
 * allowing components to merge Convex live data with Paperclip roster data.
 */

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { isConvexConfigured } from '@/src/lib/convex';

type WorkItemStatus = 'backlog' | 'ready' | 'assigned' | 'in_progress' | 'blocked' | 'review' | 'done' | 'cancelled';
type WorkItemPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ConvexWorkItem {
  _id: string;
  workId: string;
  title: string;
  summary?: string;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  orchestrator: string;
  owner?: string;
  executor?: string;
  surface?: string;
  model?: string;
  branch?: string;
  pullRequestUrl?: string;
  issueUrl?: string;
  blocker?: string;
  verificationStatus: 'not_started' | 'running' | 'passed' | 'failed' | 'waived';
  verificationSummary?: string;
  createdAt: number;
  updatedAt: number;
  dueAt?: number;
}

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

export function useWorkItems(limit = 50): ConvexWorkItem[] {
  if (!isConvexConfigured()) return [];

  // `convex/_generated/api` is checked in and may lag new Convex modules until
  // an authenticated `npx convex dev` regenerates it. Runtime `api.js` uses
  // `anyApi`, so this cast keeps the UI wired without blocking local builds.
  const data = useQuery((api as any).work.listWorkItems, { limit });
  return (data ?? []) as ConvexWorkItem[];
}
