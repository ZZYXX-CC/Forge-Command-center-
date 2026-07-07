import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getBybitBalances = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("bybitBalances").collect();
  },
});

export const upsertBalance = mutation({
  args: {
    label: v.string(),
    amount: v.number(),
    currency: v.string(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("bybitBalances")
      .withIndex("by_label", (q) => q.eq("label", args.label))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        amount: args.amount,
        currency: args.currency,
        source: args.source,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("bybitBalances", {
        ...args,
        updatedAt: Date.now(),
      });
    }
  },
});
