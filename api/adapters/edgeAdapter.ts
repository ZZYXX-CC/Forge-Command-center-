import type { EdgeRiskContract, EdgeRiskSnapshotDto } from '../contracts/edge';

interface OverviewLike {
  meta: { generatedAt: string };
  globalStatus: EdgeRiskSnapshotDto['botStatus'];
  tradingSummary: {
    todayPnl: number;
    openPositions: number;
    riskStatus: EdgeRiskSnapshotDto['riskStatus'];
    activeStrategies: number;
    lastOrderAt: string;
  };
  taskSummary: { completedToday: number };
  priorityAlerts: Array<{ severity: 'critical' | 'high' | 'medium' | 'low' | 'info' }>;
}

export const mapOverviewToEdgeRisk = (overview: OverviewLike): EdgeRiskSnapshotDto => {
  const highOrCriticalAlerts = overview.priorityAlerts.filter((a) => a.severity === 'critical' || a.severity === 'high').length;

  return {
    botStatus: overview.globalStatus,
    todayPnlUsd: overview.tradingSummary.todayPnl,
    openExposureUsd: overview.tradingSummary.openPositions * 1000,
    drawdownPct: highOrCriticalAlerts > 0 ? 2.3 : 1.1,
    drawdownLimitPct: 5,
    riskStatus: overview.tradingSummary.riskStatus,
    activeStrategies: overview.tradingSummary.activeStrategies,
    ordersExecutedToday: overview.taskSummary.completedToday,
    engineLatencyMs: highOrCriticalAlerts > 0 ? 420 : 180,
    lastSignalAt: overview.tradingSummary.lastOrderAt,
    errorRate1h: highOrCriticalAlerts > 0 ? 0.04 : 0.01,
    generatedAt: overview.meta.generatedAt,
  };
};

export const validateEdgeRequiredFields = (dto: EdgeRiskSnapshotDto, contract: EdgeRiskContract): string[] => {
  const missing = contract.required.filter((key) => !(key in dto));
  return missing;
};
