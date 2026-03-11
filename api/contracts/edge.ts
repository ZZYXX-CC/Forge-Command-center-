export interface EdgeRiskContract {
  contractVersion: string;
  required: string[];
  freshness: {
    snapshotTtlSec: number;
    warningAfterSec: number;
    breachAfterSec: number;
  };
}

export interface EdgeRiskSnapshotDto {
  botStatus: 'healthy' | 'degraded' | 'incident' | 'offline' | 'unknown';
  todayPnlUsd: number;
  openExposureUsd: number;
  drawdownPct: number;
  drawdownLimitPct: number;
  riskStatus: 'within' | 'approaching' | 'breached';
  activeStrategies: number;
  ordersExecutedToday: number;
  engineLatencyMs: number;
  lastSignalAt: string;
  errorRate1h: number;
  generatedAt: string;
}
