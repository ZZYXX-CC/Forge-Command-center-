import type { TasksState, Task } from '@/src/types';
import { generateCommandCenterSeedTasks } from '@/src/lib/workQueueSeed';
// import { paperclip } from '@/src/lib/paperclip';

const USE_PAPERCLIP_MOCK = false;

function generateEmptyTasksState(): TasksState {
  return {
    tasks: [],
    focusStrip: [],
    upcomingDeadlines: [],
  };
}

export async function fetchTasksState(): Promise<TasksState> {
  return generateEmptyTasksState();
}
