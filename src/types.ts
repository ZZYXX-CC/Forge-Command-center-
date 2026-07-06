import { z } from "zod";

export const SystemStatusSchema = z.enum(['healthy', 'degraded', 'incident', 'offline', 'unknown']);
export type SystemStatus = z.infer<typeof SystemStatusSchema>;

export const SeveritySchema = z.enum(['critical', 'high', 'medium', 'low', 'info']);
export type Severity = z.infer<typeof SeveritySchema>;

export const OperationalModeSchema = z.enum(['live', 'paper', 'demo', 'halted']);
export type OperationalMode = z.infer<typeof OperationalModeSchema>;

export const ActionPrioritySchema = z.enum(['urgent', 'high', 'medium', 'low', 'info']);
export type ActionPriority = z.infer<typeof ActionPrioritySchema>;

export interface OverviewState {
  meta: {
    generatedAt: string;
    freshnessOk: boolean;
    staleDomains: string[];
  };
  globalStatus: SystemStatus;
  incidentCount: number;
  incidents: Array<{
    id: string;
    severity: Severity;
    title: string;
    affectedSystem: string;
    durationMs: number;
    startedAt: string;
  }>;
  domains: Array<{
    id: string;
    name: string;
    status: SystemStatus;
    mode?: OperationalMode;
    lastCheckedAt: string;
    degradedSinceMs?: number;
  }>;
  tradingSummary: {
    mode: OperationalMode;
    activeStrategies: number;
    openPositions: number;
    todayPnl: number;
    sessionPnl: number;
    p2pActiveOrders: number;
    riskStatus: 'within' | 'approaching' | 'breached';
    lastOrderAt: string;
  };
  sitesSummary: {
    totalSites: number;
    healthySites: number;
    uptimePct24H: number;
    lastDeployAt: string;
    sites: Array<{
      id: string;
      name: string;
      status: SystemStatus;
      uptimePct24H: number;
    }>;
  };
  financeSummary: {
    status: SystemStatus;
    bybitUsdtBalance: number;
    fiatBalance: number;
    unpaidInvoices: number;
    unpaidInvoicesCount: number;
    thisMonthTradingIncome: number;
    thisMonthServiceIncome: number;
    pendingItems: number;
    flaggedItems: number;
    lastReconciliationAt: string;
  };
  clientSummary: {
    activeProjects: number;
    overdueDeliverables: number;
    nextDeadline: {
      client: string;
      daysRemaining: number;
    };
  };
  taskSummary: {
    openTasks: number;
    overdueCount: number;
    completedToday: number;
    dueToday: number;
    topTasks: Array<{
      id: string;
      title: string;
      completed: boolean;
    }>;
  };
  botSummary: {
    totalBots: number;
    activeBots: number;
    errorBots: number;
  };
  contentSummary: {
    pipelineCount: number;
    inProduction: number;
    storageUsedPct: number;
    totalAssets: number;
  };
  recentChanges: Array<{
    id: string;
    occurredAt: string;
    type: 'BOT ACTION' | 'SITE EVENT' | 'DEPLOY' | 'ORDER FILLED' | 'ALERT' | 'TASK DUE';
    description: string;
    actor: string;
    domain: string;
  }>;
  priorityAlerts: Array<{
    id: string;
    severity: Severity;
    title: string;
    system: string;
    ageMs: number;
    acknowledged: boolean;
  }>;
  recommendedActions: Array<{
    id: string;
    priority: ActionPriority;
    description: string;
    domain: string;
    ageMs: number;
  }>;
}

// --- Overview sub-types (derived from OverviewState) ---
export type Incident = OverviewState['incidents'][number];
export type DomainStatus = OverviewState['domains'][number];
export type TradingSummary = OverviewState['tradingSummary'];
export type SitesSummary = OverviewState['sitesSummary'];
export type FinanceSummary = OverviewState['financeSummary'];
/** Legacy alias for finance summary fields used by domain adapters */
export type MoneySummary = Pick<
  FinanceSummary,
  | 'bybitUsdtBalance'
  | 'fiatBalance'
  | 'unpaidInvoices'
  | 'unpaidInvoicesCount'
  | 'thisMonthTradingIncome'
  | 'thisMonthServiceIncome'
> &
  Partial<
    Pick<FinanceSummary, 'status' | 'pendingItems' | 'flaggedItems' | 'lastReconciliationAt'>
  >;
export type ClientSummary = OverviewState['clientSummary'];
export type TaskSummary = OverviewState['taskSummary'];
export type TopTask = OverviewState['taskSummary']['topTasks'][number];
export type BotSummary = OverviewState['botSummary'];
export type ContentSummary = OverviewState['contentSummary'];
export type ActivityEntry = OverviewState['recentChanges'][number];
export type Alert = OverviewState['priorityAlerts'][number];
export type RecommendedAction = OverviewState['recommendedActions'][number];

// --- Trading (Command Center domain adapters) ---
export type {
  TradingHealth,
  PnLSummary as TradingPnL,
  Position as TradingPosition,
  Order as TradingOrder,
  RiskConfig as TradingRisk,
  Decision as TradingDecision,
  P2PMarketSnapshot as P2PSpreadSnapshot,
} from './types/trading';

import type { TradingState as BaseTradingState } from './types/trading';

export interface TradingStrategy {
  id: string;
  name: string;
  state: 'running' | 'paused' | 'error' | 'idle';
  heartbeatAge: string;
  lastSignal: string;
  consecutiveLosses: number;
  pnl?: number;
  winRate?: number;
}

export type TradingState = Omit<BaseTradingState, 'strategies'> & {
  strategies: TradingStrategy[];
};

// --- P2P (Command Center domain adapters) ---
export interface P2PHeatmapCell {
  hour: number;
  day: string;
  opportunityScore: number;
}

export interface P2PAd {
  id: string;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  completionRate: number;
  status: 'active' | 'paused';
}

export interface P2POrder {
  id: string;
  side: 'BUY' | 'SELL';
  amount: number;
  price: number;
  status: 'pending_payment' | 'paid' | 'completed' | 'cancelled';
  counterparty: string;
  timestamp: string;
}

export interface P2PState {
  pair: string;
  lastSync: string;
  streamHealth: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  kpis: {
    spread: number;
    spreadChange: number;
    topOfBook: number;
    volatility: number;
    liquidityProxy: number;
  };
  snapshots: import('./types/trading').P2PMarketSnapshot[];
  heatmap: P2PHeatmapCell[];
  myAds: P2PAd[];
  pendingOrders: P2POrder[];
  recentTrades: P2POrder[];
}

// --- Money ---
export interface BalanceEntry {
  id: string;
  label: string;
  amount: number;
  currency: string;
  source: string;
}

export interface Invoice {
  id: string;
  client: string;
  amount: number;
  currency: string;
  status: 'draft' | 'issued' | 'paid' | 'overdue';
  issuedAt: string;
  dueAt: string;
}

export interface TransactionEntry {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  currency: string;
  description: string;
  timestamp: string;
}

export interface MoneyState {
  month: string;
  currency: string;
  revenue: {
    total: number;
    trading: number;
    service: number;
    deltaVsLastMonth: number;
  };
  balances: BalanceEntry[];
  invoices: Invoice[];
  transactions: TransactionEntry[];
}

// --- Sites ---
export interface Site {
  id: string;
  name: string;
  url: string;
  type: 'own' | 'client';
  status: 'up' | 'degraded' | 'down';
  uptimePct: number;
  latencyMs: number;
  errors24h: number;
  sslExpiry?: string;
  lastDeployAt: string;
  client?: string;
}

export interface DeployEntry {
  id: string;
  site: string;
  version: string;
  status: 'success' | 'failed' | 'in-progress';
  timestamp: string;
  actor: string;
}

export interface SitesState {
  sites: Site[];
  kpis: {
    allUp: number;
    total: number;
    avgUptime: number;
    pendingDeploys: number;
    sslWarnings: number;
  };
  deployHistory: DeployEntry[];
}

// --- Tasks ---
export interface Task {
  id: string;
  title: string;
  category: 'CLIENT WORK' | 'OWN BUILDS' | 'CONTENT' | 'DAILY';
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  dueAt?: string;
  client?: string;
  project?: string;
  assignee?: string;
}

export interface TasksState {
  tasks: Task[];
  focusStrip: Task[];
  upcomingDeadlines: Array<{
    task: Task;
    daysRemaining: number;
  }>;
}

export type DispatchJobStatus = 'queued' | 'running' | 'done' | 'failed' | 'cancelled';

export type WorkflowStage = 'queued' | 'dispatched' | 'running' | 'verifying' | 'done' | 'failed' | 'cancelled';
export type WorkflowStatus = WorkflowStage;

export interface WorkflowVerification {
  lint: boolean;
  build: boolean;
  exitCode: number;
}

export interface WorkflowStep {
  stage: WorkflowStage;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'failed' | 'cancelled';
  timestamp?: number;
  detail?: string;
}

export interface Workflow {
  id: string;
  workItemId: string;
  trigger: string;
  status: WorkflowStatus;
  stages: WorkflowStep[];
  startTime: number;
  endTime?: number;
  executor?: string;
  surface?: string;
  output?: string;
  dispatchJobId?: string;
  exitCode?: number | null;
  verification?: WorkflowVerification;
}

export interface DispatchJob {
  id: string;
  status: DispatchJobStatus;
  repo?: string;
  command?: string;
  prompt?: string;
}

export interface DispatchPollResult {
  status: DispatchJobStatus;
  output?: string;
  error?: string;
  exitCode?: number | null;
  surface?: string | null;
  model?: string | null;
  latencyMs?: number | null;
  verification?: WorkflowVerification | null;
}

// --- Clients ---
export interface ClientProject {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'archived';
  nextDeadline?: string;
}

export interface Client {
  id: string;
  name: string;
  status: 'active' | 'overdue' | 'archived';
  projects: ClientProject[];
  outstandingAmount: number;
  currency: string;
  lastContactAt: string;
  notes: string[];
}

export interface ClientsState {
  clients: Client[];
}

// --- Content ---
export interface ContentItem {
  id: string;
  title: string;
  type: 'PHOTO' | 'REEL' | 'VIDEO';
  stage: 'SCHEDULED' | 'SHOT' | 'EDITING' | 'REVIEW' | 'DELIVERED';
  client?: string;
  isPersonal: boolean;
  dueAt?: string;
  shootDate?: string;
}

export interface ContentState {
  pipeline: ContentItem[];
  upcomingShoots: ContentItem[];
  pendingEdits: ContentItem[];
}

// --- Team / bots ---
export type TeamAgentStatus = 'running' | 'paused' | 'error' | 'idle';

export interface Agent {
  id: string;
  name: string;
  role: string;
  emoji: string;
  tier: 'core' | 'support' | 'pipeline';
  status: TeamAgentStatus;
  model?: string;
  responsibilities?: string[];
  tools?: string[];
  collaboratesWith?: string[];
  schedules?: number;
  lastHeartbeatAt?: string;
  statusNote?: string;
}

export interface AgentLiveStatus {
  agentId: string;
  status: TeamAgentStatus;
  lastHeartbeatAt: string;
  actionsToday: number;
}

export interface TeamState {
  agents: Agent[];
  liveStatus: AgentLiveStatus[];
  kpis: {
    totalAgents: number;
    coreActive: number;
    pipelineErrors: number;
    lastHeartbeat: string;
  };
  activityFeed: ActivityEntry[];
}
