# FORGE

Mission-critical operations dashboard for multi-domain system monitoring and incident response.

## Overview Page — Architecture & Data Flow

### Layout Zones
The application is divided into four primary zones:
1. **Global Health Strip**: A fixed top bar providing immediate system-wide status, mode indicators, and global filters.
2. **Incident Banner**: A conditional notification area that appears below the health strip when active incidents are detected, ensuring they are the first thing an operator sees.
3. **Domain Navigation Rail**: A sticky left sidebar for quick context switching between different operational domains (Trading, Web, Deployments, etc.).
4. **FORGE Operations Center**: The main grid containing 6 high-density operational cards and a right rail for priority alerts and the action queue.

### Component Hierarchy
- `App.tsx`: Root component managing global state and layout assembly.
- `HealthStrip`, `IncidentBanner`, `DomainNav`: Layout-level structural components.
- `StatusCard`: A base wrapper component for all operational cards, enforcing the FORGE design system's state requirements (Loading, Error, Stale, Empty).
- `SystemHealthCard`, `TradingSnapshotCard`, etc.: Domain-specific cards that consume the `OverviewState`.
- `PriorityAlertsPanel`, `ActionQueuePanel`: Right-rail panels for task-oriented operations.

### Data Flow
- **Backend**: An Express server (`server.ts`) serves a single `GET /api/overview-state` endpoint.
- **Validation**: Data is validated on both the server and client using **Zod** to ensure strict adherence to the operational contract.
- **State Management**: **React Query** handles data fetching, caching, and automatic background refetching (every 10s) to maintain freshness.
- **Staleness Handling**: Each card calculates its own staleness based on the `generatedAt` timestamp and domain-specific SLAs, visually flagging data that is no longer "live".

### Adding a New Domain Card
1. Define the new domain's data structure in `src/types.ts`.
2. Update the mock data generator in `server.ts` to include the new domain data.
3. Create a new component in `src/components/cards/` using the `StatusCard` base.
4. Add the new card to the grid in `src/App.tsx`.
5. Add the domain to the `DomainNav` items list.
