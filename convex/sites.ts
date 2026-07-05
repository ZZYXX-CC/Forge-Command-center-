import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getLiveStatus = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("siteStatus").collect();
  },
});

export const getSiteStatus = query({
  args: { siteId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("siteStatus")
      .withIndex("by_siteId", (q) => q.eq("siteId", args.siteId))
      .first();
  },
});

export const pingUptime = mutation({
  args: {
    siteId: v.string(),
    name: v.string(),
    url: v.string(),
    status: v.string(),
    latencyMs: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("siteStatus")
      .withIndex("by_siteId", (q) => q.eq("siteId", args.siteId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        latencyMs: args.latencyMs,
        lastPingAt: Date.now(),
      });
    } else {
      await ctx.db.insert("siteStatus", {
        siteId: args.siteId,
        name: args.name,
        url: args.url,
        status: args.status,
        latencyMs: args.latencyMs,
        lastPingAt: Date.now(),
      });
    }
  },
});
