import type { TeamState, Agent, AgentLiveStatus, ActivityEntry } from '@/src/types';
// import { paperclip } from '@/src/lib/paperclip';

const USE_PAPERCLIP_MOCK = true;
const USE_CONVEX_MOCK = true;

function generateMockTeamState(): TeamState {
  const now = new Date().toISOString();
  const heartbeat = new Date(Date.now() - 3000).toISOString();

  const agents: Agent[] = [
    // Core agents
    { id: 'sage', name: 'SAGE', role: 'Orchestrator', emoji: '🎯', tier: 'core', status: 'running', model: 'hermes/gpt-5.5', responsibilities: ['Coordination', 'Decision routing'], tools: ['task-scheduler', 'alert-router'], collaboratesWith: ['vael', 'kern'], schedules: 3, lastHeartbeatAt: heartbeat },
    { id: 'vael', name: 'VAEL', role: 'VA/Eval', emoji: '📊', tier: 'core', status: 'running', model: 'claude-3', responsibilities: ['Validation', 'Evaluation'], tools: ['validator', 'eval-runner'], collaboratesWith: ['sage', 'edge'], schedules: 2, lastHeartbeatAt: heartbeat },
    { id: 'kern', name: 'KERN', role: 'Knowledge', emoji: '🧠', tier: 'core', status: 'running', model: 'gpt-4', responsibilities: ['Schema', 'Context'], tools: ['schema-loader', 'context-builder'], collaboratesWith: ['sage', 'vael'], schedules: 2, lastHeartbeatAt: heartbeat },
    { id: 'edge', name: 'EDGE', role: 'Trading', emoji: '📈', tier: 'core', status: 'running', model: 'gpt-4', responsibilities: ['Futures', 'Risk'], tools: ['bybit-api', 'risk-guard'], collaboratesWith: ['vael', 'kern'], schedules: 5, lastHeartbeatAt: heartbeat },
    { id: 'tester', name: 'TESTER', role: 'QA', emoji: '🔬', tier: 'support', status: 'running', model: 'gpt-4', responsibilities: ['Testing', 'Validation'], tools: ['test-runner', 'regression'], collaboratesWith: ['vael', 'sage'], schedules: 2, lastHeartbeatAt: heartbeat },
    // Pipeline agents
    { id: 'pipeline-1', name: 'SitesBot', role: 'Web Ops', emoji: '🌐', tier: 'pipeline', status: 'running', responsibilities: ['Uptime', 'Deploys'], tools: ['ping', 'deploy-api'], collaboratesWith: ['sage'], schedules: 1, lastHeartbeatAt: heartbeat },
    { id: 'pipeline-2', name: 'ContentBot', role: 'Content', emoji: '📸', tier: 'pipeline', status: 'running', responsibilities: ['Content pipeline'], tools: ['calendar', 'notion'], collaboratesWith: ['sage'], schedules: 1, lastHeartbeatAt: heartbeat },
    { id: 'pipeline-3', name: 'MoneyBot', role: 'Finance', emoji: '💰', tier: 'pipeline', status: 'running', responsibilities: ['Invoices', 'Balances'], tools: ['invoicing', 'bybit'], collaboratesWith: ['sage'], schedules: 1, lastHeartbeatAt: heartbeat },
    { id: 'pipeline-4', name: 'ClientBot', role: 'CRM', emoji: '🤝', tier: 'pipeline', status: 'paused', statusNote: 'Maintenance', responsibilities: ['Client sync'], tools: ['crm-api'], collaboratesWith: ['sage'], schedules: 1 },
    { id: 'pipeline-5', name: 'DeployBot', role: 'CI/CD', emoji: '🚀', tier: 'pipeline', status: 'running', responsibilities: ['Deployments'], tools: ['vercel-api', 'cf-pages'], collaboratesWith: ['pipeline-1'], schedules: 2, lastHeartbeatAt: heartbeat },
    { id: 'pipeline-6', name: 'AlertBot', role: 'Alerts', emoji: '🔔', tier: 'pipeline', status: 'running', responsibilities: ['Alerting'], tools: ['telegram', 'webhook'], collaboratesWith: ['sage'], schedules: 1, lastHeartbeatAt: heartbeat },
  ];

  const liveStatus: AgentLiveStatus[] = agents.filter(a => a.lastHeartbeatAt).map(a => ({
    agentId: a.id,
    status: a.status,
    lastHeartbeatAt: a.lastHeartbeatAt!,
    actionsToday: Math.floor(Math.random() * 150) + 10,
  }));

  const activityFeed: ActivityEntry[] = [
    { id: 'act-1', occurredAt: new Date(Date.now() - 120000).toISOString(), type: 'BOT ACTION', description: 'EDGE placed BUY order BTCUSDT', actor: 'edge', domain: 'trading' },
    { id: 'act-2', occurredAt: new Date(Date.now() - 300000).toISOString(), type: 'SITE EVENT', description: 'nuvue.studio deploy succeeded', actor: 'SitesBot', domain: 'sites' },
    { id: 'act-3', occurredAt: new Date(Date.now() - 600000).toISOString(), type: 'ALERT', description: 'Invoice #442 overdue', actor: 'MoneyBot', domain: 'money' },
  ];

  return {
    agents,
    liveStatus,
    kpis: {
      totalAgents: 11,
      coreActive: 4,
      pipelineErrors: 0,
      lastHeartbeat: heartbeat,
    },
    activityFeed,
  };
}

export async function fetchTeamState(): Promise<TeamState> {
  if (!USE_PAPERCLIP_MOCK) {
    // const data = await paperclip.getTeamState<TeamState>();
    // merge with Convex live status when USE_CONVEX_MOCK is false
    // return data;
  }
  return generateMockTeamState();
}
