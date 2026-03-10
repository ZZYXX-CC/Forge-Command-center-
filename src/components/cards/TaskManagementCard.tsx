import React from 'react';
import { cn } from '@/src/lib/utils';
import { StatusCard } from './StatusCard';
import { OverviewState, Task } from '@/src/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TaskManagementCardProps {
  data: OverviewState;
}

export const TaskManagementCard: React.FC<TaskManagementCardProps> = ({ data }) => {
  const queryClient = useQueryClient();
  const tasks = data.tasks || [];
  const summary = data.taskSummary;

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/tasks/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overview-state'] });
    },
  });

  const handleToggleTask = (task: Task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    updateTaskMutation.mutate({ id: task.id, status: newStatus });
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3, info: 4 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <StatusCard
      label="TASK MANAGEMENT"
      title="Operational Tasks"
      status={summary.overdueCount > 0 ? 'degraded' : 'healthy'}
      timestamp={data.meta.generatedAt}
      footerAction="View all tasks →"
      onFooterActionClick={() => {}}
    >
      <div className="space-y-4 py-2 flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center px-1">
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted uppercase font-bold">Open</span>
              <span className="text-heading-md">{summary.openTasks}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted uppercase font-bold">Overdue</span>
              <span className={cn("text-heading-md", summary.overdueCount > 0 ? "text-status-incident" : "text-text-primary")}>
                {summary.overdueCount}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-text-muted uppercase font-bold">Done Today</span>
            <div className="text-heading-md text-status-healthy">{summary.completedToday}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[300px]">
          {sortedTasks.map((task) => (
            <div 
              key={task.id}
              className={cn(
                "group flex items-start gap-3 p-3 rounded-md border transition-all",
                task.status === 'completed' 
                  ? "bg-surface-base/30 border-surface-border/50 opacity-60" 
                  : "bg-surface-overlay border-surface-border hover:border-emerald-accent/30"
              )}
            >
              <button 
                onClick={() => handleToggleTask(task)}
                disabled={updateTaskMutation.isPending}
                className={cn(
                  "mt-0.5 transition-colors",
                  task.status === 'completed' ? "text-status-healthy" : "text-text-muted hover:text-emerald-accent"
                )}
              >
                {task.status === 'completed' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn(
                    "text-label-sm font-bold truncate",
                    task.status === 'completed' && "line-through text-text-muted"
                  )}>
                    {task.title}
                  </span>
                  <span className={cn(
                    "text-[8px] font-bold px-1.5 py-0.5 rounded uppercase",
                    task.priority === 'urgent' ? "bg-status-incident/10 text-status-incident" :
                    task.priority === 'high' ? "bg-status-degraded/10 text-status-degraded" :
                    "bg-surface-border text-text-muted"
                  )}>
                    {task.priority}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 text-[9px] text-text-muted uppercase font-bold">
                    <span className="w-1 h-1 rounded-full bg-emerald-accent" />
                    {task.domain}
                  </div>
                  {task.dueAt && (
                    <div className={cn(
                      "flex items-center gap-1 text-[9px] font-bold uppercase",
                      new Date(task.dueAt) < new Date() ? "text-status-incident" : "text-text-muted"
                    )}>
                      <Clock size={10} />
                      {formatDistanceToNow(new Date(task.dueAt), { addSuffix: true })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </StatusCard>
  );
};
