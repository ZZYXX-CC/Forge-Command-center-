import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getOpenPositions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tradingPositions").collect();
  },
});

export const getPnL = query({
  args: {},
  handler: async (ctx) => {
    const pnl = await ctx.db.query("tradingPnl").order("desc").first();
    return pnl ?? null;
  },
});

export const getOrders = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("tradingOrders")
      .withIndex("by_timestamp")
      .order("desc")
      .take(args.limit ?? 50);
    return orders;
  },
});

export const upsertPosition = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tradingPositions")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("tradingPositions", {
        ...args,
        updatedAt: Date.now(),
      });
    }
  },
});

export const insertOrder = mutation({
  args: {
    symbol: v.string(),
    side: v.string(),
    type: v.string(),
    status: v.string(),
    price: v.optional(v.number()),
    amount: v.number(),
    filledAmount: v.number(),
    rejectReason: v.optional(v.string()),
    retCode: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("tradingOrders", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const updatePnL = mutation({
  args: {
    session: v.number(),
    day: v.number(),
    week: v.number(),
    realized: v.number(),
    unrealized: v.number(),
    marginUsage: v.number(),
    totalOpenRisk: v.number(),
    maxDrawdown: v.number(),
    drawdownLimit: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("tradingPnl").order("desc").first();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("tradingPnl", { ...args, updatedAt: Date.now() });
    }
  },
});
