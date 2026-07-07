import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getSpread = query({
  args: { pair: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.pair) {
      return await ctx.db
        .query("p2pSpread")
        .withIndex("by_pair", (q) => q.eq("pair", args.pair!))
        .first();
    }
    return await ctx.db.query("p2pSpread").order("desc").first();
  },
});

export const getActiveOrders = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("p2pOrders")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

export const getPendingOrders = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("p2pOrders")
      .withIndex("by_status", (q) => q.eq("status", "pending_payment"))
      .collect();
  },
});

export const upsertSpread = mutation({
  args: {
    pair: v.string(),
    bestBuyPrice: v.number(),
    bestSellPrice: v.number(),
    spreadAbs: v.number(),
    spreadPct: v.number(),
    buyDepthTop5: v.number(),
    sellDepthTop5: v.number(),
    depthImbalance: v.number(),
    volatility1h: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("p2pSpread")
      .withIndex("by_pair", (q) => q.eq("pair", args.pair))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("p2pSpread", { ...args, updatedAt: Date.now() });
    }
  },
});

export const insertOrder = mutation({
  args: {
    side: v.string(),
    price: v.number(),
    quantity: v.number(),
    status: v.string(),
    counterparty: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("p2pOrders", { ...args, timestamp: Date.now() });
  },
});
