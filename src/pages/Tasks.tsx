import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ForgeIcon } from '../components/primitives/ForgeIcon';
import { OverviewState, Task, TasksState } from '../types';
import { fetchTasksState } from '../lib/tasksData';
import { cn } from '../lib/utils';
import { ConvexWorkItem, useWorkItems } from '../lib/useConvex';

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

const workItemToTask = (item: ConvexWorkItem): Task => {
  const status: Task['status'] =
    item.status === 'in_progress'
      ? 'in_progress'
      : item.status === 'blocked'
        ? 'blocked'
        : item.status === 'done' || item.status === 'cancelled'
          ? 'done'
          : 'todo';
  const priority: Task['priority'] = item.priority === 'critical' ? 'urgent' : item.priority;

  return {
    id: item.workId,
    title: item.title,
    category: 'OWN BUILDS',
    status,
    priority,
    dueAt: item.dueAt ? new Date(item.dueAt).toISOString().slice(0, 10) : undefined,
    project: item.branch,
    assignee: item.executor ?? item.owner,
  };
};

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
  const liveWorkItems = useWorkItems(100);
  const { data: tasksState, isLoading, error } = useQuery<TasksState>({
    queryKey: ['tasks-state'],
    queryFn: fetchTasksState,
    refetchInterval: 30_000,
    initialData: fallbackFromOverview(data),
  });

  const tasks = liveWorkItems.length > 0 ? liveWorkItems.map(workItemToTask) : tasksState.tasks;
  const selectedWorkItem = selectedId ? liveWorkItems.find((item) => item.workId === selectedId) : liveWorkItems[0];
  const selected = tasks.find((task) => task.id === selectedId) ?? tasks[0] ?? null;
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
          <span className="rounded-full border border-status-healthy/30 bg-status-healthy/10 px-2 py-1 text-status-healthy">DISPATCH deployed</span>
          <span className="rounded-full border border-status-healthy/30 bg-status-healthy/10 px-2 py-1 text-status-healthy">KERN GPT-5.5 live</span>
          <span className="rounded-full border border-status-healthy/30 bg-status-healthy/10 px-2 py-1 text-status-healthy">Codex workspace-write live</span>
          <span className={cn('rounded-full border px-2 py-1', liveWorkItems.length > 0 ? 'border-status-healthy/30 bg-status-healthy/10 text-status-healthy' : 'border-surface-border bg-surface-overlay text-text-muted')}>
            {liveWorkItems.length > 0 ? 'Convex live' : 'local task fallback'}
          </span>
          {error && <span className="rounded-full border border-status-incident/30 bg-status-incident/10 px-2 py-1 text-status-incident">task source fallback</span>}
          {isLoading && <span className="rounded-full border border-accent-primary/30 bg-accent-primary/10 px-2 py-1 text-accent-primary">loading</span>}
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
                <div className="flex justify-between gap-3"><span className="text-text-muted">Deadline</span><span className={isOverdue(selected) ? 'text-status-incident' : 'text-text-primary'}>{dueLabel(selected)}</span></div>
                {selectedWorkItem?.pullRequestUrl && (
                  <a href={selectedWorkItem.pullRequestUrl} className="block text-accent-primary hover:underline" target="_blank" rel="noreferrer">Open GitHub PR →</a>
                )}
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
                  <div className="rounded-lg border border-surface-border bg-surface-base p-3">
                    <div className="font-bold text-text-primary">Work captured</div>
                    <div className="text-text-muted">Visible in /tasks. Ready for Convex-backed persistence.</div>
                  </div>
                  <div className="rounded-lg border border-surface-border bg-surface-base p-3">
                    <div className="font-bold text-text-primary">SAGE orchestration</div>
                    <div className="text-text-muted">Assign owner/executor, track blocker, attach PR/issue.</div>
                  </div>
                  <div className="rounded-lg border border-surface-border bg-surface-base p-3">
                    <div className="font-bold text-text-primary">DISPATCH execution</div>
                    <div className="text-text-muted">Route to KERN, Codex, Claude Code, Cursor, Ollama, NIM, or OpenRouter.</div>
                  </div>
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
