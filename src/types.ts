import { z } from "zod";

export const SystemStatusSchema = z.enum(['healthy', 'degraded', 'incident', 'offline', 'unknown']);
export type SystemStatus = z.infer<typeof SystemStatusSchema>;

export const SeveritySchema = z.enum(['critical', 'high', 'medium', 'low', 'info']);
export type Severity = z.infer<typeof SeveritySchema>;

export const OperationalModeSchema = z.enum(['live', 'paper', 'demo', 'halted']);
export type OperationalMode = z.infer<typeof OperationalModeSchema>;

export const ActionPrioritySchema = z.enum(['urgent', 'high', 'medium', 'low', 'info']);
export type ActionPriority = z.infer<typeof ActionPrioritySchema>;

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: ActionPriority;
  domain: string;
  createdAt: string;
  dueAt?: string;
  linkedAlertId?: string;
  linkedActionId?: string;
}

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
    aggregatePnl: number;
    pnlCurrency: string;
    lastOrderAt: string;
    errorRate1H: number;
    riskStatus: 'within' | 'approaching' | 'breached';
  };
  webOpsSummary: {
    totalSites: number;
    healthySites: number;
    uptimePct24H: number;
    activeSessions?: number;
    lastDeployAt: string;
    lastDeployedBy: string;
    errors5xx1H: number;
  };
  deploymentSummary: {
    recentDeployments: Array<{
      service: string;
      version: string;
      deployedBy: string;
      deployedAt: string;
      status: 'success' | 'failed' | 'in-progress' | 'rolled-back';
      rollbackAvailable: boolean;
    }>;
    inProgressCount: number;
    failedLast24H: number;
  };
  messagingSummary: {
    queueDepth: number;
    processingRatePerMin: number;
    errorCount1H: number;
    lastProcessedAt: string;
    dlqCount: number;
  };
  financeSummary: {
    status: SystemStatus;
    lastReconciliationAt: string;
    pendingItems: number;
    flaggedItems: number;
  };
  taskSummary: {
    openTasks: number;
    overdueCount: number;
    completedToday: number;
  };
  tasks: Task[];
  recentChanges: Array<{
    id: string;
    occurredAt: string;
    type: 'deployment' | 'config' | 'incident_open' | 'incident_close' | 'strategy_start' | 'strategy_stop' | 'alert';
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
    dueAt?: string;
  }>;
}
