import { z } from 'zod';

export const QueueSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['standard', 'fifo', 'priority']),
  status: z.enum(['healthy', 'degraded', 'incident', 'offline']),
  depth: z.number(),
  consumers: z.number(),
  throughputPerMin: z.number(),
  errorRate1H: z.number(),
  dlqCount: z.number(),
  lastProcessedAt: z.string(),
});

export const ConsumerSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['active', 'idle', 'error']),
  uptimeMs: z.number(),
  messagesProcessed: z.number(),
  lastSeenAt: z.string(),
});

export const DLQAlertSchema = z.object({
  id: z.string(),
  queueId: z.string(),
  messageId: z.string(),
  errorCode: z.string(),
  occurredAt: z.string(),
  payload: z.string().optional(),
});

export const MessagingStateSchema = z.object({
  meta: z.object({
    generatedAt: z.string(),
    freshnessOk: z.boolean(),
  }),
  kpis: z.object({
    totalQueueDepth: z.number(),
    avgProcessingRate: z.number(),
    errorCount1H: z.number(),
    dlqTotal: z.number(),
  }),
  queues: z.array(QueueSchema),
  consumers: z.array(ConsumerSchema),
  dlqAlerts: z.array(DLQAlertSchema),
});

export type Queue = z.infer<typeof QueueSchema>;
export type Consumer = z.infer<typeof ConsumerSchema>;
export type DLQAlert = z.infer<typeof DLQAlertSchema>;
export type MessagingState = z.infer<typeof MessagingStateSchema>;
