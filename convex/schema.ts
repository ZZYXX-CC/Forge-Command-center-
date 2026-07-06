import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  agentStatus: defineTable({
    agentId: v.string(),
    status: v.string(),
    lastHeartbeatAt: v.number(),
    actionsToday: v.number(),
    statusNote: v.optional(v.string()),
  }).index("by_agentId", ["agentId"]),

  tradingPositions: defineTable({
    symbol: v.string(),
    side: v.string(),
    size: v.number(),
    entry: v.number(),
    mark: v.number(),
    liq: v.number(),
    uPnL: v.number(),
    roe: v.number(),
    age: v.string(),
    strategy: v.string(),
    riskFlag: v.string(),
    updatedAt: v.number(),
  }).index("by_symbol", ["symbol"]),

  tradingOrders: defineTable({
    symbol: v.string(),
    side: v.string(),
    type: v.string(),
    status: v.string(),
    price: v.optional(v.number()),
    amount: v.number(),
    filledAmount: v.number(),
    timestamp: v.number(),
    rejectReason: v.optional(v.string()),
    retCode: v.optional(v.number()),
  })
    .index("by_symbol", ["symbol"])
    .index("by_status", ["status"])
    .index("by_timestamp", ["timestamp"]),

  tradingPnl: defineTable({
    session: v.number(),
    day: v.number(),
    week: v.number(),
    realized: v.number(),
    unrealized: v.number(),
    marginUsage: v.number(),
    totalOpenRisk: v.number(),
    maxDrawdown: v.number(),
    drawdownLimit: v.number(),
    updatedAt: v.number(),
  }),

  p2pSpread: defineTable({
    pair: v.string(),
    bestBuyPrice: v.number(),
    bestSellPrice: v.number(),
    spreadAbs: v.number(),
    spreadPct: v.number(),
    buyDepthTop5: v.number(),
    sellDepthTop5: v.number(),
    depthImbalance: v.number(),
    volatility1h: v.number(),
    updatedAt: v.number(),
  }).index("by_pair", ["pair"]),

  p2pOrders: defineTable({
    side: v.string(),
    price: v.number(),
    quantity: v.number(),
    status: v.string(),
    counterparty: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_timestamp", ["timestamp"]),

  siteStatus: defineTable({
    siteId: v.string(),
    name: v.string(),
    url: v.string(),
    status: v.string(),
    latencyMs: v.number(),
    lastPingAt: v.number(),
  }).index("by_siteId", ["siteId"]),

  alerts: defineTable({
    severity: v.string(),
    title: v.string(),
    system: v.string(),
    acknowledged: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_severity", ["severity"])
    .index("by_acknowledged", ["acknowledged"])
    .index("by_createdAt", ["createdAt"]),

  activity: defineTable({
    occurredAt: v.number(),
    type: v.string(),
    description: v.string(),
    actor: v.string(),
    domain: v.string(),
  }).index("by_occurredAt", ["occurredAt"]),

  bybitBalances: defineTable({
    label: v.string(),
    amount: v.number(),
    currency: v.string(),
    source: v.string(),
    updatedAt: v.number(),
  }).index("by_label", ["label"]),

  workItems: defineTable({
    workId: v.string(),
    title: v.string(),
    summary: v.optional(v.string()),
    status: v.union(
      v.literal("backlog"),
      v.literal("ready"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("blocked"),
      v.literal("review"),
      v.literal("done"),
      v.literal("cancelled"),
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    orchestrator: v.string(),
    owner: v.optional(v.string()),
    executor: v.optional(v.string()),
    surface: v.optional(v.string()),
    model: v.optional(v.string()),
    branch: v.optional(v.string()),
    pullRequestUrl: v.optional(v.string()),
    issueUrl: v.optional(v.string()),
    blocker: v.optional(v.string()),
    verificationStatus: v.union(
      v.literal("not_started"),
      v.literal("running"),
      v.literal("passed"),
      v.literal("failed"),
      v.literal("waived"),
    ),
    verificationSummary: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    dueAt: v.optional(v.number()),
  })
    .index("by_workId", ["workId"])
    .index("by_status", ["status"])
    .index("by_owner_status", ["owner", "status"])
    .index("by_updatedAt", ["updatedAt"]),

  workEvents: defineTable({
    workId: v.string(),
    type: v.string(),
    actor: v.string(),
    message: v.string(),
    metadata: v.optional(v.string()),
    occurredAt: v.number(),
  })
    .index("by_workId_occurredAt", ["workId", "occurredAt"])
    .index("by_occurredAt", ["occurredAt"]),

  routingDecisions: defineTable({
    workId: v.optional(v.string()),
    task: v.string(),
    category: v.string(),
    complexity: v.string(),
    chosenSurface: v.optional(v.string()),
    chosenModel: v.optional(v.string()),
    via: v.optional(v.string()),
    status: v.string(),
    latencyMs: v.optional(v.number()),
    consideredJson: v.optional(v.string()),
    decidedAt: v.number(),
  })
    .index("by_workId_decidedAt", ["workId", "decidedAt"])
    .index("by_decidedAt", ["decidedAt"])
    .index("by_chosenSurface", ["chosenSurface"]),

  executorRuns: defineTable({
    workId: v.optional(v.string()),
    runId: v.string(),
    executor: v.string(),
    surface: v.string(),
    model: v.optional(v.string()),
    status: v.string(),
    promptPreview: v.optional(v.string()),
    outputPreview: v.optional(v.string()),
    error: v.optional(v.string()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    latencyMs: v.optional(v.number()),
    cwd: v.optional(v.string()),
    commitSha: v.optional(v.string()),
    pullRequestUrl: v.optional(v.string()),
  })
    .index("by_runId", ["runId"])
    .index("by_workId_startedAt", ["workId", "startedAt"])
    .index("by_surface_startedAt", ["surface", "startedAt"]),

  workflows: defineTable({
    workflowId: v.string(),
    workItemId: v.string(),
    trigger: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("dispatched"),
      v.literal("running"),
      v.literal("verifying"),
      v.literal("done"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
    stages: v.array(v.object({
      stage: v.union(
        v.literal("queued"),
        v.literal("dispatched"),
        v.literal("running"),
        v.literal("verifying"),
        v.literal("done"),
        v.literal("failed"),
        v.literal("cancelled"),
      ),
      label: v.string(),
      status: v.union(v.literal("pending"), v.literal("active"), v.literal("complete"), v.literal("failed"), v.literal("cancelled")),
      timestamp: v.optional(v.number()),
      detail: v.optional(v.string()),
    })),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    executor: v.optional(v.string()),
    surface: v.optional(v.string()),
    output: v.optional(v.string()),
    dispatchJobId: v.optional(v.string()),
    exitCode: v.optional(v.number()),
    verification: v.optional(v.object({
      lint: v.boolean(),
      build: v.boolean(),
      exitCode: v.number(),
    })),
    updatedAt: v.number(),
  })
    .index("by_workItemId_updatedAt", ["workItemId", "updatedAt"])
    .index("by_workflowId", ["workflowId"]),
});
