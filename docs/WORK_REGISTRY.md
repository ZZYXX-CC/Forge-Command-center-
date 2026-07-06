# Work Registry foundation

Small, safe path from the `/tasks` fallback seed to live registry data:

1. `/tasks` first reads Convex `workItems` through `src/lib/useConvex.ts`.
2. `src/lib/workRegistry.ts` adapts live `workItems` into the existing `Task` board shape, so the UI does not need a second rendering path.
3. If Convex is not configured or returns no `workItems`, `/tasks` keeps using the local seed from `src/lib/workQueueSeed.ts`.
4. When a live item is selected, the detail panel can read `workEvents`, `executorRuns`, and `routingDecisions` via `convex/work.ts:getWorkItem`.

No broad migration is required for this slice. The existing Convex tables remain additive registry tables: `workItems`, `workEvents`, `executorRuns`, and `routingDecisions`. DISPATCH or intake code can move the page fully live by upserting `workItems`, appending `workEvents`, and recording executor runs/decisions without changing the `/tasks` board contract.
