import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ForgeIcon } from '../components/primitives/ForgeIcon';
import { DispatchJob, DispatchPollResult, OverviewState, Task, TasksState, Workflow, WorkflowStage, WorkflowStep, WorkflowVerification } from '../types';
import { fetchTasksState } from '../lib/tasksData';
import { cn } from '../lib/utils';
import { addWorkEvent, createWorkflow, createWorkItem, recordExecutorRun, recordRoutingDecision, recordVerificationRun, updateWorkflowStage, updateWorkItem, useWorkflowsForItem, useWorkItemDetail, useWorkItems } from '../lib/useConvex';
import { isConvexConfigured } from '../lib/convex';
import { getWorkRegistrySource, workItemsToTasksState } from '../lib/workRegistry';
import type { WorkItemPriority, WorkItemStatus } from '../lib/workRegistry';
import { DISPATCH_URL, cancelTask, createWorkflowRun, fetchDispatchHealth, fetchDispatchSurfaces, pollTask, submitTask } from '../lib/dispatchClient';

interface TasksProps {
  data: OverviewState;
}

type WorkStatus = Task['status'];

const columns: Array<{ id: WorkStatus; label: string; hint: string }> = [
  { id: 'todo', label: 'Ready', hint: 'Queued for SAGE assignment' },
  { id: 'in_progress', label: 'Running', hint: 'Executor or owner active' },
  { id: 'blocked', label: 'Blocked', hint: 'Needs decision / credential / review' },
  { id: 'done', label: 'Done', hint: 'Verified or shipped' },
];

const createStatuses: Array<{ value: WorkItemStatus; label: string }> = [
  { value: 'ready', label: 'Ready' },
  { value: 'in_progress', label: 'Running' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
];

const priorities: Array<{ value: WorkItemPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const priorityTone = (priority: Task['priority']) =>
  priority === 'urgent'
    ? 'border-status-incident/40 bg-status-incident/10 text-status-incident'
    : priority === 'high'
      ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
      : priority === 'medium'
        ? 'border-accent-primary/30 bg-accent-primary/10 text-accent-primary'
        : 'border-surface-border bg-surface-overlay text-text-muted';

const statusTone = (status: WorkStatus) =>
  status === 'done'
    ? 'text-status-healthy'
    : status === 'blocked'
      ? 'text-status-incident'
      : status === 'in_progress'
        ? 'text-accent-primary'
        : 'text-text-secondary';

const categoryTone = (category: Task['category']) =>
  category === 'OWN BUILDS'
    ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/20'
    : category === 'CLIENT WORK'
      ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
      : category === 'CONTENT'
        ? 'bg-pink-500/10 text-pink-300 border-pink-500/20'
        : 'bg-surface-overlay text-text-muted border-surface-border';

const dueLabel = (task: Task) => {
  if (!task.dueAt) return 'No deadline';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.dueAt);
  due.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days}d`;
};

const isOverdue = (task: Task) => Boolean(task.dueAt && task.status !== 'done' && new Date(task.dueAt) < new Date(new Date().toISOString().slice(0, 10)));

const runStatusTone = (status?: DispatchPollResult['status']) =>
  status === 'done'
    ? 'border-status-healthy/30 bg-status-healthy/10 text-status-healthy'
    : status === 'failed' || status === 'cancelled'
      ? 'border-status-incident/30 bg-status-incident/10 text-status-incident'
      : status === 'queued' || status === 'running'
        ? 'border-accent-primary/30 bg-accent-primary/10 text-accent-primary'
        : 'border-surface-border bg-surface-overlay text-text-muted';

const statusBadgeLabel = (status?: DispatchPollResult['status']) => {
  if (status === 'done') return '[DONE]';
  if (status === 'failed') return '[FAILED]';
  if (status === 'cancelled') return '[CANCELLED]';
  if (status === 'queued' || status === 'running') return '[RUNNING]';
  return '[IDLE]';
};

const workflowPipeline: Array<{ stage: WorkflowStage; label: string; icon: string }> = [
  { stage: 'queued', label: 'Trigger', icon: 'play' },
  { stage: 'dispatched', label: 'Dispatch', icon: 'route' },
  { stage: 'running', label: 'Executor', icon: 'terminal' },
  { stage: 'verifying', label: 'Verify', icon: 'shield-check' },
  { stage: 'done', label: 'Done', icon: 'check-read' },
];

const createWorkflowStages = (active: WorkflowStage = 'queued'): WorkflowStep[] => {
  const activeIndex = workflowPipeline.findIndex((step) => step.stage === active);
  return workflowPipeline.map((step, index) => ({
    stage: step.stage,
    label: step.label,
    status: index < activeIndex ? 'complete' : index === activeIndex ? 'active' : 'pending',
    timestamp: index === activeIndex ? Date.now() : undefined,
  }));
};

const workflowStagesFor = (stage: WorkflowStage, detail?: string, failedAt: WorkflowStage = 'running'): WorkflowStep[] => {
  if (stage === 'done') {
    return createWorkflowStages('done').map((step) => ({
      ...step,
      status: 'complete',
      detail: step.stage === 'done' ? detail : step.detail,
      timestamp: step.timestamp ?? Date.now(),
    }));
  }

  if (stage === 'failed' || stage === 'cancelled') {
    return createWorkflowStages(failedAt).map((step) => step.status === 'active'
      ? { ...step, status: stage, detail, timestamp: Date.now() }
      : step);
  }
  return createWorkflowStages(stage).map((step) => step.stage === stage ? { ...step, detail } : step);
};

const workflowTone = (status?: WorkflowStep['status']) =>
  status === 'complete'
    ? 'border-status-healthy bg-status-healthy/15 text-status-healthy'
    : status === 'active'
      ? 'border-accent-primary bg-accent-primary/15 text-accent-primary animate-pulse'
      : status === 'failed'
        ? 'border-status-incident bg-status-incident/15 text-status-incident'
        : status === 'cancelled'
          ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
        : 'border-surface-border bg-surface-overlay text-text-muted';

const isWorkflowActive = (workflow?: Workflow | null) =>
  workflow?.status === 'queued' || workflow?.status === 'dispatched' || workflow?.status === 'running' || workflow?.status === 'verifying';

const isHttpUrl = (value?: string | null) => Boolean(value && /^https?:\/\//i.test(value));

const verificationFromDispatch = (result: DispatchPollResult): WorkflowVerification => {
  if (result.verification) return result.verification;
  const cleanExit = result.status === 'done' && (result.exitCode ?? 0) === 0;
  return {
    lint: cleanExit,
    build: cleanExit,
    exitCode: result.exitCode ?? (cleanExit ? 0 : 1),
  };
};

const workflowStepLabel = (step: WorkflowStep, workflow?: Workflow | null) => {
  if (step.stage === 'running' && workflow?.executor) return `[RUNNING ${workflow.executor}]`;
  if (step.status === 'failed') return '[FAILED]';
  if (step.status === 'cancelled') return '[CANCELLED]';
  return `[${step.stage.toUpperCase()}]`;
};

const fallbackFromOverview = (data: OverviewState): TasksState => ({
  tasks: data.taskSummary.topTasks.map((task) => ({
    id: task.id,
    title: task.title,
    category: 'DAILY',
    status: task.completed ? 'done' : 'todo',
    priority: 'medium',
  })),
  focusStrip: [],
  upcomingDeadlines: [],
});

const TaskCard: React.FC<{ task: Task; selected: boolean; onSelect: () => void }> = ({ task, selected, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    className={cn(
      'w-full text-left rounded-xl border p-4 transition-colors',
      selected
        ? 'border-accent-primary bg-accent-primary/10'
        : 'border-surface-border bg-surface-raised hover:bg-surface-hover'
    )}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[13px] font-bold text-text-primary leading-snug">{task.title}</div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={cn('rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', categoryTone(task.category))}>
            {task.category}
          </span>
          <span className={cn('rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', priorityTone(task.priority))}>
            {task.priority}
          </span>
        </div>
      </div>
      <ForgeIcon
        name={task.status === 'done' ? 'check-read' : task.status === 'blocked' ? 'danger-triangle' : 'alt-arrow-right'}
        size="sm"
        className={statusTone(task.status)}
      />
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-muted">
      <span>{task.assignee ?? 'Unassigned'}</span>
      {task.client && <span>{task.client}</span>}
      {task.project && <span>{task.project}</span>}
      <span className={isOverdue(task) ? 'text-status-incident' : ''}>{dueLabel(task)}</span>
    </div>
  </button>
);

export const Tasks: React.FC<TasksProps> = ({ data }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<WorkItemPriority>('medium');
  const [newStatus, setNewStatus] = useState<WorkItemStatus>('ready');
  const [newDryRun, setNewDryRun] = useState(false);
  const [note, setNote] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [dispatchJob, setDispatchJob] = useState<DispatchJob | null>(null);
  const [dispatchRun, setDispatchRun] = useState<DispatchPollResult | null>(null);
  const [dispatchOutput, setDispatchOutput] = useState('Select a work item, then start a DISPATCH job.');
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const liveWorkItems = useWorkItems(100);
  const { data: tasksState, isLoading, error } = useQuery<TasksState>({
    queryKey: ['tasks-state'],
    queryFn: fetchTasksState,
    refetchInterval: 30_000,
    initialData: fallbackFromOverview(data),
  });
  const { data: dispatchHealth, error: dispatchHealthError } = useQuery({
    queryKey: ['tasks-dispatch-health'],
    queryFn: fetchDispatchHealth,
    refetchInterval: 10_000,
    retry: false,
  });
  const { data: dispatchSurfacesData } = useQuery({
    queryKey: ['tasks-dispatch-surfaces'],
    queryFn: fetchDispatchSurfaces,
    refetchInterval: 10_000,
    retry: false,
  });

  const registryState = useMemo(() => workItemsToTasksState(liveWorkItems, tasksState), [liveWorkItems, tasksState]);
  const registrySource = getWorkRegistrySource(liveWorkItems);
  const tasks = registryState.tasks;
  const selected = tasks.find((task) => task.id === selectedId) ?? tasks[0] ?? null;
  const selectedWorkItem = selected ? liveWorkItems.find((item) => item.workId === selected.id) : null;
  const selectedWorkItemDetail = useWorkItemDetail(selectedWorkItem?.workId);
  const workflows = useWorkflowsForItem(selectedWorkItem?.workId);
  const [localWorkflow, setLocalWorkflow] = useState<Workflow | null>(null);
  const [workflowJob, setWorkflowJob] = useState<DispatchJob | null>(null);
  const [workflowRun, setWorkflowRun] = useState<DispatchPollResult | null>(null);
  const [workflowOutput, setWorkflowOutput] = useState('Workflow runner idle.');
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [isStartingWorkflow, setIsStartingWorkflow] = useState(false);
  const dispatchSurfaces = dispatchSurfacesData?.surfaces ?? [];
  const availableSurfaces = dispatchSurfaces.filter((surface) => surface.available).length;
  const dispatchOnline = dispatchHealth?.status === 'ok';
  const counts = useMemo(() => {
    const open = tasks.filter((task) => task.status !== 'done').length;
    const running = tasks.filter((task) => task.status === 'in_progress').length;
    const blocked = tasks.filter((task) => task.status === 'blocked').length;
    const overdue = tasks.filter(isOverdue).length;
    return { open, running, blocked, overdue, total: tasks.length };
  }, [tasks]);

  const grouped = useMemo(() => {
    return columns.reduce<Record<WorkStatus, Task[]>>((acc, column) => {
      acc[column.id] = tasks.filter((task) => task.status === column.id);
      return acc;
    }, { todo: [], in_progress: [], blocked: [], done: [] });
  }, [tasks]);

  const canWrite = isConvexConfigured();
  const selectedIsLive = Boolean(selectedWorkItem);
  const activeRun = dispatchRun?.status === 'queued' || dispatchRun?.status === 'running';
  const canRestart = dispatchRun?.status === 'failed' || dispatchRun?.status === 'cancelled';
  const persistedWorkflow = workflows[0];
  const currentWorkflow = localWorkflow?.workItemId === selectedWorkItem?.workId && (!persistedWorkflow || localWorkflow.startTime >= persistedWorkflow.startTime)
    ? localWorkflow
    : persistedWorkflow;
  const workflowActive = isWorkflowActive(currentWorkflow);
  const workflowStages = currentWorkflow?.stages?.length
    ? currentWorkflow.stages
    : createWorkflowStages('queued').map((stage) => ({ ...stage, status: 'pending' as const }));
  const workflowCompleteCount = workflowStages.filter((step) => step.status === 'complete').length;
  const workflowProgressPct = Math.round((workflowCompleteCount / workflowPipeline.length) * 100);
  const currentWorkflowOutput = currentWorkflow?.output ?? workflowOutput;
  const currentWorkflowVerification = currentWorkflow?.verification ?? workflowRun?.verification ?? null;
  const currentWorkflowExitCode = currentWorkflow?.exitCode ?? workflowRun?.exitCode ?? null;

  useEffect(() => {
    if (!activeRun || !dispatchJob) return;

    let cancelled = false;
    const tick = async () => {
      try {
        const result = await pollTask(dispatchJob.id);
        if (cancelled) return;
        setDispatchRun(result);
        setDispatchError(null);
        setDispatchOutput((current) => {
          const nextOutput = result.output ?? '';
          const nextError = result.error ? `\n[stderr]\n${result.error}` : '';
          if (!nextOutput && !nextError) return current;
          const combined = `${nextOutput}${nextError}`;
          if (combined.startsWith(current)) return combined;
          if (current.includes(combined)) return current;
          return `${current}${current.endsWith('\n') ? '' : '\n'}${combined}`;
        });
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Dispatch polling failed.';
          setDispatchRun((current) => ({ ...(current ?? { status: 'running' }), status: 'failed', error: message }));
          setDispatchError(message);
        }
      }
    };

    void tick();
    const interval = window.setInterval(() => void tick(), 2_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeRun, dispatchJob]);

  const applyLocalWorkflowPatch = (workflowId: string, patch: Partial<Workflow>) => {
    setLocalWorkflow((current) => {
      if (!current || current.id !== workflowId) return current;
      return { ...current, ...patch };
    });
  };

  const persistWorkflowStage = async (
    workflowId: string,
    status: WorkflowStage,
    stages: WorkflowStep[],
    patch: Omit<Parameters<typeof updateWorkflowStage>[0], 'workflowId' | 'status' | 'stages'> = {},
  ) => {
    applyLocalWorkflowPatch(workflowId, { status, stages, ...patch });
    await updateWorkflowStage({ workflowId, status, stages, ...patch });
  };

  const persistExecutorRun = async (result: DispatchPollResult, job: DispatchJob, workflow: Workflow, completed = false) => {
    const executor = result.model ?? workflow.executor ?? 'DISPATCH';
    const surface = result.surface ?? workflow.surface ?? 'dispatch-auto';
    await recordExecutorRun({
      workId: workflow.workItemId,
      runId: job.id,
      executor,
      surface,
      model: result.model ?? undefined,
      status: result.status,
      promptPreview: job.prompt?.slice(0, 500),
      outputPreview: result.output?.slice(-1000),
      error: result.error,
      startedAt: workflow.startTime,
      completedAt: completed ? Date.now() : undefined,
      latencyMs: result.latencyMs ?? undefined,
    });
  };

  const persistDispatchControlPlane = async (result: DispatchPollResult, job: DispatchJob, workflow: Workflow) => {
    const dispatch = result.dispatch;
    if (!dispatch) return;
    const classification = dispatch.classification && typeof dispatch.classification === 'object'
      ? dispatch.classification as Record<string, unknown>
      : {};
    const verification = dispatch.verification && typeof dispatch.verification === 'object'
      ? dispatch.verification as Record<string, unknown>
      : {};
    const state = typeof verification.state === 'string' ? verification.state : 'needs_review';
    const safeState = ['pending', 'passed', 'failed', 'needs_review', 'verifier_unavailable', 'timeout'].includes(state)
      ? state as 'pending' | 'passed' | 'failed' | 'needs_review' | 'verifier_unavailable' | 'timeout'
      : 'needs_review';
    const decisionId = await recordRoutingDecision({
      sourceId: job.id,
      workId: workflow.workItemId,
      task: job.prompt ?? workflow.trigger,
      category: String(dispatch.category ?? classification.category ?? 'unknown'),
      complexity: String(dispatch.complexity ?? classification.complexity ?? 'routine'),
      urgency: typeof classification.urgency === 'string' ? classification.urgency : undefined,
      confidence: typeof classification.confidence === 'string' ? classification.confidence : undefined,
      chosenSurface: typeof dispatch.chosen_surface === 'string' ? dispatch.chosen_surface : result.surface ?? undefined,
      chosenModel: typeof dispatch.chosen_model === 'string' ? dispatch.chosen_model : result.model ?? undefined,
      via: typeof dispatch.via === 'string' ? dispatch.via : undefined,
      servedBy: result.model ?? undefined,
      status: String(dispatch.status ?? result.status),
      latencyMs: typeof dispatch.latency_ms === 'number' ? dispatch.latency_ms : result.latencyMs ?? undefined,
      consideredJson: JSON.stringify(dispatch.considered ?? []),
      classificationJson: JSON.stringify(classification),
      classifierModel: typeof dispatch.classifier_model === 'string' ? dispatch.classifier_model : undefined,
      whyLogJson: JSON.stringify(dispatch.why_log ?? []),
      rejectionsJson: JSON.stringify(dispatch.rejections ?? []),
      verificationJson: JSON.stringify(verification),
      quotaSnapshotJson: JSON.stringify(dispatch.quota_snapshot ?? {}),
      circuitSnapshotJson: JSON.stringify(dispatch.circuit_snapshot ?? {}),
    });
    await recordVerificationRun({
      workId: workflow.workItemId,
      runId: `${job.id}:verification`,
      routingDecisionId: typeof decisionId === 'string' ? decisionId : undefined,
      verifierSurface: Array.isArray((verification as any).attempts) ? (verification as any).attempts[0]?.surface : undefined,
      verifierModel: Array.isArray((verification as any).attempts) ? (verification as any).attempts[0]?.model : undefined,
      state: safeState,
      summary: `DISPATCH verification ${safeState}`,
      attemptsJson: JSON.stringify((verification as any).attempts ?? []),
      startedAt: workflow.startTime,
      completedAt: safeState === 'pending' ? undefined : Date.now(),
    });
  };

  useEffect(() => {
    if (!workflowJob || !currentWorkflow || !isWorkflowActive(currentWorkflow)) return;

    let cancelled = false;
    const tick = async () => {
      try {
        const result = await pollTask(workflowJob.id);
        if (cancelled) return;

        setWorkflowRun(result);
        setWorkflowError(null);
        setWorkflowOutput((current) => {
          const nextOutput = result.output ?? '';
          const nextError = result.error ? `\n[stderr]\n${result.error}` : '';
          const combined = `${nextOutput}${nextError}`;
          if (!combined) return current;
          if (combined.startsWith(current) || current.includes(combined)) return combined;
          return `${current}${current.endsWith('\n') ? '' : '\n'}${combined}`;
        });

        const executor = result.model ?? result.surface ?? currentWorkflow.executor ?? 'DISPATCH';
        const surface = result.surface ?? currentWorkflow.surface ?? 'dispatch-auto';

        if (result.status === 'queued') {
          await persistWorkflowStage(
            currentWorkflow.id,
            'dispatched',
            workflowStagesFor('dispatched', `job ${workflowJob.id} queued`),
            { dispatchJobId: workflowJob.id, executor, surface, output: result.output },
          );
          await persistExecutorRun(result, workflowJob, { ...currentWorkflow, executor, surface });
          return;
        }

        if (result.status === 'running') {
          await persistWorkflowStage(
            currentWorkflow.id,
            'running',
            workflowStagesFor('running', surface),
            { dispatchJobId: workflowJob.id, executor, surface, output: result.output, exitCode: result.exitCode ?? undefined },
          );
          await persistExecutorRun(result, workflowJob, { ...currentWorkflow, executor, surface });
          return;
        }

        if (result.status === 'cancelled') {
          await persistWorkflowStage(
            currentWorkflow.id,
            'cancelled',
            workflowStagesFor('cancelled', 'DISPATCH run cancelled', 'running'),
            { dispatchJobId: workflowJob.id, executor, surface, output: result.output, exitCode: result.exitCode ?? undefined, endTime: Date.now() },
          );
          await persistExecutorRun(result, workflowJob, { ...currentWorkflow, executor, surface }, true);
          setWorkflowJob(null);
          return;
        }

        const verification = verificationFromDispatch(result);
        await persistWorkflowStage(
          currentWorkflow.id,
          'verifying',
          workflowStagesFor('verifying', 'lint + build'),
          { dispatchJobId: workflowJob.id, executor, surface, output: result.output, exitCode: result.exitCode ?? verification.exitCode, verification },
        );

        const passed = result.status === 'done' && verification.lint && verification.build && verification.exitCode === 0;
        await persistWorkflowStage(
          currentWorkflow.id,
          passed ? 'done' : 'failed',
          workflowStagesFor(passed ? 'done' : 'failed', passed ? 'verification passed' : 'verification failed', 'verifying'),
          {
            dispatchJobId: workflowJob.id,
            executor,
            surface,
            output: result.output,
            exitCode: result.exitCode ?? verification.exitCode,
            verification,
            endTime: Date.now(),
          },
        );
        await persistExecutorRun(result, workflowJob, { ...currentWorkflow, executor, surface }, true);
        await persistDispatchControlPlane(result, workflowJob, { ...currentWorkflow, executor, surface });
        setWorkflowJob(null);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Workflow polling failed.';
          setWorkflowError(message);
          setWorkflowRun((current) => ({ ...(current ?? { status: 'running' }), status: 'failed', error: message }));
          await persistWorkflowStage(
            currentWorkflow.id,
            'failed',
            workflowStagesFor('failed', message, 'running'),
            { dispatchJobId: workflowJob.id, output: workflowOutput, exitCode: 1, endTime: Date.now() },
          );
          setWorkflowJob(null);
        }
      }
    };

    void tick();
    const interval = window.setInterval(() => void tick(), 2_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [workflowJob, currentWorkflow?.id, currentWorkflow?.status]);

  useEffect(() => {
    terminalRef.current?.scrollTo({ top: terminalRef.current.scrollHeight, behavior: 'smooth' });
  }, [dispatchOutput]);

  const runRegistryAction = async (action: () => Promise<void>, successMessage: string) => {
    setIsMutating(true);
    setActionError(null);
    setActionMessage(null);
    try {
      await action();
      setActionMessage(successMessage);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Work registry action failed.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleCreateWorkItem = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    void runRegistryAction(async () => {
      const created = await createWorkItem({
        title,
        priority: newPriority,
        status: newStatus,
        orchestrator: 'SAGE',
        owner: 'SAGE',
        executor: 'KERN',
        surface: 'command-center',
        dryRun: newDryRun,
      });
      setNewTitle('');
      setNewPriority('medium');
      setNewStatus('ready');
      setNewDryRun(false);
      setSelectedId(created.workId);
    }, 'Work item created.');
  };

  const handleCreateRouteSelfTest = () => {
    void runRegistryAction(async () => {
      const created = await createWorkItem({
        title: 'Route self-test: Command Center to DISPATCH',
        summary: 'Synthetic dry-run work item to verify Convex -> SAGE -> DISPATCH -> Convex without model execution.',
        priority: 'low',
        status: 'ready',
        orchestrator: 'SAGE',
        owner: 'SAGE',
        executor: 'DISPATCH',
        surface: 'dispatch-auto',
        verificationStatus: 'waived',
        verificationSummary: 'Synthetic dry-run awaiting SAGE orchestration.',
        dryRun: true,
      });
      setSelectedId(created.workId);
    }, 'Route self-test created.');
  };

  const handleStatusChange = (status: WorkItemStatus) => {
    if (!selectedWorkItem) return;
    void runRegistryAction(async () => {
      await updateWorkItem({ workId: selectedWorkItem.workId, status });
      await addWorkEvent({
        workId: selectedWorkItem.workId,
        type: 'status_update',
        actor: 'SAGE',
        message: `Status changed to ${status.replace('_', ' ')}`,
      });
    }, 'Work item status updated.');
  };

  const handleAddNote = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedWorkItem || !note.trim()) return;
    void runRegistryAction(async () => {
      await addWorkEvent({
        workId: selectedWorkItem.workId,
        type: 'note',
        actor: 'SAGE',
        message: note.trim(),
      });
      setNote('');
    }, 'Work event added.');
  };

  const handleCloseWorkItem = () => {
    if (!selectedWorkItem) return;
    void runRegistryAction(async () => {
      await updateWorkItem({ workId: selectedWorkItem.workId, status: 'cancelled' });
      await addWorkEvent({
        workId: selectedWorkItem.workId,
        type: 'closed',
        actor: 'SAGE',
        message: 'Closed from Command Center /tasks.',
      });
    }, 'Work item closed.');
  };

  const buildDispatchPayload = (task: Task) => ({
    repo: selectedWorkItem?.branch ?? selectedWorkItem?.surface ?? undefined,
    command: task.title,
    dryRun: selectedWorkItem?.dryRun,
    prompt: [
      `Work item: ${task.title}`,
      `ID: ${task.id}`,
      selectedWorkItem?.summary ? `Summary: ${selectedWorkItem.summary}` : null,
      task.client ? `Client: ${task.client}` : null,
      task.project ? `Project: ${task.project}` : null,
      `Priority: ${task.priority}`,
      `Status: ${task.status}`,
    ].filter(Boolean).join('\n'),
    routingIntent: {
      task_type: task.status === 'todo' || task.status === 'in_progress' ? 'implementation' : 'review',
      domain: task.category === 'OWN BUILDS' ? 'code' : task.category.toLowerCase().replace(/\s+/g, '_'),
      authority_agent: selectedWorkItem?.owner?.toLowerCase() || selectedWorkItem?.orchestrator?.toLowerCase() || 'sage',
      verification_policy: task.priority === 'urgent' || task.priority === 'high' ? 'required' : 'time_bounded',
      workId: selectedWorkItem?.workId ?? task.id,
      priority: task.priority,
    },
  });

  const handleStartJob = async () => {
    if (!selected) return;
    setIsSubmittingJob(true);
    setDispatchError(null);
    setDispatchOutput(`[START] ${selected.title}\nSubmitting DISPATCH job…`);
    try {
      const job = await submitTask(buildDispatchPayload(selected));
      setDispatchJob(job);
      setDispatchRun({ status: job.status, output: `[QUEUED] job ${job.id}` });
      setDispatchOutput((current) => `${current}\n[QUEUED] job ${job.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Dispatch submit failed.';
      setDispatchRun({ status: 'failed', error: message });
      setDispatchError(message);
      setDispatchOutput((current) => `${current}\n[FAILED] ${message}`);
    } finally {
      setIsSubmittingJob(false);
    }
  };

  const handleStartWorkflow = async () => {
    if (!selected || !selectedWorkItem) return;
    setIsStartingWorkflow(true);
    setWorkflowError(null);
    setWorkflowRun(null);
    setWorkflowJob(null);
    let workflowId: string | null = null;
    const queuedStages = createWorkflowStages('queued');
    try {
      const created = await createWorkflow({
        workItemId: selectedWorkItem.workId,
        trigger: selected.title,
        stages: queuedStages,
        executor: selectedWorkItem.executor ?? 'KERN',
        surface: selectedWorkItem.surface ?? 'dispatch-auto',
      });
      workflowId = created.workflowId;
      const workflow: Workflow = {
        id: created.workflowId,
        workItemId: selectedWorkItem.workId,
        trigger: selected.title,
        status: 'queued',
        stages: queuedStages,
        startTime: Date.now(),
        executor: selectedWorkItem.executor ?? 'KERN',
        surface: selectedWorkItem.surface ?? 'dispatch-auto',
      };
      setLocalWorkflow(workflow);
      setWorkflowOutput(`[WORKFLOW] ${created.workflowId}\n[QUEUED] ${selected.title}\nSubmitting to DISPATCH...`);

      const job = await createWorkflowRun({
        ...buildDispatchPayload(selected),
        workflowId: created.workflowId,
        workItemId: selectedWorkItem.workId,
        trigger: selected.title,
      });
      const dispatchedStages = workflowStagesFor('dispatched', `job ${job.id}`);
      setWorkflowJob(job);
      setWorkflowRun({ status: job.status, output: `[DISPATCHED] job ${job.id}` });
      await persistWorkflowStage(created.workflowId, 'dispatched', dispatchedStages, { dispatchJobId: job.id });
      await recordExecutorRun({
        workId: selectedWorkItem.workId,
        runId: job.id,
        executor: selectedWorkItem.executor ?? 'DISPATCH',
        surface: selectedWorkItem.surface ?? 'dispatch-auto',
        status: job.status,
        promptPreview: job.prompt?.slice(0, 500),
        startedAt: workflow.startTime,
      });
      setWorkflowOutput((current) => `${current}\n[DISPATCHED] job ${job.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Workflow start failed.';
      const failedStages = workflowStagesFor('failed', message);
      setWorkflowRun({ status: 'failed', error: message });
      setWorkflowError(message);
      setLocalWorkflow((workflow) => workflow ? { ...workflow, status: 'failed', stages: failedStages, output: message, endTime: Date.now() } : workflow);
      if (workflowId) {
        await updateWorkflowStage({ workflowId, status: 'failed', stages: failedStages, output: message, exitCode: 1, endTime: Date.now() });
      }
      setWorkflowOutput((current) => `${current}\n[FAILED] ${message}`);
    } finally {
      setIsStartingWorkflow(false);
    }
  };

  const handleRestartJob = () => {
    void handleStartJob();
  };

  const handleRerunWorkflow = () => {
    void handleStartWorkflow();
  };

  const handleCancelJob = async () => {
    if (!dispatchJob) return;
    const result = await cancelTask(dispatchJob);
    setDispatchRun(result);
    setDispatchOutput((current) => `${current}${current.endsWith('\n') ? '' : '\n'}${result.output ?? '[CANCELLED]'}`);
  };

  return (
    <main className="flex-1 flex flex-col min-h-0 bg-surface-base overflow-hidden font-ui">
      <div className="px-6 py-4 border-b border-surface-border flex items-center gap-3 flex-wrap">
        <ForgeIcon name="checklist-minimalistic" size="md" className="text-accent-primary" />
        <div>
          <h1 className="text-heading-md font-bold text-text-primary">TASKS</h1>
          <p className="text-[11px] text-text-muted uppercase tracking-widest">FORGE work registry cockpit</p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-[11px]">
          <span className="rounded bg-surface-overlay px-2 py-1 text-text-secondary">open: <b className="text-text-primary">{counts.open}</b></span>
          <span className="rounded bg-accent-primary/10 px-2 py-1 text-accent-primary">running: {counts.running}</span>
          <span className="rounded bg-status-incident/10 px-2 py-1 text-status-incident">blocked: {counts.blocked}</span>
          <span className="rounded bg-surface-overlay px-2 py-1 text-text-muted">total: {counts.total}</span>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-surface-border bg-surface-raised/20">
        <p className="max-w-5xl text-[12px] leading-relaxed text-text-secondary">
          This page is now the Command Center cockpit for the Convex Work Registry. The registry tracks work items,
          SAGE orchestration, owner/executor assignment, DISPATCH routing, verification state, blockers, and GitHub audit links.
          When <span className="font-mono">VITE_CONVEX_URL</span> is configured, this page reads live Convex work items. Otherwise it falls back to the local task dataset and keeps the same shape for the live registry.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono">
          <span className={cn('rounded-full border px-2 py-1', dispatchOnline ? 'border-status-healthy/30 bg-status-healthy/10 text-status-healthy' : 'border-status-incident/30 bg-status-incident/10 text-status-incident')}>
            DISPATCH {dispatchOnline ? 'online' : 'unreachable'}
          </span>
          <span className="rounded-full border border-status-healthy/30 bg-status-healthy/10 px-2 py-1 text-status-healthy">KERN GPT-5.5 live</span>
          <span className="rounded-full border border-status-healthy/30 bg-status-healthy/10 px-2 py-1 text-status-healthy">Codex workspace-write live</span>
          <span className={cn('rounded-full border px-2 py-1', liveWorkItems.length > 0 ? 'border-status-healthy/30 bg-status-healthy/10 text-status-healthy' : 'border-surface-border bg-surface-overlay text-text-muted')}>
            {registrySource === 'convex-live' ? 'Convex live' : 'local task fallback'}
          </span>
          {error && <span className="rounded-full border border-status-incident/30 bg-status-incident/10 px-2 py-1 text-status-incident">task source fallback</span>}
          {isLoading && <span className="rounded-full border border-accent-primary/30 bg-accent-primary/10 px-2 py-1 text-accent-primary">loading</span>}
        </div>
        <form onSubmit={handleCreateWorkItem} className="mt-4 rounded-xl border border-surface-border bg-surface-base p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-text-muted">Add work item</div>
              <div className="mt-1 text-[12px] text-text-secondary">
                {canWrite ? 'Creates directly in Convex Work Registry.' : 'Convex is not configured; fallback board is read-only.'}
              </div>
            </div>
            {actionMessage && <span className="text-[11px] text-status-healthy">{actionMessage}</span>}
            {actionError && <span className="text-[11px] text-status-incident">{actionError}</span>}
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_140px_140px_auto_auto]">
            <input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="Title"
              disabled={!canWrite || isMutating}
              className="rounded-lg border border-surface-border bg-surface-overlay px-3 py-2 text-[12px] text-text-primary outline-none placeholder:text-text-muted focus:border-accent-primary disabled:cursor-not-allowed disabled:opacity-50"
            />
            <select
              value={newPriority}
              onChange={(event) => setNewPriority(event.target.value as WorkItemPriority)}
              disabled={!canWrite || isMutating}
              className="rounded-lg border border-surface-border bg-surface-overlay px-3 py-2 text-[12px] text-text-primary outline-none focus:border-accent-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {priorities.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}
            </select>
            <select
              value={newStatus}
              onChange={(event) => setNewStatus(event.target.value as WorkItemStatus)}
              disabled={!canWrite || isMutating}
              className="rounded-lg border border-surface-border bg-surface-overlay px-3 py-2 text-[12px] text-text-primary outline-none focus:border-accent-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
            <button
              type="submit"
              disabled={!canWrite || isMutating || !newTitle.trim()}
              className="rounded-lg bg-accent-primary px-4 py-2 text-[12px] font-bold text-surface-base transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isMutating ? 'Saving…' : 'Add'}
            </button>
            <button
              type="button"
              onClick={handleCreateRouteSelfTest}
              disabled={!canWrite || isMutating}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-surface-border bg-surface-overlay px-4 py-2 text-[12px] font-bold text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ForgeIcon name="routing-2" size="sm" />
              Route self-test
            </button>
          </div>
          <label className="mt-3 inline-flex items-center gap-2 text-[11px] text-text-secondary">
            <input
              type="checkbox"
              checked={newDryRun}
              onChange={(event) => setNewDryRun(event.target.checked)}
              disabled={!canWrite || isMutating}
              className="h-3.5 w-3.5 accent-current disabled:cursor-not-allowed"
            />
            Dry-run only
          </label>
        </form>
        <div className="mt-4 rounded-xl border border-surface-border bg-surface-base p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-text-muted">Executor surface status</div>
              <div className="mt-1 text-[12px] text-text-secondary">
                {dispatchOnline
                  ? `${availableSurfaces}/${dispatchSurfaces.length} DISPATCH surfaces available from ${DISPATCH_URL}`
                  : `Cannot reach DISPATCH at ${DISPATCH_URL}`}
              </div>
            </div>
            {dispatchHealthError && <span className="text-[11px] text-status-incident">health check failed</span>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {dispatchSurfaces.map((surface) => (
              <span
                key={surface.surface}
                title={`${surface.kind ?? 'surface'}${surface.billing ? ` · ${surface.billing}` : ''}${surface.detail ? ` · ${surface.detail}` : ''}`}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-mono',
                  surface.available
                    ? 'border-status-healthy/30 bg-status-healthy/10 text-status-healthy'
                    : 'border-status-incident/30 bg-status-incident/10 text-status-incident'
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', surface.available ? 'bg-status-healthy' : 'bg-status-incident')} />
                {surface.surface}
                {surface.via && <span className="text-text-muted">/{surface.via}</span>}
              </span>
            ))}
            {dispatchSurfaces.length === 0 && (
              <span className="text-[11px] text-text-muted">Surface list unavailable; /dispatch still shows routing history when reachable.</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid flex-1 min-h-0 grid-cols-1 xl:grid-cols-[1fr_360px] overflow-hidden">
        <section className="min-w-0 overflow-auto p-6">
          <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
              <div className="text-[10px] uppercase tracking-widest text-text-muted">Open Work</div>
              <div className="mt-2 text-mono-lg text-text-primary">{counts.open}</div>
            </div>
            <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
              <div className="text-[10px] uppercase tracking-widest text-text-muted">In Execution</div>
              <div className="mt-2 text-mono-lg text-accent-primary">{counts.running}</div>
            </div>
            <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
              <div className="text-[10px] uppercase tracking-widest text-text-muted">Blocked</div>
              <div className="mt-2 text-mono-lg text-status-incident">{counts.blocked}</div>
            </div>
            <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
              <div className="text-[10px] uppercase tracking-widest text-text-muted">Overdue</div>
              <div className="mt-2 text-mono-lg text-amber-300">{counts.overdue}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-4">
            {columns.map((column) => (
              <div key={column.id} className="min-h-[360px] rounded-xl border border-surface-border bg-surface-overlay/30 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-[12px] font-bold uppercase tracking-widest text-text-primary">{column.label}</div>
                    <div className="text-[10px] text-text-muted">{column.hint}</div>
                  </div>
                  <span className="rounded bg-surface-raised px-2 py-1 text-[11px] font-mono text-text-secondary">
                    {grouped[column.id].length}
                  </span>
                </div>
                <div className="space-y-3">
                  {grouped[column.id].map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      selected={selected?.id === task.id}
                      onSelect={() => setSelectedId(task.id)}
                    />
                  ))}
                  {grouped[column.id].length === 0 && (
                    <div className="rounded-lg border border-dashed border-surface-border p-4 text-center text-[12px] text-text-muted">
                      No items.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="border-t xl:border-t-0 xl:border-l border-surface-border bg-surface-raised/30 overflow-auto p-5">
          {selected ? (
            <div className="space-y-5">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-text-muted">Selected work item</div>
                <h2 className="mt-2 text-heading-sm font-bold text-text-primary">{selected.title}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={cn('rounded border px-2 py-1 text-[10px] font-bold uppercase', categoryTone(selected.category))}>{selected.category}</span>
                  <span className={cn('rounded border px-2 py-1 text-[10px] font-bold uppercase', priorityTone(selected.priority))}>{selected.priority}</span>
                  <span className={cn('rounded bg-surface-overlay px-2 py-1 text-[10px] font-bold uppercase', statusTone(selected.status))}>{selected.status.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="rounded-xl border border-surface-border bg-surface-base p-4 space-y-3 text-[12px]">
                <div className="flex justify-between gap-3"><span className="text-text-muted">Owner</span><span className="text-text-primary">SAGE</span></div>
                <div className="flex justify-between gap-3"><span className="text-text-muted">Executor</span><span className="text-text-primary">{selectedWorkItem?.executor ?? selected.assignee ?? 'KERN / DISPATCH'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-text-muted">Surface</span><span className="text-text-primary">{selectedWorkItem?.surface ?? 'dispatch-auto'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-text-muted">Verification</span><span className="text-status-healthy">{selectedWorkItem?.verificationStatus?.replace('_', ' ') ?? 'lint/build required'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-text-muted">Mode</span><span className={selectedWorkItem?.dryRun ? 'text-accent-primary' : 'text-text-primary'}>{selectedWorkItem?.dryRun ? 'dry-run' : 'execution'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-text-muted">Deadline</span><span className={isOverdue(selected) ? 'text-status-incident' : 'text-text-primary'}>{dueLabel(selected)}</span></div>
                {selectedWorkItem?.pullRequestUrl && (
                  <a href={selectedWorkItem.pullRequestUrl} className="block text-accent-primary hover:underline" target="_blank" rel="noreferrer">Open GitHub PR →</a>
                )}
              </div>

              <div className="rounded-xl border border-surface-border bg-surface-base p-4 space-y-3 text-[12px]">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-text-muted">Live actions</div>
                  {!canWrite && <div className="mt-1 text-text-muted">Convex unavailable; fallback items remain read-only.</div>}
                  {canWrite && !selectedIsLive && <div className="mt-1 text-text-muted">Select a Convex live item to update status, close, or add notes.</div>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {createStatuses.map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() => handleStatusChange(status.value)}
                      disabled={!canWrite || !selectedIsLive || isMutating}
                      className="rounded-lg border border-surface-border bg-surface-overlay px-3 py-2 text-left text-[11px] font-bold text-text-secondary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Mark {status.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleCloseWorkItem}
                  disabled={!canWrite || !selectedIsLive || isMutating}
                  className="w-full rounded-lg border border-status-incident/30 bg-status-incident/10 px-3 py-2 text-left text-[11px] font-bold text-status-incident disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Close / cancel item
                </button>
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Add work event / note"
                    disabled={!canWrite || !selectedIsLive || isMutating}
                    rows={3}
                    className="w-full rounded-lg border border-surface-border bg-surface-overlay px-3 py-2 text-[12px] text-text-primary outline-none placeholder:text-text-muted focus:border-accent-primary disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!canWrite || !selectedIsLive || isMutating || !note.trim()}
                    className="w-full rounded-lg bg-accent-primary px-3 py-2 text-[11px] font-bold text-surface-base disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add note
                  </button>
                </form>
              </div>

              <div className="rounded-xl border border-surface-border bg-surface-base p-4 space-y-3 text-[12px]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-text-muted">Execution Cockpit</div>
                    <div className="mt-1 text-text-secondary">Submit and watch DISPATCH executor output for the selected work item.</div>
                  </div>
                  <span className={cn('shrink-0 rounded-full border px-2 py-1 font-mono text-[10px]', runStatusTone(dispatchRun?.status))}>
                    {statusBadgeLabel(dispatchRun?.status)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleStartJob}
                    disabled={!selected || activeRun || isSubmittingJob}
                    className="rounded-lg bg-accent-primary px-3 py-2 text-[11px] font-bold text-surface-base disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmittingJob ? 'Starting…' : 'Start Job'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRestartJob}
                    disabled={!selected || activeRun || isSubmittingJob || !canRestart}
                    className="rounded-lg border border-surface-border bg-surface-overlay px-3 py-2 text-[11px] font-bold text-text-secondary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Restart
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelJob}
                    disabled={!dispatchJob || !activeRun}
                    className="rounded-lg border border-status-incident/30 bg-status-incident/10 px-3 py-2 text-[11px] font-bold text-status-incident disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
                {dispatchError && <div className="text-[11px] text-status-incident">{dispatchError}</div>}
                <div
                  ref={terminalRef}
                  className="font-mono text-xs bg-black text-green-400 p-3 rounded-lg h-64 overflow-auto whitespace-pre-wrap break-words"
                >
                  {dispatchOutput}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-[10px] text-text-secondary">
                  <div>job: <span className="text-text-primary">{dispatchJob?.id ?? '—'}</span></div>
                  <div>surface: <span className="text-text-primary">{dispatchRun?.surface ?? '—'}</span></div>
                  <div>model: <span className="text-text-primary">{dispatchRun?.model ?? '—'}</span></div>
                  <div>latency: <span className="text-text-primary">{dispatchRun?.latencyMs != null ? `${dispatchRun.latencyMs}ms` : '—'}</span></div>
                  <div>exit code: <span className="text-text-primary">{dispatchRun?.exitCode ?? '—'}</span></div>
                  <div>status: <span className="text-text-primary">{dispatchRun?.status ?? 'idle'}</span></div>
                </div>
              </div>

              <div className="rounded-xl border border-surface-border bg-surface-base p-4 space-y-4 text-[12px]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-text-muted">Workflow Runner</div>
                    <div className="mt-1 text-text-secondary">Work Registry → DISPATCH → Executor → Verify → Convex closeout.</div>
                  </div>
                  <span className={cn('shrink-0 rounded-full border px-2 py-1 font-mono text-[10px]', workflowTone(workflowStages.find((stage) => stage.status === 'active' || stage.status === 'failed')?.status))}>
                    [{currentWorkflow?.status?.toUpperCase() ?? 'IDLE'}]
                  </span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {workflowStages.map((stage, index, allStages) => {
                    const pipelineMeta = workflowPipeline.find((step) => step.stage === stage.stage);
                    return (
                      <React.Fragment key={`${stage.stage}-${index}`}>
                        <div className={cn('min-w-[92px] rounded-lg border px-2 py-2 text-center transition-colors', workflowTone(stage.status))} title={stage.detail}>
                          <ForgeIcon name={pipelineMeta?.icon ?? 'alt-arrow-right'} size="sm" className="mx-auto mb-1" />
                          <div className="font-bold uppercase tracking-wide">{stage.label}</div>
                          <div className="mt-1 font-mono text-[10px]">{workflowStepLabel(stage, currentWorkflow)}</div>
                        </div>
                        {index < allStages.length - 1 && <div className="text-text-muted">→</div>}
                      </React.Fragment>
                    );
                  })}
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-overlay">
                  <div
                    className={cn('h-full rounded-full transition-all', currentWorkflow?.status === 'failed' ? 'bg-status-incident' : 'bg-accent-primary')}
                    style={{ width: `${Math.max(currentWorkflow ? 8 : 0, workflowProgressPct)}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-[10px] text-text-secondary">
                  <div>workflow: <span className="text-text-primary">{currentWorkflow?.id ?? '—'}</span></div>
                  <div>dispatch: <span className="text-text-primary">{currentWorkflow?.dispatchJobId ?? workflowJob?.id ?? '—'}</span></div>
                  <div>executor: <span className="text-text-primary">{currentWorkflow?.executor ?? workflowRun?.model ?? '—'}</span></div>
                  <div>surface: <span className="text-text-primary">{currentWorkflow?.surface ?? workflowRun?.surface ?? '—'}</span></div>
                  <div>exit code: <span className="text-text-primary">{currentWorkflowExitCode ?? '—'}</span></div>
                  <div>verification: <span className={cn(currentWorkflowVerification?.lint && currentWorkflowVerification?.build ? 'text-status-healthy' : currentWorkflowVerification ? 'text-status-incident' : 'text-text-primary')}>
                    {currentWorkflowVerification ? `lint ${currentWorkflowVerification.lint ? 'ok' : 'fail'} / build ${currentWorkflowVerification.build ? 'ok' : 'fail'}` : selectedWorkItem?.verificationStatus ?? '—'}
                  </span></div>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                  <span className={cn('rounded-full border px-2 py-1', currentWorkflowVerification?.lint ? 'border-status-healthy/30 bg-status-healthy/10 text-status-healthy' : currentWorkflowVerification ? 'border-status-incident/30 bg-status-incident/10 text-status-incident' : 'border-surface-border bg-surface-overlay text-text-muted')}>
                    lint {currentWorkflowVerification ? (currentWorkflowVerification.lint ? 'passed' : 'failed') : 'pending'}
                  </span>
                  <span className={cn('rounded-full border px-2 py-1', currentWorkflowVerification?.build ? 'border-status-healthy/30 bg-status-healthy/10 text-status-healthy' : currentWorkflowVerification ? 'border-status-incident/30 bg-status-incident/10 text-status-incident' : 'border-surface-border bg-surface-overlay text-text-muted')}>
                    build {currentWorkflowVerification ? (currentWorkflowVerification.build ? 'passed' : 'failed') : 'pending'}
                  </span>
                  <span className="rounded-full border border-surface-border bg-surface-overlay px-2 py-1 text-text-muted">
                    {workflowCompleteCount}/{workflowPipeline.length} stages
                  </span>
                </div>
                {workflowError && <div className="text-[11px] text-status-incident">{workflowError}</div>}
                {currentWorkflowOutput && currentWorkflowOutput !== 'Workflow runner idle.' && (
                  <div className="space-y-2">
                    {isHttpUrl(currentWorkflowOutput) ? (
                      <a href={currentWorkflowOutput} className="block text-accent-primary hover:underline" target="_blank" rel="noreferrer">
                        Open executor output →
                      </a>
                    ) : (
                      <a href={`data:text/plain;charset=utf-8,${encodeURIComponent(currentWorkflowOutput)}`} download={`${currentWorkflow?.id ?? 'workflow'}-output.txt`} className="block text-accent-primary hover:underline">
                        Download executor output →
                      </a>
                    )}
                    <div className="max-h-32 overflow-auto rounded-lg bg-black p-3 font-mono text-[10px] text-green-400 whitespace-pre-wrap break-words">
                      {currentWorkflowOutput}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleStartWorkflow}
                    disabled={!canWrite || !selectedIsLive || workflowActive || isStartingWorkflow}
                    className="rounded-lg bg-accent-primary px-3 py-2 text-[11px] font-bold text-surface-base disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isStartingWorkflow ? 'Starting…' : 'Start Workflow'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRerunWorkflow}
                    disabled={!canWrite || !selectedIsLive || workflowActive || isStartingWorkflow || !currentWorkflow}
                    className="rounded-lg border border-surface-border bg-surface-overlay px-3 py-2 text-[11px] font-bold text-text-secondary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Re-run
                  </button>
                </div>
                {!selectedIsLive && <div className="text-[11px] text-text-muted">Select a Convex live work item to persist workflows.</div>}
              </div>

              {(selectedWorkItem?.summary || selectedWorkItem?.blocker || selectedWorkItem?.verificationSummary) && (
                <div className="rounded-xl border border-surface-border bg-surface-base p-4 space-y-3 text-[12px]">
                  {selectedWorkItem.summary && <p className="text-text-secondary">{selectedWorkItem.summary}</p>}
                  {selectedWorkItem.blocker && <p className="text-status-incident">Blocker: {selectedWorkItem.blocker}</p>}
                  {selectedWorkItem.verificationSummary && <p className="text-status-healthy">Verification: {selectedWorkItem.verificationSummary}</p>}
                </div>
              )}

              <div>
                <div className="mb-2 text-[10px] uppercase tracking-widest text-text-muted">Execution timeline</div>
                <div className="space-y-2 text-[12px]">
                  {selectedWorkItemDetail ? (
                    <>
                      {selectedWorkItemDetail.events.slice(0, 4).map((event) => (
                        <div key={event._id} className="rounded-lg border border-surface-border bg-surface-base p-3">
                          <div className="font-bold text-text-primary">{event.type}</div>
                          <div className="text-text-muted">{event.actor}: {event.message}</div>
                        </div>
                      ))}
                      {selectedWorkItemDetail.runs.slice(0, 2).map((run) => (
                        <div key={run._id} className="rounded-lg border border-surface-border bg-surface-base p-3">
                          <div className="font-bold text-text-primary">Executor run: {run.status}</div>
                          <div className="text-text-muted">{run.executor} via {run.surface}{run.model ? ` · ${run.model}` : ''}</div>
                        </div>
                      ))}
                      {selectedWorkItemDetail.decisions.slice(0, 2).map((decision) => (
                        <div key={decision._id} className="rounded-lg border border-surface-border bg-surface-base p-3">
                          <div className="font-bold text-text-primary">DISPATCH decision: {decision.status}</div>
                          <div className="text-text-muted">{decision.chosenSurface ?? 'no surface'}{decision.chosenModel ? ` · ${decision.chosenModel}` : ''}</div>
                        </div>
                      ))}
                      {selectedWorkItemDetail.events.length === 0 && selectedWorkItemDetail.runs.length === 0 && selectedWorkItemDetail.decisions.length === 0 && (
                        <div className="rounded-lg border border-surface-border bg-surface-base p-3 text-text-muted">
                          Live registry item found. Events, executor runs, and DISPATCH decisions will appear here as they are recorded.
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="rounded-lg border border-surface-border bg-surface-base p-3">
                        <div className="font-bold text-text-primary">Fallback seed captured</div>
                        <div className="text-text-muted">Visible in /tasks while Convex workItems are absent or unavailable.</div>
                      </div>
                      <div className="rounded-lg border border-surface-border bg-surface-base p-3">
                        <div className="font-bold text-text-primary">Live registry path</div>
                        <div className="text-text-muted">Create Convex workItems, append workEvents, and record executorRuns to replace this seed without changing the board UI.</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-text-muted">No task selected.</div>
          )}
        </aside>
      </div>
    </main>
  );
};
