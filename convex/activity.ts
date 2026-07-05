import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activity")
      .withIndex("by_occurredAt")
      .order("desc")
      .take(args.limit ?? 30);
  },
});

export const appendActivity = mutation({
  args: {
    type: v.string(),
    description: v.string(),
    actor: v.string(),
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("activity", {
      ...args,
      occurredAt: Date.now(),
    });
  },
});
