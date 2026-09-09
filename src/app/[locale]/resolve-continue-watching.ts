import type { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";

import { findContinueWatchingAction, type ContinueWatchingPanel } from "./actions";

/**
 * Turns a stored continue-watching location into the panel that describes it,
 * or `null` when there is nothing honest to render.
 *
 * @remarks
 * `next-safe-action` answers with `data`, `validationErrors` or `serverError`,
 * and every caller's response to all three failures is the same: render the
 * state that claims nothing. Collapsing them here keeps that envelope out of
 * the components and lets a test inject a plain function in its place.
 *
 * It lives beside the action rather than in `src/lib` because it is that
 * action's client-side counterpart, not a general-purpose utility.
 *
 * @param location - The identity the browser read from `localStorage`
 * @returns The resolved panel, or `null` for a stale record or any failure
 */
export async function resolveContinueWatchingPanel(
  location: ContinueWatchingLocation,
): Promise<ContinueWatchingPanel | null> {
  const result = await findContinueWatchingAction(location);
  return result?.data ?? null;
}

/**
 * The resolver's shape, so components can accept an override of it.
 *
 * @see resolveContinueWatchingPanel
 */
export type ResolveContinueWatching = (
  location: ContinueWatchingLocation,
) => Promise<ContinueWatchingPanel | null>;
