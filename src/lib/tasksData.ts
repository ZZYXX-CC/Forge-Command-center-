import type { TasksState, Task } from '@/src/types';
import { generateCommandCenterSeedTasks } from '@/src/lib/workQueueSeed';
// import { paperclip } from '@/src/lib/paperclip';

const USE_PAPERCLIP_MOCK = true;

function generateMockTasksState(): TasksState {
  const now = Date.now();

  const tasks: Task[] = [
    ...generateCommandCenterSeedTasks(now),
    // CLIENT WORK
    { id: 't1', title: 'Review Acme Corp deliverables', category: 'CLIENT WORK', status: 'in_progress', priority: 'high', dueAt: new Date(now + 2 * 86400000).toISOString().slice(0, 10), client: 'Acme Corp', project: 'Brand Refresh' },
    { id: 't2', title: 'TechStart API integration', category: 'CLIENT WORK', status: 'todo', priority: 'urgent', dueAt: new Date(now + 5 * 86400000).toISOString().slice(0, 10), client: 'TechStart', project: 'SaaS Platform' },
    { id: 't3', title: 'Finance Hub report generation', category: 'CLIENT WORK', status: 'todo', priority: 'medium', dueAt: new Date(now + 7 * 86400000).toISOString().slice(0, 10), client: 'Finance Hub', project: 'Dashboard' },
    { id: 't4', title: 'RetailPro checkout fix', category: 'CLIENT WORK', status: 'blocked', priority: 'high', dueAt: new Date(now - 1 * 86400000).toISOString().slice(0, 10), client: 'RetailPro', project: 'E-commerce' },
    // OWN BUILDS
    { id: 't5', title: 'Ship nuvue.studio v2.1', category: 'OWN BUILDS', status: 'done', priority: 'high', assignee: 'SitesBot' },
    { id: 't6', title: 'Forge Command Center P2P view', category: 'OWN BUILDS', status: 'in_progress', priority: 'urgent', assignee: 'iCHRIS' },
    { id: 't7', title: 'Openclaw.io landing redesign', category: 'OWN BUILDS', status: 'todo', priority: 'medium', dueAt: new Date(now + 14 * 86400000).toISOString().slice(0, 10) },
    { id: 't8', title: 'Trading bot risk limits config', category: 'OWN BUILDS', status: 'todo', priority: 'high', dueAt: new Date(now).toISOString().slice(0, 10) },
    // CONTENT
    { id: 't9', title: 'Product shoot - Summer collection', category: 'CONTENT', status: 'in_progress', priority: 'medium', dueAt: new Date(now + 3 * 86400000).toISOString().slice(0, 10), client: 'RetailPro' },
    { id: 't10', title: 'Social reel - Brand story', category: 'CONTENT', status: 'todo', priority: 'low', dueAt: new Date(now + 10 * 86400000).toISOString().slice(0, 10) },
    // DAILY
    { id: 't11', title: 'Morning brief review', category: 'DAILY', status: 'done', priority: 'high' },
    { id: 't12', title: 'P2P spread check', category: 'DAILY', status: 'in_progress', priority: 'medium' },
    { id: 't13', title: 'Site uptime audit', category: 'DAILY', status: 'todo', priority: 'low' },
    { id: 't14', title: 'Invoice follow-ups', category: 'DAILY', status: 'todo', priority: 'high', dueAt: new Date(now).toISOString().slice(0, 10) },
  ];

  const focusStrip: Task[] = tasks.filter((t) => t.status === 'in_progress').slice(0, 5);

  const upcomingDeadlines = tasks
    .filter((t) => t.dueAt && t.status !== 'done')
    .map((t) => ({
      task: t,
      daysRemaining: Math.ceil((new Date(t.dueAt!).getTime() - now) / 86400000),
    }))
    .filter((d) => d.daysRemaining >= 0)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 5);

  return {
    tasks,
    focusStrip,
    upcomingDeadlines,
  };
}

export async function fetchTasksState(): Promise<TasksState> {
  if (!USE_PAPERCLIP_MOCK) {
    // const data = await paperclip.getTaskState<TasksState>();
    // return data;
  }
  return generateMockTasksState();
}
