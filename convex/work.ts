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

const workflowStage = v.union(
  v.literal("queued"),
  v.literal("dispatched"),
  v.literal("running"),
  v.literal("verifying"),
  v.literal("done"),
  v.literal("failed"),
  v.literal("cancelled"),
);
const workflowStages = v.array(v.object({
  stage: workflowStage,
  label: v.string(),
  status: v.union(v.literal("pending"), v.literal("active"), v.literal("complete"), v.literal("failed"), v.literal("cancelled")),
  timestamp: v.optional(v.number()),
  detail: v.optional(v.string()),
}));
const workflowVerification = v.object({
  lint: v.boolean(),
  build: v.boolean(),
  exitCode: v.number(),
});

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

    const [events, runs, decisions, workflows] = await Promise.all([
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
      ctx.db
        .query("workflows")
        .withIndex("by_workItemId_updatedAt", (q) => q.eq("workItemId", args.workId))
        .order("desc")
        .take(20),
    ]);

    return { item, events, runs, decisions, workflows };
  },
});

export const listWorkflowsForItem = query({
  args: { workItemId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workflows")
      .withIndex("by_workItemId_updatedAt", (q) => q.eq("workItemId", args.workItemId))
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const createWorkflow = mutation({
  args: {
    workItemId: v.string(),
    trigger: v.string(),
    stages: workflowStages,
    executor: v.optional(v.string()),
    surface: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const item = await ctx.db
      .query("workItems")
      .withIndex("by_workId", (q) => q.eq("workId", args.workItemId))
      .first();
    if (!item) throw new Error(`Work item not found: ${args.workItemId}`);

    const workflowId = `workflow-${now}`;
    await ctx.db.insert("workflows", {
      ...args,
      workflowId,
      status: "queued",
      startTime: now,
      updatedAt: now,
    });
    await ctx.db.patch(item._id, { status: "in_progress", verificationStatus: "not_started", updatedAt: now });
    await ctx.db.insert("workEvents", {
      workId: args.workItemId,
      type: "workflow_queued",
      actor: "Command Center",
      message: `Workflow queued: ${workflowId}`,
      occurredAt: now,
    });
    return { workflowId };
  },
});

export const updateWorkflowStage = mutation({
  args: {
    workflowId: v.string(),
    status: workflowStage,
    stages: workflowStages,
    dispatchJobId: v.optional(v.string()),
    executor: v.optional(v.string()),
    surface: v.optional(v.string()),
    output: v.optional(v.string()),
    exitCode: v.optional(v.number()),
    verification: v.optional(workflowVerification),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("workflows")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
      .first();
    if (!existing) throw new Error(`Workflow not found: ${args.workflowId}`);

    const now = Date.now();
    const { workflowId: _workflowId, ...updates } = args;
    await ctx.db.patch(existing._id, { ...updates, updatedAt: now });

    const item = await ctx.db
      .query("workItems")
      .withIndex("by_workId", (q) => q.eq("workId", existing.workItemId))
      .first();
    if (item) {
      const terminal = args.status === "done" || args.status === "failed" || args.status === "cancelled";
      const verificationSummary = args.verification
        ? `lint ${args.verification.lint ? "passed" : "failed"}; build ${args.verification.build ? "passed" : "failed"}; exit ${args.verification.exitCode}`
        : undefined;
      const patch: Record<string, unknown> = {
        updatedAt: now,
        executor: args.executor ?? item.executor,
        surface: args.surface ?? item.surface,
      };
      if (args.status === "verifying") patch.verificationStatus = "running";
      if (args.status === "done") {
        patch.status = "done";
        patch.verificationStatus = "passed";
        patch.verificationSummary = verificationSummary ?? "Workflow completed.";
      }
      if (args.status === "failed") {
        patch.status = "blocked";
        patch.verificationStatus = "failed";
        patch.verificationSummary = verificationSummary ?? "Workflow failed.";
      }
      await ctx.db.patch(item._id, patch);
      if (args.dispatchJobId) {
        const existingRun = await ctx.db
          .query("executorRuns")
          .withIndex("by_runId", (q) => q.eq("runId", args.dispatchJobId!))
          .first();
        const run: {
          workId: string;
          runId: string;
          executor: string;
          surface: string;
          status: string;
          outputPreview?: string;
          startedAt: number;
          completedAt?: number;
        } = {
          workId: existing.workItemId,
          runId: args.dispatchJobId,
          executor: args.executor ?? item.executor ?? "DISPATCH",
          surface: args.surface ?? item.surface ?? "dispatch-auto",
          status: args.status,
          startedAt: existing.startTime,
        };
        if (args.output) run.outputPreview = args.output.slice(0, 1_000);
        if (terminal) run.completedAt = args.endTime ?? now;
        if (existingRun) await ctx.db.patch(existingRun._id, run);
        else await ctx.db.insert("executorRuns", run);
      }
      await ctx.db.insert("workEvents", {
        workId: existing.workItemId,
        type: terminal ? "workflow_completed" : "workflow_stage",
        actor: "Command Center",
        message: `Workflow ${existing.workflowId} ${args.status}`,
        metadata: JSON.stringify({ dispatchJobId: args.dispatchJobId, verification: args.verification }),
        occurredAt: now,
      });
    }

    return existing._id;
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
    dryRun: v.optional(v.boolean()),
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
    dryRun: v.optional(v.boolean()),
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

export const listWorkEvents = query({
  args: {
    workId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 200;
    if (args.workId) {
      return await ctx.db
        .query("workEvents")
        .withIndex("by_workId_occurredAt", (q) => q.eq("workId", args.workId))
        .order("desc")
        .take(limit);
    }
    return await ctx.db
      .query("workEvents")
      .withIndex("by_occurredAt")
      .order("desc")
      .take(limit);
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
    sourceId: v.optional(v.string()),
    workId: v.optional(v.string()),
    task: v.string(),
    category: v.string(),
    complexity: v.string(),
    urgency: v.optional(v.string()),
    confidence: v.optional(v.string()),
    chosenSurface: v.optional(v.string()),
    chosenModel: v.optional(v.string()),
    via: v.optional(v.string()),
    servedBy: v.optional(v.string()),
    status: v.string(),
    latencyMs: v.optional(v.number()),
    consideredJson: v.optional(v.string()),
    classificationJson: v.optional(v.string()),
    classifierModel: v.optional(v.string()),
    whyLogJson: v.optional(v.string()),
    rejectionsJson: v.optional(v.string()),
    verificationJson: v.optional(v.string()),
    quotaSnapshotJson: v.optional(v.string()),
    circuitSnapshotJson: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("routingDecisions", { ...args, decidedAt: Date.now() });
    if (args.whyLogJson) {
      await ctx.db.insert("routingWhyLogs", {
        workId: args.workId,
        sourceId: args.sourceId,
        routingDecisionId: id,
        task: args.task,
        whyLogJson: args.whyLogJson,
        rejectionsJson: args.rejectionsJson,
        createdAt: Date.now(),
      });
    }
    return id;
  },
});

export const upsertRoutingDecision = mutation({
  args: {
    sourceId: v.string(),
    workId: v.optional(v.string()),
    task: v.string(),
    category: v.string(),
    complexity: v.string(),
    urgency: v.optional(v.string()),
    confidence: v.optional(v.string()),
    chosenSurface: v.optional(v.string()),
    chosenModel: v.optional(v.string()),
    via: v.optional(v.string()),
    servedBy: v.optional(v.string()),
    status: v.string(),
    latencyMs: v.optional(v.number()),
    consideredJson: v.optional(v.string()),
    classificationJson: v.optional(v.string()),
    classifierModel: v.optional(v.string()),
    whyLogJson: v.optional(v.string()),
    rejectionsJson: v.optional(v.string()),
    verificationJson: v.optional(v.string()),
    quotaSnapshotJson: v.optional(v.string()),
    circuitSnapshotJson: v.optional(v.string()),
    decidedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("routingDecisions")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", args.sourceId))
      .first();
    const { decidedAt, ...rest } = args;
    if (existing) {
      await ctx.db.patch(existing._id, { ...rest, decidedAt: decidedAt ?? existing.decidedAt });
      if (args.whyLogJson) {
        const existingWhy = await ctx.db
          .query("routingWhyLogs")
          .withIndex("by_sourceId", (q) => q.eq("sourceId", args.sourceId))
          .first();
        const whyPayload = {
          workId: args.workId,
          sourceId: args.sourceId,
          routingDecisionId: existing._id,
          task: args.task,
          whyLogJson: args.whyLogJson,
          rejectionsJson: args.rejectionsJson,
        };
        if (existingWhy) await ctx.db.patch(existingWhy._id, whyPayload);
        else await ctx.db.insert("routingWhyLogs", { ...whyPayload, createdAt: now });
      }
      return existing._id;
    }
    const id = await ctx.db.insert("routingDecisions", { ...rest, sourceId: args.sourceId, decidedAt: decidedAt ?? now });
    if (args.whyLogJson) {
      await ctx.db.insert("routingWhyLogs", {
        workId: args.workId,
        sourceId: args.sourceId,
        routingDecisionId: id,
        task: args.task,
        whyLogJson: args.whyLogJson,
        rejectionsJson: args.rejectionsJson,
        createdAt: now,
      });
    }
    return id;
  },
});

export const listModelRegistry = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db.query("modelRegistry").take(args.limit ?? 200);
  },
});

export const listModelRuntimeStatus = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db.query("modelRuntimeStatus").withIndex("by_checkedAt").order("desc").take(args.limit ?? 200);
  },
});

export const upsertModelRegistry = mutation({
  args: {
    registryId: v.string(),
    provider: v.string(),
    surface: v.string(),
    model: v.string(),
    capabilitiesJson: v.string(),
    authorityRolesJson: v.string(),
    allowedDomainsJson: v.optional(v.string()),
    tier: v.string(),
    trustLevel: v.optional(v.string()),
    quotaJson: v.optional(v.string()),
    costJson: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("modelRegistry")
      .withIndex("by_registryId", (q) => q.eq("registryId", args.registryId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("modelRegistry", { ...args, updatedAt: now });
  },
});

export const upsertModelRuntimeStatus = mutation({
  args: {
    registryId: v.string(),
    surface: v.string(),
    model: v.string(),
    health: v.string(),
    available: v.boolean(),
    via: v.optional(v.string()),
    quotaUsed: v.optional(v.number()),
    quotaRemaining: v.optional(v.number()),
    circuitState: v.string(),
    lastSuccess: v.optional(v.number()),
    lastFailure: v.optional(v.number()),
    lastError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("modelRuntimeStatus")
      .withIndex("by_registryId", (q) => q.eq("registryId", args.registryId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, checkedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("modelRuntimeStatus", { ...args, checkedAt: now });
  },
});

export const recordModelQuotaEvent = mutation({
  args: {
    registryId: v.string(),
    surface: v.string(),
    eventType: v.string(),
    used: v.optional(v.number()),
    remaining: v.optional(v.number()),
    resetAt: v.optional(v.number()),
    detail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("modelQuotaEvents", { ...args, occurredAt: Date.now() });
  },
});

export const recordVerificationRun = mutation({
  args: {
    workId: v.optional(v.string()),
    runId: v.string(),
    routingDecisionId: v.optional(v.string()),
    verifierSurface: v.optional(v.string()),
    verifierModel: v.optional(v.string()),
    state: v.union(
      v.literal("pending"),
      v.literal("passed"),
      v.literal("failed"),
      v.literal("needs_review"),
      v.literal("verifier_unavailable"),
      v.literal("timeout"),
    ),
    summary: v.optional(v.string()),
    attemptsJson: v.optional(v.string()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("verificationRuns")
      .withIndex("by_runId", (q) => q.eq("runId", args.runId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("verificationRuns", args);
  },
});

export const listVerificationRuns = query({
  args: {
    workId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    if (args.workId) {
      return await ctx.db
        .query("verificationRuns")
        .withIndex("by_workId_startedAt", (q) => q.eq("workId", args.workId))
        .order("desc")
        .take(limit);
    }
    return await ctx.db.query("verificationRuns").withIndex("by_startedAt").order("desc").take(limit);
  },
});

export const listRoutingDecisions = query({
  args: {
    workId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    if (args.workId) {
      return await ctx.db
        .query("routingDecisions")
        .withIndex("by_workId_decidedAt", (q) => q.eq("workId", args.workId))
        .order("desc")
        .take(limit);
    }
    return await ctx.db.query("routingDecisions").withIndex("by_decidedAt").order("desc").take(limit);
  },
});

export const recordRoutingWhyLog = mutation({
  args: {
    workId: v.optional(v.string()),
    routingDecisionId: v.optional(v.string()),
    sourceId: v.optional(v.string()),
    task: v.optional(v.string()),
    whyLogJson: v.string(),
    rejectionsJson: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("routingWhyLogs", { ...args, createdAt: Date.now() });
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

export const listExecutorRuns = query({
  args: {
    workId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    if (args.workId) {
      return await ctx.db
        .query("executorRuns")
        .withIndex("by_workId_startedAt", (q) => q.eq("workId", args.workId))
        .order("desc")
        .take(limit);
    }
    return await ctx.db.query("executorRuns").withIndex("by_startedAt").order("desc").take(limit);
  },
});
