import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const upsertHeartbeat = mutation({
  args: {
    agentId: v.string(),
    status: v.string(),
    actionsToday: v.number(),
    statusNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agentStatus")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        lastHeartbeatAt: now,
        actionsToday: args.actionsToday,
        statusNote: args.statusNote,
      });
    } else {
      await ctx.db.insert("agentStatus", {
        agentId: args.agentId,
        status: args.status,
        lastHeartbeatAt: now,
        actionsToday: args.actionsToday,
        statusNote: args.statusNote,
      });
    }
  },
});

export const listLiveStatus = query({
  args: {},
  handler: async (ctx) => {
    const statuses = await ctx.db.query("agentStatus").collect();
    return statuses.map((s) => ({
      agentId: s.agentId,
      status: s.status,
      lastHeartbeatAt: new Date(s.lastHeartbeatAt).toISOString(),
      actionsToday: s.actionsToday,
      statusNote: s.statusNote,
    }));
  },
});

export const getAgentStatus = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const status = await ctx.db
      .query("agentStatus")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();

    if (!status) return null;

    return {
      agentId: status.agentId,
      status: status.status,
      lastHeartbeatAt: new Date(status.lastHeartbeatAt).toISOString(),
      actionsToday: status.actionsToday,
      statusNote: status.statusNote,
    };
  },
});
