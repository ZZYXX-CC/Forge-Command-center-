import { z } from 'zod';

export const DeploymentStatusSchema = z.enum(['success', 'failed', 'in-progress', 'queued', 'rolled-back', 'canceled']);

export const DeploymentEntrySchema = z.object({
  id: z.string(),
  service: z.string(),
  version: z.string(),
  environment: z.enum(['production', 'staging', 'preview', 'dev']),
  status: DeploymentStatusSchema,
  deployedBy: z.string(),
  deployedAt: z.string(),
  durationSeconds: z.number(),
  rollbackAvailable: z.boolean(),
  logsUrl: z.string().optional(),
});

export const PipelineSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['idle', 'running', 'failed', 'paused']),
  lastRunStatus: DeploymentStatusSchema,
  lastRunAt: z.string(),
  nextScheduledAt: z.string().optional(),
  progressPct: z.number().optional(),
});

export const DeploymentStateSchema = z.object({
  meta: z.object({
    generatedAt: z.string(),
    freshnessOk: z.boolean(),
  }),
  kpis: z.object({
    activeDeploys: z.number(),
    successRate24H: z.number(),
    avgDeployTimeSeconds: z.number(),
    failedLast24H: z.number(),
  }),
  deployments: z.array(DeploymentEntrySchema),
  pipelines: z.array(PipelineSchema),
  infraStatus: z.array(z.object({
    provider: z.string(),
    region: z.string(),
    status: z.enum(['healthy', 'degraded', 'incident']),
    latencyMs: z.number(),
  })),
});

export type DeploymentStatus = z.infer<typeof DeploymentStatusSchema>;
export type DeploymentEntry = z.infer<typeof DeploymentEntrySchema>;
export type Pipeline = z.infer<typeof PipelineSchema>;
export type DeploymentState = z.infer<typeof DeploymentStateSchema>;
