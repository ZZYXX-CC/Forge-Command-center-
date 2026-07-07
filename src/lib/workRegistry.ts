import type { Task, TasksState, Workflow } from '@/src/types';

export type WorkItemStatus = 'backlog' | 'ready' | 'assigned' | 'in_progress' | 'blocked' | 'review' | 'done' | 'cancelled';
export type WorkItemPriority = 'low' | 'medium' | 'high' | 'critical';
export type VerificationStatus = 'not_started' | 'running' | 'passed' | 'failed' | 'waived';

export interface WorkRegistryItem {
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
  verificationStatus: VerificationStatus;
  verificationSummary?: string;
  dryRun?: boolean;
  createdAt: number;
  updatedAt: number;
  dueAt?: number;
}

export interface WorkRegistryEvent {
  _id: string;
  workId: string;
  type: string;
  actor: string;
  message: string;
  metadata?: string;
  occurredAt: number;
}

export interface ExecutorRun {
  _id: string;
  workId?: string;
  runId: string;
  executor: string;
  surface: string;
  model?: string;
  status: string;
  promptPreview?: string;
  outputPreview?: string;
  error?: string;
  startedAt: number;
  completedAt?: number;
  latencyMs?: number;
  cwd?: string;
  commitSha?: string;
  pullRequestUrl?: string;
}

export interface RoutingDecision {
  _id: string;
  sourceId?: string;
  workId?: string;
  task: string;
  category: string;
  complexity: string;
  urgency?: string;
  confidence?: string;
  chosenSurface?: string;
  chosenModel?: string;
  via?: string;
  servedBy?: string;
  status: string;
  latencyMs?: number;
  consideredJson?: string;
  classificationJson?: string;
  classifierModel?: string;
  whyLogJson?: string;
  rejectionsJson?: string;
  verificationJson?: string;
  quotaSnapshotJson?: string;
  circuitSnapshotJson?: string;
  decidedAt: number;
}

export interface RoutingDecisionInput {
  sourceId?: string;
  workId?: string;
  task: string;
  category: string;
  complexity: string;
  urgency?: string;
  confidence?: string;
  chosenSurface?: string;
  chosenModel?: string;
  via?: string;
  servedBy?: string;
  status: string;
  latencyMs?: number;
  consideredJson?: string;
  classificationJson?: string;
  classifierModel?: string;
  whyLogJson?: string;
  rejectionsJson?: string;
  verificationJson?: string;
  quotaSnapshotJson?: string;
  circuitSnapshotJson?: string;
}

export type VerificationRunState = 'pending' | 'passed' | 'failed' | 'needs_review' | 'verifier_unavailable' | 'timeout';

export interface VerificationRunInput {
  workId?: string;
  runId: string;
  routingDecisionId?: string;
  verifierSurface?: string;
  verifierModel?: string;
  state: VerificationRunState;
  summary?: string;
  attemptsJson?: string;
  startedAt: number;
  completedAt?: number;
}

export interface WorkRegistryDetail {
  item: WorkRegistryItem;
  events: WorkRegistryEvent[];
  runs: ExecutorRun[];
  decisions: RoutingDecision[];
  workflows?: Workflow[];
}

export interface CreateWorkItemInput {
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
  verificationStatus?: VerificationStatus;
  verificationSummary?: string;
  dryRun?: boolean;
  dueAt?: number;
}

export type UpdateWorkItemInput = Partial<CreateWorkItemInput> & { workId: string };

export interface WorkEventInput {
  workId: string;
  type: string;
  actor: string;
  message: string;
  metadata?: string;
}

const toTaskStatus = (status: WorkItemStatus): Task['status'] => {
  if (status === 'in_progress' || status === 'blocked' || status === 'done') return status;
  if (status === 'cancelled') return 'done';
  return 'todo';
};

const toTaskPriority = (priority: WorkItemPriority): Task['priority'] =>
  priority === 'critical' ? 'urgent' : priority;

export const workItemToTask = (item: WorkRegistryItem): Task => ({
  id: item.workId,
  title: item.title,
  category: 'OWN BUILDS',
  status: toTaskStatus(item.status),
  priority: toTaskPriority(item.priority),
  dueAt: item.dueAt ? new Date(item.dueAt).toISOString().slice(0, 10) : undefined,
  project: item.branch,
  assignee: item.executor ?? item.owner,
});

export function workItemsToTasksState(items: WorkRegistryItem[], fallback: TasksState): TasksState {
  if (items.length === 0) return fallback;

  const tasks = items.map(workItemToTask);
  const focusStrip = tasks.filter((task) => task.status === 'in_progress').slice(0, 5);
  const now = Date.now();
  const upcomingDeadlines = tasks
    .filter((task) => task.dueAt && task.status !== 'done')
    .map((task) => ({
      task,
      daysRemaining: Math.ceil((new Date(task.dueAt!).getTime() - now) / 86_400_000),
    }))
    .filter((deadline) => deadline.daysRemaining >= 0)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 5);

  return { tasks, focusStrip, upcomingDeadlines };
}

export type WorkRegistrySource = 'convex-live' | 'fallback-seed';

export const getWorkRegistrySource = (items: WorkRegistryItem[]): WorkRegistrySource =>
  items.length > 0 ? 'convex-live' : 'fallback-seed';
