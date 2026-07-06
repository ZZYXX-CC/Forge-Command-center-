import type { Task } from '@/src/types';

const isoDate = (timestamp: number) => new Date(timestamp).toISOString().slice(0, 10);

/**
 * Safe local seed for the execution cockpit when Convex is not configured.
 *
 * This is intentionally static/demo data, not a persistence layer. The live path
 * is Convex `workItems`; this seed keeps /tasks useful in production-safe
 * fallback mode and documents the minimum work item shape SAGE needs to see.
 */
export function generateCommandCenterSeedTasks(now = Date.now()): Task[] {
  return [
    {
      id: 'forge-cc-phase1-cockpit',
      title: 'Command Center Phase 1: execution cockpit visible in /tasks',
      category: 'OWN BUILDS',
      status: 'in_progress',
      priority: 'urgent',
      dueAt: isoDate(now),
      assignee: 'Hermes fallback worker',
      project: 'Forge Command Center',
    },
    {
      id: 'forge-work-registry-wire-live',
      title: 'Wire executor updates into Convex workItems / executorRuns',
      category: 'OWN BUILDS',
      status: 'todo',
      priority: 'high',
      dueAt: isoDate(now + 2 * 86_400_000),
      assignee: 'SAGE / DISPATCH',
      project: 'Forge Work Registry',
    },
    {
      id: 'forge-dispatch-status-panel',
      title: 'Show DISPATCH health and surface availability in cockpit',
      category: 'OWN BUILDS',
      status: 'done',
      priority: 'high',
      assignee: 'Command Center',
      project: 'DISPATCH',
    },
    {
      id: 'forge-verification-audit-links',
      title: 'Attach verification summaries, commits, and PR links to work items',
      category: 'OWN BUILDS',
      status: 'blocked',
      priority: 'medium',
      dueAt: isoDate(now + 5 * 86_400_000),
      assignee: 'SAGE',
      project: 'Forge Work Registry',
    },
  ];
}
