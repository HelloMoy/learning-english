"use client";

import type { ContinueWatchingRecord } from "@/domain/entities/continue-watching-record/continue-watching-record";
import { learnerStore } from "@/lib/learner-store/learner-store";

import { useSyncExternalStore } from "react";

/** Stable empty snapshot, for the same identity reason as every store hook. */
const EMPTY: ReadonlyArray<ContinueWatchingRecord> = [];

function continueWatchingByCourse(): ReadonlyArray<ContinueWatchingRecord> {
  return learnerStore.getState().continueWatching;
}

/**
 * The snapshot the server renders with: always empty, so the first client
 * render agrees with it.
 *
 * @returns A stable empty array
 */
export function continueWatchingByCourseServerSnapshot(): ReadonlyArray<ContinueWatchingRecord> {
  return EMPTY;
}

/**
 * Where the signed-in learner was in each course they have opened.
 *
 * @remarks
 * One record per course, the most recently watched first, each with the time
 * it was last written — enough to lead with the last course watched and to
 * say how long ago that was. Browser-side only.
 *
 * @returns The learner's places, empty before hydration
 */
export function useContinueWatchingByCourse(): ReadonlyArray<ContinueWatchingRecord> {
  return useSyncExternalStore(
    learnerStore.subscribe,
    continueWatchingByCourse,
    continueWatchingByCourseServerSnapshot,
  );
}
