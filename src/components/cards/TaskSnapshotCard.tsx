import React from 'react';
import { StatusCard } from './StatusCard';
import { OverviewState } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ForgeIcon } from '../primitives/ForgeIcon';

interface TaskSnapshotCardProps {
  data: OverviewState;
}

export const TaskSnapshotCard: React.FC<TaskSnapshotCardProps> = ({ data }) => {
  const navigate = useNavigate();
  const summary = data.taskSummary;

  return (
    <StatusCard
      label="TASK MANAGEMENT"
      title="Daily Operations"
      status={summary.overdueCount > 0 ? 'degraded' : 'healthy'}
      timestamp={data.meta.generatedAt}
      footerAction="View all tasks →"
      onFooterActionClick={() => navigate('/tasks')}
    >
      <div className="space-y-6 py-2">
        <div className="flex flex-col">
          <div className="text-label-sm text-text-muted uppercase tracking-wider">Completed Today</div>
          <div className="text-display-lg font-mono text-status-healthy">
            {summary.completedToday}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-label-sm text-text-muted uppercase">Open</div>
            <div className="text-mono-lg text-text-primary">
              {summary.openTasks}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-label-sm text-text-muted uppercase">Due Today</div>
            <div className="text-mono-lg text-emerald-accent">
              {summary.dueToday}
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-surface-border">
          {summary.topTasks.slice(0, 2).map(task => (
            <div key={task.id} className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/tasks')}>
              <div className={cn(
                "w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors",
                task.completed ? "bg-status-healthy border-status-healthy" : "border-surface-border group-hover:border-text-muted"
              )}>
                {task.completed && <ForgeIcon name="check-read" size="xs" className="text-text-inverse" />}
              </div>
              <span className={cn(
                "text-label-sm truncate transition-colors",
                task.completed ? "text-text-muted line-through" : "text-text-secondary group-hover:text-text-primary"
              )}>
                {task.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </StatusCard>
  );
};
