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
  moneySummary: {
    bybitUsdtBalance: number;
    fiatBalance: number;
    unpaidInvoices: number;
    unpaidInvoicesCount: number;
    thisMonthTradingIncome: number;
    thisMonthServiceIncome: number;
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
}
