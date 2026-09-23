"use client";

import { earnTicketsAction } from "@/app/[locale]/learner-actions";
import { learnerStore, writeThrough } from "@/lib/learner-store/learner-store";

import { useSyncExternalStore } from "react";

/**
 * Stable empty snapshot. `useSyncExternalStore` compares by identity, so
 * returning a fresh `Set` on each server render would loop.
 */
const EMPTY: ReadonlySet<string> = new Set();

function earnedTickets(): ReadonlySet<string> {
  return learnerStore.getState().earnedTickets;
}

/**
 * The snapshot the server renders with: always empty.
 *
 * @remarks
 * The server renders no learner state, so it must render no tickets — and the
 * first client render has to agree, or React reports a hydration mismatch.
 * The learner's tickets arrive right after hydration, with the learner store.
 *
 * @returns A stable empty set
 */
export function earnedTicketsServerSnapshot(): ReadonlySet<string> {
  return EMPTY;
}

/**
 * Every ticket the signed-in learner has earned, as one snapshot of lesson ids.
 *
 * @remarks
 * A ticket is saved the first time its lesson counts as complete and is kept
 * from then on, which is what lets a learner un-mark a lesson without losing
 * what they earned. Completion itself stays in its own store, so the lesson
 * rows keep telling the truth about where the learner is now.
 *
 * Browser-side only — do NOT call from a Server Component.
 *
 * @returns A stable set of lesson ids; empty before hydration
 */
export function useEarnedTickets(): ReadonlySet<string> {
  return useSyncExternalStore(learnerStore.subscribe, earnedTickets, earnedTicketsServerSnapshot);
}

/**
 * Records a ticket for every lesson that has not earned one yet.
 *
 * @remarks
 * Idempotent and quiet: ids already held are skipped, and when nothing is new
 * nothing is sent and no subscriber is notified. Callers can therefore hand it
 * every complete lesson they know about on each render without looping.
 *
 * The tickets show at once and are saved for the learner in one request; a
 * refused save withdraws them.
 *
 * Deliberately not a hook — the lesson page calls it from an effect when it
 * sees a lesson become complete, and the Achievements page calls it for the
 * lessons that were complete before tickets were stored.
 *
 * @param lessonIds - The lessons whose tickets should be recorded
 */
export function earnTickets(lessonIds: ReadonlyArray<string>): void {
  const held = earnedTickets();
  const unearned = [...new Set(lessonIds)].filter((lessonId) => !held.has(lessonId));
  if (unearned.length === 0) return;
  void writeThrough(
    (state) => ({ earnedTickets: new Set([...state.earnedTickets, ...unearned]) }),
    async () => (await earnTicketsAction({ lessonIds: unearned }))?.data?.earned === true,
  );
}
