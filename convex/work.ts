import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const priority = v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"));
const workStatus = v.union(
  v.literal("backlog"),
  v.literal("ready"),
  v.literal("assigned"),
  v.literal("in_progress"),
  v.literal("blocked"),
  v.literal("review"),
  v.literal("done"),
  v.literal("cancelled"),
);
const verificationStatus = v.union(
  v.literal("not_started"),
  v.literal("running"),
  v.literal("passed"),
  v.literal("failed"),
  v.literal("waived"),
);

export const listWorkItems = query({
  args: {
    status: v.optional(workStatus),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const rows = args.status
      ? await ctx.db
          .query("workItems")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .take(limit)
      : await ctx.db.query("workItems").withIndex("by_updatedAt").order("desc").take(limit);

    return rows;
  },
});

export const getWorkItem = query({
  args: { workId: v.string() },
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("workItems")
      .withIndex("by_workId", (q) => q.eq("workId", args.workId))
      .first();
    if (!item) return null;

    const [events, runs, decisions] = await Promise.all([
      ctx.db
        .query("workEvents")
        .withIndex("by_workId_occurredAt", (q) => q.eq("workId", args.workId))
        .order("desc")
        .take(100),
      ctx.db
        .query("executorRuns")
        .withIndex("by_workId_startedAt", (q) => q.eq("workId", args.workId))
        .order("desc")
        .take(50),
      ctx.db
        .query("routingDecisions")
        .withIndex("by_workId_decidedAt", (q) => q.eq("workId", args.workId))
        .order("desc")
        .take(50),
    ]);

    return { item, events, runs, decisions };
  },
});

export const createWorkItem = mutation({
  args: {
    title: v.string(),
    summary: v.optional(v.string()),
    status: workStatus,
    priority,
    orchestrator: v.string(),
    owner: v.optional(v.string()),
    executor: v.optional(v.string()),
    surface: v.optional(v.string()),
    model: v.optional(v.string()),
    branch: v.optional(v.string()),
    pullRequestUrl: v.optional(v.string()),
    issueUrl: v.optional(v.string()),
    blocker: v.optional(v.string()),
    verificationStatus: v.optional(verificationStatus),
    verificationSummary: v.optional(v.string()),
    dueAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const workId = `work-${now}`;
    await ctx.db.insert("workItems", {
      ...args,
      workId,
      verificationStatus: args.verificationStatus ?? "not_started",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("workEvents", {
      workId,
      type: "created",
      actor: args.orchestrator,
      message: `Created work item: ${args.title}`,
      occurredAt: now,
    });
    return { workId };
  },
});

export const updateWorkItem = mutation({
  args: {
    workId: v.string(),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    status: v.optional(workStatus),
    priority: v.optional(priority),
    orchestrator: v.optional(v.string()),
    owner: v.optional(v.string()),
    executor: v.optional(v.string()),
    surface: v.optional(v.string()),
    model: v.optional(v.string()),
    branch: v.optional(v.string()),
    pullRequestUrl: v.optional(v.string()),
    issueUrl: v.optional(v.string()),
    blocker: v.optional(v.string()),
    verificationStatus: v.optional(verificationStatus),
    verificationSummary: v.optional(v.string()),
    dueAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("workItems")
      .withIndex("by_workId", (q) => q.eq("workId", args.workId))
      .first();
    if (!existing) throw new Error(`Work item not found: ${args.workId}`);

    const { workId: _workId, ...updates } = args;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }

    await ctx.db.patch(existing._id, patch);
    return existing._id;
  },
});

export const addWorkEvent = mutation({
  args: {
    workId: v.string(),
    type: v.string(),
    actor: v.string(),
    message: v.string(),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("workItems")
      .withIndex("by_workId", (q) => q.eq("workId", args.workId))
      .first();
    if (!item) throw new Error(`Work item not found: ${args.workId}`);

    const now = Date.now();
    await ctx.db.patch(item._id, { updatedAt: now });
    return await ctx.db.insert("workEvents", { ...args, occurredAt: now });
  },
});

export const upsertWorkItem = mutation({
  args: {
    workId: v.string(),
    title: v.string(),
    summary: v.optional(v.string()),
    status: workStatus,
    priority,
    orchestrator: v.string(),
    owner: v.optional(v.string()),
    executor: v.optional(v.string()),
    surface: v.optional(v.string()),
    model: v.optional(v.string()),
    branch: v.optional(v.string()),
    pullRequestUrl: v.optional(v.string()),
    issueUrl: v.optional(v.string()),
    blocker: v.optional(v.string()),
    verificationStatus,
    verificationSummary: v.optional(v.string()),
    dueAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("workItems")
      .withIndex("by_workId", (q) => q.eq("workId", args.workId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      return existing._id;
    }

    return await ctx.db.insert("workItems", { ...args, createdAt: now, updatedAt: now });
  },
});

export const appendWorkEvent = mutation({
  args: {
    workId: v.string(),
    type: v.string(),
    actor: v.string(),
    message: v.string(),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("workEvents", { ...args, occurredAt: Date.now() });
  },
});

export const recordRoutingDecision = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("routingDecisions", { ...args, decidedAt: Date.now() });
  },
});

export const recordExecutorRun = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("executorRuns")
      .withIndex("by_runId", (q) => q.eq("runId", args.runId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("executorRuns", args);
  },
});
