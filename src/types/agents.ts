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
    id: 'miguel',
    name: 'MIGUEL',
    emoji: '👑',
    role: 'Coordinator / Orchestrator',
    tier: 'core',
    status: 'paused',
    model: 'gpt-5.3-codex',
    tools: [
      'acp-router', 'antfarm-workflows', 'github', 'gh-issues', 
      'filesystem', 'find-skills', 'clawhub', 'clawdhub', 
      'openclaw-agent-optimize', 'token-optimizer', 
      'local-approvals', 'gotify', 'prompt-engineering-expert', 
      'self-improvement'
    ],
    owns: ['routing', 'escalation', 'approvals', 'final decisions'],
    collaboratesWith: ['vael', 'kern', 'edge', 'bridge', 'tester'],
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
    collaboratesWith: ['miguel', 'kern', 'tester'],
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
    collaboratesWith: ['miguel', 'vael', 'edge', 'bridge', 'tester'],
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
    collaboratesWith: ['miguel', 'kern'],
    policy: 'Need-to-know sync with BRIDGE via MIGUEL only',
    lastHeartbeat: '14 min ago',
    actionsToday: 1
  },
  {
    id: 'bridge',
    name: 'BRIDGE',
    emoji: '⚡',
    role: 'P2P Ops / Schema',
    tier: 'core',
    status: 'paused',
    model: 'gpt-5.3-codex',
    tools: ['bybit-futures', 'trading-ops-pack', 'stock-analysis', 'github', 'summarize'],
    owns: ['P2P schema', 'spread logic', 'payload/fallback definitions'],
    collaboratesWith: ['miguel', 'kern'],
    policy: 'Need-to-know sync with EDGE via MIGUEL only',
    lastHeartbeat: '11 min ago',
    actionsToday: 3
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
    collaboratesWith: ['miguel', 'vael', 'kern'],
    lastHeartbeat: '20 min ago',
    actionsToday: 0
  },
  // Pipeline Agents
  { id: 'p1', name: 'feature-dev planner', emoji: '📋', role: 'Planning breakdown + dependency map', tier: 'pipeline', status: 'paused', model: 'gpt-4o', tools: [], owns: [], collaboratesWith: ['miguel'], lastHeartbeat: '67 min ago', actionsToday: 0 },
  { id: 'p2', name: 'feature-dev setup', emoji: '🏗️', role: 'Repo/bootstrap standardization', tier: 'pipeline', status: 'paused', model: 'gpt-4o', tools: [], owns: [], collaboratesWith: ['miguel'], lastHeartbeat: '69 min ago', actionsToday: 0 },
  { id: 'p3', name: 'feature-dev developer', emoji: '💻', role: 'Implementation assistance', tier: 'pipeline', status: 'paused', model: 'gpt-4o', tools: [], owns: [], collaboratesWith: ['miguel'], lastHeartbeat: '71 min ago', actionsToday: 0 },
  { id: 'p4', name: 'feature-dev reviewer', emoji: '🔍', role: 'Quality / review comments', tier: 'pipeline', status: 'paused', model: 'gpt-4o', tools: [], owns: [], collaboratesWith: ['miguel'], lastHeartbeat: '72 min ago', actionsToday: 0 },
  { id: 'p5', name: 'feature-dev tester', emoji: '🧪', role: 'Test execution support', tier: 'pipeline', status: 'paused', model: 'gpt-4o', tools: [], owns: [], collaboratesWith: ['miguel'], lastHeartbeat: '73 min ago', actionsToday: 0 },
  { id: 'p6', name: 'feature-dev verifier', emoji: '✅', role: 'Acceptance + gate verification', tier: 'pipeline', status: 'paused', model: 'gpt-4o', tools: [], owns: [], collaboratesWith: ['miguel'], lastHeartbeat: '74 min ago', actionsToday: 0 },
];

export const RELATIONSHIPS: Relationship[] = [
  { from: 'miguel', to: 'vael', type: 'collaborates', interactions: 42 },
  { from: 'miguel', to: 'kern', type: 'collaborates', interactions: 61 },
  { from: 'miguel', to: 'edge', type: 'collaborates', interactions: 28 },
  { from: 'miguel', to: 'bridge', type: 'collaborates', interactions: 31 },
  { from: 'miguel', to: 'tester', type: 'collaborates', interactions: 19 },
  { from: 'vael', to: 'kern', type: 'collaborates', interactions: 38 },
  { from: 'vael', to: 'tester', type: 'collaborates', interactions: 12 },
  { from: 'kern', to: 'tester', type: 'collaborates', interactions: 24 },
  { from: 'edge', to: 'miguel', type: 'routes-via' },
  { from: 'bridge', to: 'miguel', type: 'routes-via' },
  { from: 'edge', to: 'bridge', type: 'blocked', label: 'BLOCKED — route via MIGUEL only' },
  // Pipeline reports to Miguel
  { from: 'p1', to: 'miguel', type: 'reports-to' },
  { from: 'p2', to: 'miguel', type: 'reports-to' },
  { from: 'p3', to: 'miguel', type: 'reports-to' },
  { from: 'p4', to: 'miguel', type: 'reports-to' },
  { from: 'p5', to: 'miguel', type: 'reports-to' },
  { from: 'p6', to: 'miguel', type: 'reports-to' },
];
