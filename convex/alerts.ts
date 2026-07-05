import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getActive = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("alerts")
      .withIndex("by_acknowledged", (q) => q.eq("acknowledged", false))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("alerts")
      .withIndex("by_createdAt")
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const pushAlert = mutation({
  args: {
    severity: v.string(),
    title: v.string(),
    system: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("alerts", {
      ...args,
      acknowledged: false,
      createdAt: Date.now(),
    });
  },
});

export const acknowledgeAlert = mutation({
  args: { id: v.id("alerts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { acknowledged: true });
  },
});
