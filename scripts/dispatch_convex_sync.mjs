#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const DISPATCH_URL = process.env.DISPATCH_URL || "http://192.168.1.178:4001";
const CONVEX_URL = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL || "http://192.168.1.179:3210";
const INTERVAL_MS = Number(process.env.SYNC_INTERVAL_MS || 60_000);

const client = new ConvexHttpClient(CONVEX_URL);

async function getJson(path) {
  const response = await fetch(`${DISPATCH_URL}${path}`);
  if (!response.ok) throw new Error(`${path} ${response.status}`);
  return await response.json();
}

function maybeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parseMaybeJson(value, fallback) {
  if (!value || typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function syncModels() {
  const payload = await getJson("/registry/status");
  const models = payload.models || [];
  for (const model of models) {
    await client.mutation(api.work.upsertModelRegistry, {
      registryId: model.id,
      provider: model.provider,
      surface: model.surface,
      model: model.model,
      capabilitiesJson: JSON.stringify(model.capabilities || []),
      authorityRolesJson: JSON.stringify(model.authority_roles || []),
      allowedDomainsJson: JSON.stringify(model.allowed_domains || []),
      tier: model.tier,
      trustLevel: model.trust_level,
      quotaJson: JSON.stringify(model.quota || {}),
      costJson: JSON.stringify(model.cost || {}),
    });
    if (model.runtime) {
      await client.mutation(api.work.upsertModelRuntimeStatus, {
        registryId: model.id,
        surface: model.surface,
        model: model.model,
        health: model.runtime.health || "unknown",
        available: Boolean(model.runtime.available),
        via: model.runtime.via || undefined,
        quotaUsed: maybeNumber(model.runtime.quota_used),
        quotaRemaining: maybeNumber(model.runtime.quota_remaining),
        circuitState: model.runtime.circuit_state || "closed",
        lastSuccess: maybeNumber(model.runtime.last_success ? Math.round(model.runtime.last_success * 1000) : undefined),
        lastFailure: maybeNumber(model.runtime.last_failure ? Math.round(model.runtime.last_failure * 1000) : undefined),
        lastError: model.runtime.last_error || undefined,
      });
    }
  }
  return models.length;
}

async function syncDecisions() {
  const payload = await getJson("/decisions");
  const decisions = payload.decisions || [];
  for (const decision of decisions) {
    const classification = parseMaybeJson(decision.classification_json, {});
    await client.mutation(api.work.upsertRoutingDecision, {
      sourceId: `dispatch:${decision.id}`,
      task: decision.task || "",
      category: decision.category || classification.category || "unknown",
      complexity: decision.complexity || classification.complexity || "routine",
      urgency: decision.urgency || classification.urgency || undefined,
      confidence: decision.confidence || classification.confidence || undefined,
      chosenSurface: decision.chosen_surface || undefined,
      chosenModel: decision.chosen_model || undefined,
      via: decision.via || undefined,
      servedBy: decision.served_by || undefined,
      status: decision.status || "unknown",
      latencyMs: maybeNumber(decision.latency_ms),
      consideredJson: decision.considered || undefined,
      classificationJson: decision.classification_json || undefined,
      classifierModel: classification.classifier_model || undefined,
      whyLogJson: decision.why_log || undefined,
      rejectionsJson: decision.rejections || undefined,
      verificationJson: decision.verification_json || undefined,
      quotaSnapshotJson: decision.quota_snapshot || undefined,
      circuitSnapshotJson: decision.circuit_snapshot || undefined,
    });
  }
  return decisions.length;
}

async function syncVerificationJobs() {
  const payload = await getJson("/verification/jobs");
  const jobs = payload.jobs || [];
  for (const job of jobs) {
    const result = parseMaybeJson(job.result_json, {});
    const attempts = parseMaybeJson(job.attempts_json, []);
    const firstVerifier = attempts.find((attempt) => attempt.surface || attempt.model) || {};
    const state = ["pending", "passed", "failed", "needs_review", "verifier_unavailable", "timeout"].includes(job.status)
      ? job.status
      : "needs_review";
    await client.mutation(api.work.recordVerificationRun, {
      runId: `dispatch-verification:${job.id}`,
      routingDecisionId: job.routing_decision_id ? `dispatch:${job.routing_decision_id}` : undefined,
      verifierSurface: firstVerifier.surface || undefined,
      verifierModel: firstVerifier.model || undefined,
      state,
      summary: result.state ? `Async verifier ${result.state}` : `Async verifier ${state}`,
      attemptsJson: job.attempts_json || "[]",
      startedAt: job.ts ? Date.parse(job.ts) : Date.now(),
      completedAt: state === "queued" || state === "running" || state === "pending"
        ? undefined
        : (job.updated_ts ? Date.parse(job.updated_ts) : Date.now()),
    });
  }
  return jobs.length;
}

export async function syncOnce() {
  const [models, decisions, jobs] = await Promise.all([
    syncModels(),
    syncDecisions(),
    syncVerificationJobs(),
  ]);
  return { models, decisions, jobs };
}

async function main() {
  const once = process.argv.includes("--once");
  do {
    const result = await syncOnce();
    console.log(new Date().toISOString(), JSON.stringify(result));
    if (once) return;
    await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
  } while (true);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

