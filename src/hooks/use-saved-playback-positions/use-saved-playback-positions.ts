"use client";

import { learnerStore } from "@/lib/learner-store/learner-store";

import { useSyncExternalStore } from "react";

/**
 * Stable empty snapshot. `useSyncExternalStore` compares by identity, so
 * returning a fresh `Map` on each server render would loop.
 */
const EMPTY: ReadonlyMap<string, number> = new Map();

function savedPositions(): ReadonlyMap<string, number> {
  return learnerStore.getState().positions;
}

/**
 * The snapshot the server renders with: always empty.
 *
 * @remarks
 * The server renders no watch progress, and the first client render must
 * agree, or React reports a hydration mismatch. The learner's positions
 * arrive right after hydration, when the learner store is seeded.
 *
 * @returns A stable empty map
 */
export function savedPlaybackPositionsServerSnapshot(): ReadonlyMap<string, number> {
  return EMPTY;
}

/**
 * Every playback position the signed-in learner has saved, keyed by lesson id.
 *
 * @remarks
 * One synchronous snapshot for a whole list: a module overview with thirty
 * rows reads it once rather than awaiting one promise per row. It is the same
 * map every surface reads, so a position written by the player reaches every
 * progress bar on the page without a reload.
 *
 * Browser-side only — do NOT call from a Server Component.
 *
 * @returns A stable map of lesson id to seconds; empty before hydration
 */
export function useSavedPlaybackPositions(): ReadonlyMap<string, number> {
  return useSyncExternalStore(
    learnerStore.subscribe,
    savedPositions,
    savedPlaybackPositionsServerSnapshot,
  );
}
