/**
 * Convex client — real-time layer for FORGE Command Center.
 *
 * Owns all live-updating data: trading positions, P2P spread,
 * agent heartbeats, site uptime, alerts, and activity feed.
 */

import { ConvexReactClient } from 'convex/react';

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string | undefined;

export const convexClient = CONVEX_URL
  ? new ConvexReactClient(CONVEX_URL)
  : null;

export const isConvexConfigured = (): boolean => convexClient !== null;
