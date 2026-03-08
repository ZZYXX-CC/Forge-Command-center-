import { z } from 'zod';

export const WebOpsKPIsSchema = z.object({
  sitesUp: z.number(),
  sitesTotal: z.number(),
  uptimePct24H: z.number(),
  uptimeDelta: z.number(),
  activeSessions: z.number(),
  sessionsDelta: z.number(),
  errors5xx1H: z.number(),
  errorsDelta: z.number(),
});

export const WebSiteSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string(),
  environment: z.enum(['production', 'staging', 'preview']),
  status: z.enum(['healthy', 'degraded', 'down', 'maintenance']),
  uptimePct24H: z.number(),
  latencyP95Ms: z.number(),
  lastCheckedAt: z.string(),
  lastDeploy: z.object({
    version: z.string(),
    deployedAt: z.string(),
    deployedBy: z.string(),
  }),
  errors1H: z.number(),
  incidentId: z.string().optional(),
});

export const WebErrorLogEntrySchema = z.object({
  occurredAt: z.string(),
  statusCode: z.number(),
  route: z.string(),
  siteId: z.string(),
  count: z.number(),
});

export const CDNNodeSchema = z.object({
  nodeId: z.string(),
  region: z.string(),
  regionEmoji: z.string(),
  status: z.enum(['healthy', 'degraded', 'down']),
  cacheHitPct: z.number(),
  bandwidthGb: z.number(),
  lastPurgedAt: z.string(),
  incidentId: z.string().optional(),
});

export const CertificateSchema = z.object({
  domain: z.string(),
  expiresAt: z.string(),
  daysRemaining: z.number(),
  autoRenew: z.boolean(),
  issuer: z.string(),
  status: z.enum(['healthy', 'expiring', 'critical', 'expired']),
});

export const DeployQueueItemSchema = z.object({
  id: z.string(),
  service: z.string(),
  version: z.string(),
  status: z.enum(['queued', 'in-progress', 'success', 'failed', 'rolled-back']),
  triggeredBy: z.string(),
  triggeredAt: z.string(),
  progressPct: z.number().optional(),
  etaSeconds: z.number().optional(),
});

export const WebAlertSchema = z.object({
  id: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  title: z.string(),
  siteId: z.string().optional(),
  ageMs: z.number(),
  acknowledged: z.boolean(),
});

export const QuickActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  domain: z.string(),
  destructive: z.boolean(),
});

export const WebOpsStateSchema = z.object({
  meta: z.object({
    generatedAt: z.string(),
    environment: z.enum(['all', 'production', 'staging', 'preview']),
    freshnessOk: z.boolean(),
  }),
  kpis: WebOpsKPIsSchema,
  sites: z.array(WebSiteSchema),
  errorLog: z.array(WebErrorLogEntrySchema),
  cdn: z.array(CDNNodeSchema),
  certificates: z.array(CertificateSchema),
  deployQueue: z.array(DeployQueueItemSchema),
  alerts: z.array(WebAlertSchema),
  quickActions: z.array(QuickActionSchema),
});

export type WebOpsKPIs = z.infer<typeof WebOpsKPIsSchema>;
export type WebSite = z.infer<typeof WebSiteSchema>;
export type WebErrorLogEntry = z.infer<typeof WebErrorLogEntrySchema>;
export type CDNNode = z.infer<typeof CDNNodeSchema>;
export type Certificate = z.infer<typeof CertificateSchema>;
export type DeployQueueItem = z.infer<typeof DeployQueueItemSchema>;
export type WebAlert = z.infer<typeof WebAlertSchema>;
export type QuickAction = z.infer<typeof QuickActionSchema>;
export type WebOpsState = z.infer<typeof WebOpsStateSchema>;
