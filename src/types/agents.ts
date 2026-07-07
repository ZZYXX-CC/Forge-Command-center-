export type AgentStatus = 'healthy' | 'degraded' | 'incident' | 'paused' | 'neutral';
export type AgentTier = 'core' | 'support' | 'pipeline';

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  tier: AgentTier;
  status: AgentStatus;
  model: string;
  tools: string[];
  owns: string[];
  collaboratesWith: string[];
  lastHeartbeat: string;
  actionsToday: number;
  schedules?: { task: string; time: string }[];
  policy?: string;
  description?: string;
}

export interface Relationship {
  from: string;
  to: string;
  type: 'collaborates' | 'routes-via' | 'blocked' | 'reports-to';
  interactions?: number;
  label?: string;
}

export const AGENTS: Agent[] = [
  {
    id: 'sage',
    name: 'SAGE',
    emoji: '👑',
    role: 'Core Brain / Strategic Orchestrator',
    tier: 'core',
    status: 'paused',
    model: 'hermes / gpt-5.5',
    tools: [
      'acp-router', 'antfarm-workflows', 'github', 'gh-issues', 
      'filesystem', 'find-skills', 'clawhub', 'clawdhub', 
      'openclaw-agent-optimize', 'token-optimizer', 
      'local-approvals', 'gotify', 'prompt-engineering-expert', 
      'self-improvement'
    ],
    owns: ['routing', 'escalation', 'approvals', 'final decisions'],
    collaboratesWith: ['vael', 'kern', 'edge', 'tester'],
    schedules: [
      { task: 'Morning Ops Digest', time: '08:00 WAT' },
      { task: 'Evening Ops Digest', time: '19:00 WAT' },
      { task: 'OpsBrief', time: 'every 30 minutes' }
    ],
    lastHeartbeat: '14 min ago',
    actionsToday: 6
  },
  {
    id: 'vael',
    name: 'VAEL',
    emoji: '◈',
    role: 'Design / UI Adaptation',
    tier: 'core',
    status: 'paused',
    model: 'gpt-5.2-codex',
    tools: ['ui-ux-pro-max', 'frontend-design', 'humanizer', 'Agent Browser', 'summarize', 'github'],
    owns: ['DS-compliant UI', 'UX acceptance criteria', 'visual consistency'],
    collaboratesWith: ['sage', 'kern', 'tester'],
    lastHeartbeat: '12 min ago',
    actionsToday: 2
  },
  {
    id: 'kern',
    name: 'KERN',
    emoji: '⬡',
    role: 'Backend + Frontend Implementation',
    tier: 'core',
    status: 'paused',
    model: 'gpt-5.3-codex',
    tools: ['github', 'gh-issues', 'filesystem', 'antfarm-workflows', 'acp-router', 'mcporter', 'openclaw-agent-optimize', 'token-optimizer'],
    owns: ['DTOs', 'adapters', 'API wiring', 'frontend integration'],
    collaboratesWith: ['sage', 'vael', 'edge', 'tester'],
    lastHeartbeat: '9 min ago',
    actionsToday: 4
  },
  {
    id: 'edge',
    name: 'EDGE',
    emoji: '↗',
    role: 'Trading / Risk Contracts',
    tier: 'core',
    status: 'paused',
    model: 'gpt-5.3-codex',
    tools: ['bybit-futures', 'trading-ops-pack', 'stock-analysis', 'github', 'summarize'],
    owns: ['risk contracts', 'thresholds', 'fallback safeguards'],
    collaboratesWith: ['sage', 'kern'],
    policy: 'Trading and futures strategy routes through SAGE with KERN review for system changes.',
    lastHeartbeat: '14 min ago',
    actionsToday: 1
  },
  {
    id: 'tester',
    name: 'TESTER',
    emoji: '🧪',
    role: 'QA Gate',
    tier: 'support',
    status: 'paused',
    model: 'gpt-5.3-codex',
    tools: ['github', 'gh-issues', 'Agent Browser', 'summarize', 'filesystem'],
    owns: ['test packs', 'smoke checklist', 'pass/fail gate'],
    collaboratesWith: ['sage', 'vael', 'kern'],
    lastHeartbeat: '20 min ago',
    actionsToday: 0
  },
  // Pipeline Agents
  { id: 'p1', name: 'feature-dev planner', emoji: '📋', role: 'Planning breakdown + dependency map', tier: 'pipeline', status: 'paused', model: 'gpt-4o', tools: [], owns: [], collaboratesWith: ['sage'], lastHeartbeat: '67 min ago', actionsToday: 0 },
  { id: 'p2', name: 'feature-dev setup', emoji: '🏗️', role: 'Repo/bootstrap standardization', tier: 'pipeline', status: 'paused', model: 'gpt-4o', tools: [], owns: [], collaboratesWith: ['sage'], lastHeartbeat: '69 min ago', actionsToday: 0 },
  { id: 'p3', name: 'feature-dev developer', emoji: '💻', role: 'Implementation assistance', tier: 'pipeline', status: 'paused', model: 'gpt-4o', tools: [], owns: [], collaboratesWith: ['sage'], lastHeartbeat: '71 min ago', actionsToday: 0 },
  { id: 'p4', name: 'feature-dev reviewer', emoji: '🔍', role: 'Quality / review comments', tier: 'pipeline', status: 'paused', model: 'gpt-4o', tools: [], owns: [], collaboratesWith: ['sage'], lastHeartbeat: '72 min ago', actionsToday: 0 },
  { id: 'p5', name: 'feature-dev tester', emoji: '🧪', role: 'Test execution support', tier: 'pipeline', status: 'paused', model: 'gpt-4o', tools: [], owns: [], collaboratesWith: ['sage'], lastHeartbeat: '73 min ago', actionsToday: 0 },
  { id: 'p6', name: 'feature-dev verifier', emoji: '✅', role: 'Acceptance + gate verification', tier: 'pipeline', status: 'paused', model: 'gpt-4o', tools: [], owns: [], collaboratesWith: ['sage'], lastHeartbeat: '74 min ago', actionsToday: 0 },
];

export const RELATIONSHIPS: Relationship[] = [
  { from: 'sage', to: 'vael', type: 'collaborates', interactions: 42 },
  { from: 'sage', to: 'kern', type: 'collaborates', interactions: 61 },
  { from: 'sage', to: 'edge', type: 'collaborates', interactions: 28 },
  { from: 'sage', to: 'tester', type: 'collaborates', interactions: 19 },
  { from: 'vael', to: 'kern', type: 'collaborates', interactions: 38 },
  { from: 'vael', to: 'tester', type: 'collaborates', interactions: 12 },
  { from: 'kern', to: 'tester', type: 'collaborates', interactions: 24 },
  { from: 'edge', to: 'sage', type: 'routes-via' },
  // Pipeline reports to SAGE
  { from: 'p1', to: 'sage', type: 'reports-to' },
  { from: 'p2', to: 'sage', type: 'reports-to' },
  { from: 'p3', to: 'sage', type: 'reports-to' },
  { from: 'p4', to: 'sage', type: 'reports-to' },
  { from: 'p5', to: 'sage', type: 'reports-to' },
  { from: 'p6', to: 'sage', type: 'reports-to' },
];
