# FORGE Command Center — Product Requirements Document
### iCHRIS Edition — v1.4
### nuvue.studio / OpenClaw — March 2026

---

## What Changed in v1.4

- **OpenClaw Gateway Chat integrated** — Team Overview now has three views: Map, Roster, Chat
- **Chat architecture documented** — WebSocket connection to `ws://localhost:18789` via openclaw-studio gateway
- **Neural Command Map upgraded** — full chat system with broadcast (Neural Network) and individual agent channels
- **Intelligence Tools sidebar** — contextual agent internals (logs, memory, schedules, config) available in chat view
- **End-to-end implementation plan added** — agent-by-agent build sequence with Cursor as registered Paperclip execution agent
- **Legacy pages removed** — Audit, Finance, Incidents, Messaging, Deployments, WebOps, ComponentLibrary deleted from codebase
- **All pages now use FORGE UI component library** — zero external UI dependencies
- **tsc --noEmit passes clean** — zero TypeScript errors as of v1.4

## What Changed in v1.3

- **Paperclip replaces Supabase** as the backend for agent roster, tasks, clients, org structure, budgets, and audit log
- **Convex stays** — owns all real-time functions (trading positions, P2P spread, heartbeats, alerts, site uptime, balances)
- **Aggregator Layer added** — custom controllers inside Paperclip translate its data model into FORGE's OverviewState schema
- **Antfarm confirmed in stack** — CI/CD pipeline layer for deterministic multi-step agent workflows, restored and running
- **Cursor registered as Paperclip agent** — execution layer for all coding tasks, KERN becomes technical lead
- **Mock flag pattern updated** — `USE_PAPERCLIP_MOCK` replaces `USE_SUPABASE_MOCK`
- **Build sequence updated** — Paperclip setup before any frontend wiring
- **Settings page updated** — Supabase connection replaced with Paperclip connection

## What Changed in v1.2

- Database architecture upgraded to hybrid Supabase + Convex
- BRIDGE payment access policy defined
- Bot Team renamed to Team Overview, moved to top of nav
- PENDING INTEGRATION component added as first-class UI state

## What Changed in v1.1

- Real agent data, neural map, MIGUEL added
- Pipeline agent tier added
- EDGE↔BRIDGE communication policy documented

---

## Who This Dashboard Is For

One person. Solo operator. Multiple moving parts.

iCHRIS runs:
- A futures trading bot with custom + OpenClaw strategies
- Bybit P2P fiat trading (active spread monitoring)
- nuvue.studio — 10+ client and personal web projects
- A creative production arm (photo/video)
- An OpenClaw AI agent team (MIGUEL, VAEL, KERN, EDGE, BRIDGE + pipeline)
- Client relationships and occasional professional collaborators

---

## Page Map

| # | Route | Name | Purpose |
|---|---|---|---|
| 0 | `/bots` | **Team Overview** | OpenClaw agent fleet — roster + neural map + chat |
| 1 | `/` | Morning Brief | Full day snapshot — 60 second read |
| 2 | `/trading` | Trading Ops | Futures bot, positions, PnL, risk |
| 3 | `/p2p` | P2P Markets | Bybit P2P spread, active orders, fiat flow |
| 4 | `/sites` | Sites | All web properties — uptime, deploys, SSL |
| 5 | `/money` | Money | Revenue, balances, invoices — two lanes |
| 6 | `/tasks` | Tasks | Client work, own builds, content, daily |
| 7 | `/clients` | Clients | Lightweight CRM — projects, deadlines, invoices |
| 8 | `/content` | Content | Photo/video production pipeline |
| 9 | `/settings` | Settings | API connections, alert prefs, intervals |

---

---

## Page 0: Morning Brief (`/`)

Answers five questions in 60 seconds:
1. Is my trading up or down right now?
2. Are any of my sites down?
3. What do I need to do today?
4. What's my money situation?
5. Did anything break overnight?

### KPI Strip — 4 tiles
| Tile | Value | Status rule |
|---|---|---|
| Trading PnL Today | +/- $ | Green if positive, red if negative |
| Sites Online | N / total | Green if all up |
| Unpaid Invoices | Total $ | Amber if >0 |
| Tasks Due Today | Count | Amber if any, red if overdue |

### Card Grid — 2×3
- Trading Snapshot → `/trading`
- Sites Health → `/sites`
- Money Snapshot → `/money`
- Client Pulse → `/clients`
- Tasks → `/tasks`
- Bot Team Status → `/bots`

### Right Rail
- Today's Top 5 Tasks (checkable)
- Active Alerts only (no noise — "✓ All clear" if empty)

### Overnight Log
Last 8H activity feed. Types: BOT ACTION / SITE EVENT / DEPLOY / ORDER FILLED / ALERT / TASK DUE

---

## Page 1: Trading Ops (`/trading`)

Futures bot, positions, PnL, risk. Refreshed every 5s.

### Sections
- Execution Health Strip (bot status, latency, error rate, last signal)
- PnL + Exposure Row (today / week / month + drawdown progress bar)
- Positions Table (pair, side, size, entry, mark, PnL, strategy, age)
- Orders Tape (live fill feed)
- Decision Log (what the bot decided and why)
- Strategy Runtime Panel (per-strategy PnL, win rate, start/pause)
- Risk Guardrails Panel (drawdown / position / daily loss limits + HALT ALL)

---

## Page 2: P2P Markets (`/p2p`)

Bybit P2P fiat trading. Refreshed every 15s.

**BRIDGE access policy:** BRIDGE monitors payment status only — read access to know when a payment has been received or sent. BRIDGE does NOT have payment execution access. When a payment event occurs, BRIDGE triggers the next required step (release crypto on a sell order, or update status to paid on a buy order). No direct payment connections, no wallet write access.

### Sections
- Pair selector (USDT/NGN, USDT/KES)
- KPI Strip (best buy, best sell, my spread, active orders)
- Spread Heatmap (opportunity score by hour, last 3 days)
- My Active Ads Panel (price, quantity, completion rate, status)
- Order Action Panel — shows pending orders awaiting next step:
  - Sell order: payment received → Release crypto button
  - Buy order: crypto received → Mark as paid button
- Recent Trades Feed (last 10 completed)
- Trade History Table (full filterable log)

---

## Page 3: Sites (`/sites`)

All 10+ web properties. Own vs client distinction. Refreshed every 60s.

### Sections
- Filter pills: ALL / OWN / CLIENT / DOWN / DEGRADED
- KPI Strip (all up count, avg uptime, pending deploys, SSL warnings)
- Site Roster Table (status, name, type, client, uptime, latency, errors, actions)
- Row expand: sub-services, last 10 errors, 90-check uptime strip
- SSL Certificates Card
- Deploy History (last 10 across all sites)

---

## Page 4: Money (`/money`)

Two lanes — trading income and service income — never merged.

### Sections
- Month selector + currency toggle (NGN / USD)
- Revenue Summary Row (total, trading, service — with delta vs last month)
- Balances Panel (Bybit USDT, fiat NGN, bank — separate entries)
- Invoice Tracker (all clients — issued, due, status, actions)
- Income Breakdown Chart (stacked area — trading / P2P / futures / service by week)
- Transaction History (filterable)

---

## Page 5: Tasks (`/tasks`)

Four work types in one view.

### Sections
- View toggle: TODAY / THIS WEEK / ALL
- Today's Focus Strip (top 3 most urgent — large, prominent)
- Task Board — 4 columns: CLIENT WORK / OWN BUILDS / CONTENT / DAILY
- Upcoming Deadlines Timeline (14 days)
- Quick Add in right rail

---

## Page 6: Clients (`/clients`)

Lightweight CRM. Enough to never miss a deadline or let an invoice age.

### Sections
- Search + filter: ACTIVE / ARCHIVED / OVERDUE
- Client roster (card per client: projects, status, next deadline, outstanding amount)
- Card expand: all projects, all invoices, last 5 comms/notes
- Right rail: upcoming deadlines this week + outstanding invoices

---

---

## Page 7: Team Overview (`/bots`)

**The AI agent fleet — roster view, neural command map, and agent chat.**

This page has three views toggled from the page header:
- **MAP** — live topology graph with draggable agent nodes
- **ROSTER** — structured list by tier
- **CHAT** — direct communication with agents via OpenClaw Gateway

All three views live inside `NeuralCommandMap.tsx`. See `src/docs/CHAT_SYSTEM.md` for implementation details.

---

### The Real Agent Fleet

Sourced from `agent_snapshot_2026-03-11.json`. Use this exactly.

**TIER 1 — CORE (5 agents)**

| Agent | Role | Emoji | Status |
|---|---|---|---|
| MIGUEL | Coordinator / Orchestrator | — | Paused (pivot) |
| VAEL | Design / UI Adaptation | ◈ | Paused (pivot) |
| KERN | Backend + Frontend Implementation | ⬡ | Paused (pivot) |
| EDGE | Trading / Risk Contracts | ↗ | Paused (pivot) |
| BRIDGE | P2P Ops / Schema | ⚡ | Paused (pivot) |

**TIER 2 — SUPPORT (1 agent)**

| Agent | Role | Status |
|---|---|---|
| TESTER | QA Gate | Paused (pivot) |

**TIER 3 — PIPELINE (6 agents)**

All 6 feature-dev sub-agents run on 5-minute cron and report directly to MIGUEL.
They are background workers — they do not deliver to Telegram and do not need to.
MIGUEL aggregates their output and surfaces what matters in his digest.

| Agent | Role | Status |
|---|---|---|
| feature-dev planner | Planning breakdown + dependency map | Error |
| feature-dev setup | Repo/bootstrap standardization | Error |
| feature-dev developer | Implementation assistance | Error |
| feature-dev reviewer | Quality/review comments | Error |
| feature-dev tester | Test execution support | Error |
| feature-dev verifier | Acceptance + gate verification | Error |

**Communication Policy:**
EDGE and BRIDGE do NOT communicate directly. All EDGE↔BRIDGE sync routes via MIGUEL.
Exception: emergency or mode-change events only.
This must be visible on the Neural Map (locked edge between EDGE and BRIDGE, relay via MIGUEL shown).

**MIGUEL Schedules:**
- Morning Ops Digest: 08:00 WAT daily → Telegram
- Evening Ops Digest: 19:00 WAT daily → Telegram
- OpsBrief: every 30 minutes

---

### KPI Strip

| Tile | Value | Status |
|---|---|---|
| Total Agents | 12 | neutral |
| Core Active | running core agents | green if all, amber if some paused |
| Pipeline Errors | error count | red if >0 |
| Last Heartbeat | most recent heartbeat timestamp | amber if >15 min |

---

### Map View

SVG-based neural topology. Not React Flow — custom SVG with framer-motion animations.

**Node design:**
- Diamond shape for core/support agents, circle for pipeline
- Border color = agent status (uses FORGE status tokens)
- Name (bold), model (mono, small), emoji
- Ambient breathing glow animation
- Rotating ring for core agents
- Error nodes: red pulsing glow

**Edge design:**
- Collaborates: solid line, emerald when highlighted
- Reports-to: dashed gray line (pipeline → MIGUEL)
- Routes-via: arrow indicator
- Blocked: dashed red line with shield icon at midpoint
- Neural pulse animation on active edges
- Edge thickness: consistent, highlighted on hover

**Layout:**
- MIGUEL: center
- Core agents: ring around MIGUEL
- TESTER: just outside the ring
- Pipeline agents: clustered sub-group (bottom area)

**Interactions:**
- Click node → right slide-in panel with full agent dossier
- Hover node → highlight connected edges, dim unconnected nodes
- Drag nodes to reorganize layout
- Mouse wheel zoom + canvas pan
- Click blocked edge → security policy tooltip

---

### Roster View

**Core agents: card grid (1–3 columns responsive)**

Each card shows:
- Name, role, model (mono), tier chip
- Status dot + status text
- What the agent owns (responsibilities)
- Tools: listed
- Collaborates with: name chips
- Schedules (if any)

Special display on EDGE and BRIDGE cards:
→ "Comms policy: Route via MIGUEL" with lock icon

**Pipeline agents: compact card grid**

Each card: status dot | name | role | model (mono) | last heartbeat

---

### Chat View — OpenClaw Gateway Integration

**Architecture:**
```
┌──────────────────────────────────────────┐
│        FORGE CHAT (NeuralCommandMap)     │
│  Browser WebSocket client                │
└──────────────┬───────────────────────────┘
               │ ws://localhost:18789
               ▼
┌──────────────────────────────────────────┐
│        OPENCLAW GATEWAY                  │
│  openclaw-studio WebSocket server        │
│  Routes messages to agent sessions       │
│  Manages auth via token                  │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│        OPENCLAW AGENT RUNTIME            │
│  MIGUEL, VAEL, KERN, EDGE, BRIDGE, etc. │
│  Each agent has its own session context  │
└──────────────────────────────────────────┘
```

**Connection:**
- WebSocket URL: `VITE_OPENCLAW_GATEWAY_URL` (default `ws://localhost:18789`)
- Auth: `VITE_OPENCLAW_GATEWAY_TOKEN` passed on handshake
- Client implementation: `src/lib/openclawGateway.ts`
- Reconnect: automatic with exponential backoff
- Heartbeat: ping every 30s to keep connection alive

**Channels:**

| Channel | ID | Purpose |
|---|---|---|
| Neural Network | `network` | Broadcast to all agents — system-wide directives |
| MIGUEL | `miguel` | Direct orchestrator communication |
| VAEL | `vael` | Design directives and UI reviews |
| KERN | `kern` | Technical tasks and architecture decisions |
| EDGE | `edge` | Trading strategy and risk discussion |
| BRIDGE | `bridge` | P2P operations and schema work |
| TESTER | `tester` | QA tasks and test results |

**Chat UI layout:**
- **Status strip** (below header): Neural Network broadcast + individual agent status pills — click to switch channel
- **Intelligence Tools sidebar** (left, 256px): contextual tools for active agent — Open Logs, Memory Browser, Schedules, Bot Configuration. In broadcast mode shows placeholder.
- **Message area** (center): timestamped message bubbles — agent messages left-aligned (surface-raised), operator messages right-aligned (emerald accent)
- **Quick actions strip**: Status Report, Run Diagnostics, Sync Neural Map, Clear Logs — click populates input
- **Input area** (bottom): paperclip attachment button, text input, send button

**Message format (WebSocket):**
```typescript
interface GatewayMessage {
  type: 'chat' | 'directive' | 'broadcast';
  channel: string;        // agent ID or 'network'
  content: string;
  sender: 'OPERATOR' | string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
```

**Typing indicator:** shows when agent is processing a response.

**Current state:** Mock responses via setTimeout. Wire to gateway in Phase 3.

---

### Activity Feed

Right rail or bottom section. Last 24H of agent actions.

```
[time]  [AGENT]  action description  [outcome]
```

---

### Heartbeat Architecture

Two-layer heartbeat system:

**Paperclip layer (persistent)**
OpenClaw agents post session-end status to Paperclip via `/forge/agent/:id/heartbeat`.
Paperclip records it with full audit trail — source of truth for roster and history.

**Convex layer (real-time)**
OpenClaw scheduled process runs every 15 minutes:
1. Upserts live status into Convex `agentStatus` table
2. Appends to `agentActivity` feed
3. Updates `lastHeartbeatAt` per agent
4. Stale agents (>15 min) auto-flagged degraded

**Frontend connection (when live):**
```typescript
const liveStatus = useQuery(api.agents.listLiveStatus);  // Convex — real-time
const roster     = await fetch('/forge/team-state');      // Paperclip — persistent

// Merge: roster from Paperclip, live status overlay from Convex
```

---

---

## Page 8: Content (`/content`)

Photo and video production pipeline.

### Views: PIPELINE / CALENDAR / ARCHIVE

**Pipeline — 5 columns:** SCHEDULED → SHOT → EDITING → REVIEW → DELIVERED

Each content card: title, type chip (PHOTO/VIDEO/REEL), client or personal, due date

### Right rail
- Upcoming shoots (next 7 days)
- Pending edits backlog

---

## Page 9: Settings (`/settings`)

Three sections only.

### Section 1: Connections & API Keys
- Bybit API (trading + P2P)
- Paperclip connection (company ID, API endpoint)
- Convex deployment URL
- Uptime monitoring service
- OpenClaw Gateway (URL + auth token)

### Section 2: Alert Preferences
What triggers a banner vs toast vs silence — per alert type, toggleable.

### Section 3: Dashboard Behavior
- Refetch intervals per domain
- Default landing page
- Currency display (USD / NGN / both)
- Keyboard shortcuts reference

---

---

## Navigation Rail

```
⬟   Team Overview  ← dot shows worst agent status
⬡   Morning Brief
↗   Trading Ops
⚡   P2P Markets
◈   Sites
◎   Money
✓   Tasks
◉   Clients
◆   Content
⚙   Settings
```

Status dots on nav items reflect domain health.
Team Overview dot: reflects worst status across all agents (error > paused > healthy).

---

## Backend Architecture — Paperclip + Convex + OpenClaw Gateway + FORGE UI

### The Stack

```
┌─────────────────────────────────────────┐
│           FORGE COMMAND CENTER          │
│      React + Vite + Tailwind v4         │
│   FORGE × NUVUE v2 design system        │
│   Your UI. Your components. Full.       │
└──────┬──────────────────┬──────────────┘
       │ React Query       │ WebSocket
       │ polls JSON        │ real-time chat
       ▼                   ▼
┌──────────────────┐  ┌──────────────────────┐
│  FORGE AGGREGATOR│  │  OPENCLAW GATEWAY     │
│  LAYER           │  │  ws://localhost:18789  │
│  /forge/* routes │  │  Agent chat routing    │
│  inside Paperclip│  │  Session management    │
└──────┬───────────┘  └──────────────────────┘
       │                    │
       ▼                    ▼
┌──────────────────┐  ┌──────────────────────┐
│   PAPERCLIP      │  │   CONVEX             │
│   ENGINE         │  │   REAL-TIME LAYER    │
│                  │  │                      │
│ PostgreSQL       │  │ Agent heartbeats     │
│ Agent org chart  │  │ Trading positions    │
│ Task tickets     │  │ Live PnL (5s)        │
│ Goal ancestry    │  │ P2P spread + orders  │
│ Budget caps      │  │ Bybit balances       │
│ Audit log        │  │ Site uptime pings    │
│ Multi-company    │  │ Alerts feed          │
│ Clients          │  │ Activity append      │
│ Content pipeline │  │ Morning Brief        │
└──────────────────┘  └──────────────────────┘
       │
       ▼
┌──────────────────┐
│   ANTFARM        │
│   CI/CD LAYER    │
│                  │
│ feature-dev      │
│ bug-fix          │
│ security-audit   │
│ Custom workflows │
│ Deterministic    │
│ step enforcement │
│ Context piping   │
│ Verification     │
│ gates            │
└──────────────────┘
```

---

### What Each Layer Owns

**Paperclip — company OS, persistent, relational**

| Domain | What lives here |
|---|---|
| Agent roster | Org chart, roles, budgets, relationships |
| Agent activity | Audit log, tool-call tracing, decisions |
| Tasks | Full ticket system, goal ancestry, delegation |
| Clients | One Paperclip company per client — complete isolation |
| Content pipeline | Content project + task cards |
| Trade history | Append-only completed trade log |
| P2P history | Completed P2P trade log |
| Deploy history | Append-only deploy log |
| Budgets | Monthly token cap per agent — enforced automatically |

**Convex — real-time, reactive, live state**

| Domain | What lives here |
|---|---|
| Agent heartbeat | Live status, last seen, actions today — pushed every 15 min |
| Trading positions | Open positions, live PnL, risk state — 5s refresh |
| P2P spread | Live NGN/USDT spread + active orders |
| Bybit balances | Live wallet state |
| Site uptime | Live status pings (history in Paperclip) |
| Alerts | Push feed, acknowledge mutations |
| Activity feed | Live append — powers Team Overview feed |
| Morning Brief | Assembled from all live Convex sources |

**OpenClaw Gateway — agent communication**

| Domain | What lives here |
|---|---|
| Agent chat | WebSocket relay between FORGE UI and agent sessions |
| Broadcast | System-wide directives to all agents |
| Session context | Per-agent conversation history and state |
| Auth | Token-based gateway authentication |

**Antfarm — CI/CD for agents**

| Workflow | Steps | Trigger |
|---|---|---|
| feature-dev | plan → setup → implement → verify → test → PR → review | MIGUEL assigns |
| bug-fix | triage → investigate → setup → fix → verify → PR | On bug ticket |
| security-audit | scan → prioritize → setup → fix → verify → test → PR | Scheduled |
| Custom | Define in YAML | Any |

Antfarm runs as a background daemon. Context pipes between steps. Verification gates are mandatory — a step cannot proceed until the previous one outputs the expected schema. Failed steps retry automatically. Terminal state (success or blocked) surfaces to MIGUEL.

**React Query — client caching**
In front of both Paperclip Aggregator and Convex. Handles stale-while-revalidate, per-domain refetch intervals, and optimistic updates.

---

### The Aggregator Layer — What Gets Built

Custom `/forge/*` controllers added to the Paperclip backend. This is the only significant new code in the integration.

```
GET  /forge/overview-state    Full OverviewState object
                              React Query polls every 10s
                              Combines: agent status, tasks,
                              incidents, budget health,
                              goal progress

GET  /forge/team-state        Agent roster + live status
                              Maps Paperclip org → Agent type
                              Powers Team Overview page

GET  /forge/task-state        Active tickets in FORGE format
                              Powers Tasks + Morning Brief

GET  /forge/budget-state      Per-agent token usage vs cap
                              Powers cost panel in Team Overview

GET  /forge/audit-log         Recent tool-call traces
                              Powers Activity feed

POST /forge/agent/:id/heartbeat  Called by OpenClaw on session end
                                 Upserts live status into Paperclip
```

**Convex endpoints (separate process):**

```
convex/agents.ts     — upsertHeartbeat, listLiveStatus
convex/trading.ts    — getOpenPositions, getPnL, getOrders
convex/p2p.ts        — getSpread, getActiveOrders
convex/sites.ts      — pingUptime, getLiveStatus
convex/alerts.ts     — pushAlert, acknowledgeAlert
convex/activity.ts   — appendActivity, getRecent
convex/money.ts      — getBybitBalances
```

Live external data always flows:
**External API → Convex function → frontend**
Never directly from the browser.

---

### Paperclip Company Structure

```
Company: NUVUE / FORGE CORE
  Mission: Run iCHRIS's full-stack personal
           and professional operations

  Departments:
    Coordination     MIGUEL
    Design & QA      VAEL, TESTER
    Engineering      KERN, Cursor agent
    Trading          EDGE
    P2P Operations   BRIDGE
    Pipeline         feature-dev fleet
                     (or Cursor-replaced)

  Agent budgets: set monthly token cap per agent
  Goal hierarchy: Mission → Project → Task
                  every ticket carries its WHY
```

Each nuvue.studio client gets their own Paperclip company — complete data isolation, separate goal hierarchy, separate budget.

---

### Data Source Pattern

Each page data file uses two flags:

```typescript
const USE_PAPERCLIP_MOCK = true;  // flip when Aggregator endpoint is live
const USE_CONVEX_MOCK    = true;  // flip when Convex function is live

// Pages with no real-time data only need USE_PAPERCLIP_MOCK
// Pages with no Paperclip data only need USE_CONVEX_MOCK
```

**PENDING INTEGRATION** still applies for external APIs not yet wired (Bybit, uptime monitor). Honest label in UI, never a fake number.

---

### Three Data Tiers

**Tier 1 — Real, available via Paperclip immediately**
Agent roster, tasks, clients, content pipeline — register in Paperclip and it's live.

**Tier 2 — Real but needs external API → Convex + PENDING INTEGRATION**
Bybit positions, PnL, orders, balances, P2P spread, site uptime pings.

**Tier 3 — Derived → Convex assembles from live sources**
Morning Brief, risk state, heartbeat aggregate.

---

## Prompt Guide for AI Tools

### For VAEL (Design Agent)
Source of truth: FORGE × NUVUE v2 token system in `src/index.css`.
Design the PENDING INTEGRATION component first — used on every external API page.
Audit Team Overview before any other page is built.
Existing built pages: audit only, no redesign without iCHRIS instruction.
Stub pages: full layout spec required before KERN or Cursor touches them.

### For KERN (Dev Agent)
Source of truth: this PRD + `src/lib/teamData.ts` as the data layer template.
You are the technical lead. Cursor is the execution engine.
You architect, review, validate domain schemas, resolve conflicts.
You do not write code directly unless judgment is required in the moment.
Dual mock flags per data file (`USE_PAPERCLIP_MOCK` / `USE_CONVEX_MOCK`).
PENDING INTEGRATION for any unconnected external API section.
`tsc --noEmit` zero errors before any page is marked done.

### For Cursor (Execution Agent)
Registered in Paperclip under Engineering department.
Picks up tickets assigned by KERN or MIGUEL.
Full IDE context — file tree, imports, types all visible.
Enforces FORGE design system rules on every file touched:
  - No lucide-react imports
  - No raw hex in Tailwind classes
  - No pure white (#ffffff) text
  - JetBrains Mono on all data values
  - Only use components from `src/components/ui/` — the FORGE UI library
  - If a component doesn't exist in the library, build it using design system tokens
Run `tsc --noEmit` after every change. Never commit with errors.

### For EDGE (Futures Agent)
Review Trading Ops Convex schema before KERN or Cursor wires it.
Verify: Bybit field names, PnL attribution, risk guardrail types, order lifecycle.
Live trading data flows: Bybit API → Convex function → frontend. Never browser-direct.
Drop validated schema to `forge-memory/playbooks/` before build starts.

### For BRIDGE (P2P Agent)
Review P2P Markets Convex schema before KERN or Cursor wires it.
Verify: spread structure, ad schema, order states, NGN/USDT rate fields.
Live P2P data flows: Bybit P2P API → Convex function → frontend.
**Access boundary:** Read payment status only. Trigger release or mark-paid. Nothing else.
Drop validated schema to `forge-memory/playbooks/` before build starts.

### For MIGUEL (Orchestrator)
Source of truth: this PRD v1.4.
Immediate tasks:
1. Install Paperclip — `npx paperclipai onboard --yes`
2. Register NUVUE / FORGE CORE company + all agents with budgets
3. Restore Antfarm — clone snarktank/antfarm, build, run clean test
4. Build OpenClaw heartbeat targeting `convex/agents.ts upsertHeartbeat`
5. Assign Aggregator Layer build to KERN via Paperclip ticket
6. Verify OpenClaw Gateway is running on `ws://localhost:18789`
Route all blockers from KERN and Cursor through yourself before escalating to iCHRIS.
Self-improvement authority: approve team requests within policy, log in morning digest.

### For Antfarm
Feature-dev workflow: `plan → setup → implement → verify → test → PR → review`
Each step receives a context.json from the previous step.
Verification gates are mandatory — no step skips.
Failed steps retry automatically. Terminal state surfaces to MIGUEL via Telegram.
Custom workflows can be defined in YAML for FORGE-specific pipelines.

---

## Definition of Done

A page is complete when:
- [ ] All components use FORGE × NUVUE v2 tokens — zero raw hex
- [ ] All icons are Solar Bold Duotone via ForgeIcon — zero lucide imports
- [ ] All UI built from `src/components/ui/` library or design system tokens
- [ ] Data file exists at `src/lib/[page]Data.ts` with correct mock flags
- [ ] Paperclip Aggregator endpoint exists for this page's domain data
- [ ] Convex function exists for any real-time section on this page
- [ ] External API sections show PENDING INTEGRATION — not fake numbers
- [ ] Loading, error, empty, and PENDING INTEGRATION states all render
- [ ] No TypeScript errors (`tsc --noEmit` passes clean)
- [ ] No console errors in development
- [ ] All interactive actions work
- [ ] Responsive on mobile
- [ ] KERN has reviewed Cursor's output before merge
- [ ] VAEL has audited for design system compliance

The full dashboard is done when all 10 pages pass the above, Team Overview reflects live agent topology from Paperclip + Convex, chat is wired to OpenClaw Gateway, and Bybit is wired through Convex for Trading and P2P.

---

## Priority Build Order

| # | Page | Route | Paperclip | Convex | Gateway |
|---|---|---|---|---|---|
| 1 | **Team Overview** | `/bots` | Aggregator team-state | Heartbeat + activity | Chat wiring |
| 2 | Morning Brief | `/` | Tasks + alerts | Live assembly | — |
| 3 | Tasks | `/tasks` | Full ticket system | — | — |
| 4 | Clients | `/clients` | Multi-company | — | — |
| 5 | Trading Ops | `/trading` | Trade history | Live positions + PnL | — |
| 6 | P2P Markets | `/p2p` | P2P history | Live spread + orders | — |
| 7 | Money | `/money` | Invoices | Live balances | — |
| 8 | Sites | `/sites` | Metadata + deploy log | Live uptime pings | — |
| 9 | Content | `/content` | Content pipeline | — | — |
| 10 | Settings | `/settings` | Config | — | — |

---

## End-to-End Implementation Plan

### Phase 0: Foundation ✅ COMPLETE

**Who: Cursor**

| Deliverable | Status |
|---|---|
| `tsc --noEmit` = 0 errors | ✅ |
| PRD v1.4 committed to repo | ✅ |
| All 10 page stubs with FORGE UI library components | ✅ |
| 9 data files with `USE_PAPERCLIP_MOCK` / `USE_CONVEX_MOCK` flags | ✅ |
| Paperclip, Convex, React Query clients scaffolded | ✅ |
| NeuralCommandMap with Map / Roster / Chat views | ✅ |
| Zero `lucide-react`, zero raw hex, all ForgeIcon | ✅ |
| All UI from `src/components/ui/` library | ✅ |

---

### Phase 1: Paperclip Onboarding

**Who: MIGUEL (orchestrator) — iCHRIS kicks off initial command**

| Step | Action | Output |
|---|---|---|
| 1a | `npx paperclipai onboard --yes` | Paperclip instance running |
| 1b | Register company: NUVUE / FORGE CORE | Company ID in `.env.local` |
| 1c | Add all 12 agents with roles + monthly budgets | Org chart populated |
| 1d | Register **Cursor** as agent under Engineering dept | Cursor receives Paperclip tickets |
| 1e | Confirm heartbeat firing per agent | `/forge/agent/:id/heartbeat` works |

**iCHRIS action:** Run the onboard command, get company ID, set `VITE_PAPERCLIP_API_URL` and `VITE_PAPERCLIP_COMPANY_ID` in `.env.local`.

---

### Phase 2: Antfarm Restore

**Who: MIGUEL**

| Step | Action | Output |
|---|---|---|
| 2a | Clone `snarktank/antfarm` into workspace | Repo local |
| 2b | `npm install && npm run build` | Clean build |
| 2c | Run one clean `feature-dev` pipeline end to end | Terminal state reaches MIGUEL |
| 2d | Confirm pipeline agents report back | 6 pipeline agents status → healthy |

**Depends on:** Phase 1 complete (agents registered in Paperclip).

---

### Phase 3: Convex Setup + OpenClaw Gateway

**Who: MIGUEL (Convex setup via CLI) + KERN (architect) + Cursor (execution, optionally via Convex MCP)**

MIGUEL has direct Convex CLI access and handles provisioning. Cursor can also interact with Convex via MCP if configured in Cursor IDE.

| Step | Action | Who | Output |
|---|---|---|---|
| 3a | `npx convex dev` — init project, get deployment URL | MIGUEL | Convex dashboard live, `VITE_CONVEX_URL` ready |
| 3b | Build `convex/agents.ts` (upsertHeartbeat, listLiveStatus) | MIGUEL / Cursor | Heartbeat schema deployed |
| 3c | Wire `src/lib/teamData.ts` → Convex heartbeat | Cursor | Team Overview shows live status |
| 3d | Flip `USE_CONVEX_MOCK = false` in `teamData.ts` | Cursor | Real agent heartbeats rendering |
| 3e | Build `src/lib/openclawGateway.ts` — WebSocket client | Cursor | Gateway connection module |
| 3f | Wire chat in `NeuralCommandMap.tsx` → gateway (replace setTimeout mock) | Cursor | Chat sends/receives real messages |
| 3g | **KERN reviews** all Convex schemas + gateway client | KERN | Approved or revision requested |

**MIGUEL action:** Provide `VITE_CONVEX_URL` after init. Confirm gateway is running on `ws://localhost:18789`.
**Optional iCHRIS action:** Set up Convex MCP in Cursor for direct Cursor ↔ Convex interaction.

---

### Phase 4: Aggregator Layer

**Who: KERN (architect) + Cursor (execution)**

| Step | Action | Who | Output |
|---|---|---|---|
| 4a | Add `/forge/*` route namespace to Paperclip | Cursor | Routes registered |
| 4b | Build `GET /forge/team-state` | Cursor | Maps Paperclip org → Agent type |
| 4c | Wire `teamData.ts` → `/forge/team-state` | Cursor | `USE_PAPERCLIP_MOCK = false` |
| 4d | Build `GET /forge/overview-state` | Cursor | Full OverviewState object |
| 4e | Build `GET /forge/task-state` | Cursor | Task tickets in FORGE format |
| 4f | Build `GET /forge/budget-state` | Cursor | Per-agent token usage vs cap |
| 4g | Build `GET /forge/audit-log` | Cursor | Recent tool-call traces |
| 4h | **KERN reviews** all aggregator endpoints | KERN | Approved |

**Depends on:** Phase 1 (Paperclip running with data).

---

### Phase 5: Page-by-Page Build

**Who: KERN (tech lead) + VAEL (design audit) + Cursor (execution)**

Each page follows the same cycle:
1. **VAEL** specs the full layout (if not already in PRD)
2. **Cursor** builds the page using FORGE UI library components only
3. **Cursor** wires the data file to Aggregator/Convex
4. **Cursor** flips `USE_PAPERCLIP_MOCK = false`
5. **KERN** reviews code output
6. **VAEL** audits design system compliance
7. **Cursor** runs `tsc --noEmit`, fixes any issues

| Order | Page | Paperclip endpoint | Convex function | Agents involved |
|---|---|---|---|---|
| 5.1 | **Team Overview** `/bots` | `/forge/team-state` | `agents.listLiveStatus` | KERN, VAEL, Cursor |
| 5.2 | **Morning Brief** `/` | `/forge/overview-state` | Morning Brief assembly | KERN, VAEL, Cursor |
| 5.3 | **Tasks** `/tasks` | `/forge/task-state` | — | KERN, Cursor |
| 5.4 | **Clients** `/clients` | Multi-company query | — | KERN, Cursor |
| 5.5 | **Trading Ops** `/trading` | Trade history | `trading.getOpenPositions` | KERN, **EDGE**, Cursor |
| 5.6 | **P2P Markets** `/p2p` | P2P history | `p2p.getSpread` | KERN, **BRIDGE**, Cursor |
| 5.7 | **Money** `/money` | Invoices | `money.getBybitBalances` | KERN, Cursor |
| 5.8 | **Sites** `/sites` | Metadata + deploy log | `sites.getLiveStatus` | KERN, Cursor |
| 5.9 | **Content** `/content` | Content pipeline | — | KERN, VAEL, Cursor |
| 5.10 | **Settings** `/settings` | Config | — | Cursor |

---

### Phase 6: Bybit Wiring (Trading + P2P go live)

**Who: EDGE + BRIDGE (schema validation) + KERN (architecture) + Cursor (execution)**

| Step | Action | Who | Output |
|---|---|---|---|
| 6a | EDGE validates Trading Ops Convex schema | **EDGE** | Approved schema in `forge-memory/playbooks/` |
| 6b | BRIDGE validates P2P Markets Convex schema | **BRIDGE** | Approved schema in `forge-memory/playbooks/` |
| 6c | Build `convex/trading.ts` (getOpenPositions, getPnL, getOrders) | Cursor | Deployed to Convex |
| 6d | Build `convex/p2p.ts` (getSpread, getActiveOrders) | Cursor | Deployed to Convex |
| 6e | Build `convex/money.ts` (getBybitBalances) | Cursor | Deployed to Convex |
| 6f | Wire Trading data file → Convex, flip `USE_CONVEX_MOCK = false` | Cursor | Live positions rendering |
| 6g | Wire P2P data file → Convex, flip `USE_CONVEX_MOCK = false` | Cursor | Live spread rendering |
| 6h | **KERN reviews** all Convex functions | KERN | Approved |
| 6i | **TESTER** runs smoke test across all pages | **TESTER** | Pass/fail report |

**iCHRIS action:** Provide Bybit API keys in `.env.local` (`VITE_BYBIT_API_KEY`, `VITE_BYBIT_API_SECRET`).

---

### Phase 7: QA + Polish

**Who: TESTER (QA gate) + VAEL (design) + KERN (final review)**

| Step | Action | Who |
|---|---|---|
| 7a | Full smoke test: all 10 pages, all states (loading/error/empty/live) | **TESTER** |
| 7b | Design system audit: zero raw hex, all ForgeIcon, responsive | **VAEL** |
| 7c | `tsc --noEmit` final pass | Cursor |
| 7d | Console error sweep | Cursor |
| 7e | KERN signs off | **KERN** |
| 7f | MIGUEL compiles completion report for iCHRIS | **MIGUEL** |

---

### Agent Involvement Summary

| Agent | Phases | Role |
|---|---|---|
| **iCHRIS** | 1, 6 | Runs Paperclip onboard, provides Bybit API keys, optional Convex MCP setup |
| **MIGUEL** | 1, 2, 3, 7 | Paperclip setup, Antfarm restore, Convex provisioning, final report |
| **KERN** | 3, 4, 5, 6 | Tech lead — architects schemas, reviews all code |
| **VAEL** | 5, 7 | Design specs for each page, DS compliance audits |
| **EDGE** | 6 | Validates Trading Ops Convex schema |
| **BRIDGE** | 6 | Validates P2P Markets Convex schema |
| **TESTER** | 6, 7 | Smoke tests, pass/fail gate |
| **Cursor** | 0–7 | Execution engine — writes all code, runs type checks |
| **Pipeline agents** | 2 | Resume via Antfarm, report to MIGUEL |

### What iCHRIS Needs to Provide

| Item | When | Where |
|---|---|---|
| Run `npx paperclipai onboard --yes` | Phase 1 start | Terminal |
| `VITE_PAPERCLIP_API_URL` + `VITE_PAPERCLIP_COMPANY_ID` | After Phase 1a | `.env.local` |
| `VITE_BYBIT_API_KEY` + `VITE_BYBIT_API_SECRET` | Phase 6 start | `.env.local` |
| (Optional) Convex MCP configured in Cursor | Phase 3 | Cursor settings |

Everything else is handled by the agent team + Cursor.

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | March 2026 | Initial PRD |
| 1.1 | March 2026 | Real agent data, neural map, MIGUEL added |
| 1.2 | March 2026 | Hybrid Supabase + Convex, PENDING INTEGRATION |
| 1.3 | March 2026 | Paperclip replaces Supabase, Antfarm confirmed, Cursor as agent |
| 1.4 | March 2026 | OpenClaw Gateway chat, Team Overview 3-view, implementation plan, UI library enforced |

---

*FORGE Command Center PRD v1.4*
*nuvue.studio / iCHRIS — March 2026*
*"Clarity through intentional design."*
