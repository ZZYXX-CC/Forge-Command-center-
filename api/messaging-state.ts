export default function handler(_req: any, res: any) {
  const now = new Date().toISOString();
  res.status(200).json({
    meta: { generatedAt: now, freshnessOk: true },
    kpis: { totalQueueDepth: 214, avgProcessingRate: 930, errorCount1H: 3, dlqTotal: 2 },
    queues: [
      { id: 'q-1', name: 'telegram-events', type: 'priority', status: 'healthy', depth: 48, consumers: 4, throughputPerMin: 530, errorRate1H: 0.2, dlqCount: 0, lastProcessedAt: new Date(Date.now() - 12000).toISOString() },
      { id: 'q-2', name: 'trade-signals', type: 'fifo', status: 'degraded', depth: 166, consumers: 2, throughputPerMin: 400, errorRate1H: 1.1, dlqCount: 2, lastProcessedAt: new Date(Date.now() - 48000).toISOString() }
    ],
    consumers: [
      { id: 'c-1', name: 'signal-worker-a', status: 'active', uptimeMs: 3600000, messagesProcessed: 10234, lastSeenAt: new Date(Date.now() - 10000).toISOString() },
      { id: 'c-2', name: 'notify-worker', status: 'idle', uptimeMs: 1200000, messagesProcessed: 812, lastSeenAt: new Date(Date.now() - 60000).toISOString() }
    ],
    dlqAlerts: [
      { id: 'd-1', queueId: 'q-2', messageId: 'm-1882', errorCode: 'TIMEOUT', occurredAt: new Date(Date.now() - 20 * 60000).toISOString() },
      { id: 'd-2', queueId: 'q-2', messageId: 'm-1889', errorCode: 'INVALID_PAYLOAD', occurredAt: new Date(Date.now() - 8 * 60000).toISOString() }
    ]
  });
}
