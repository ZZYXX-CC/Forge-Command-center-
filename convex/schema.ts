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
});
