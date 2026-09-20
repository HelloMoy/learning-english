"use client";

import { claimPrizeAction } from "@/app/[locale]/learner-actions";
import { learnerStore, writeThrough } from "@/lib/learner-store/learner-store";

import { useSyncExternalStore } from "react";

/**
 * Stable empty snapshot. `useSyncExternalStore` compares by identity, so
 * returning a fresh `Set` on each server render would loop.
 */
const EMPTY: ReadonlySet<string> = new Set();

function claimedPrizes(): ReadonlySet<string> {
  return learnerStore.getState().claimedPrizes;
}

/**
 * The snapshot the server renders with: always empty.
 *
 * @remarks
 * The server renders no learner state, so it must render no claims — and the
 * first client render has to agree, or React reports a hydration mismatch.
 *
 * @returns A stable empty set
 */
export function claimedPrizesServerSnapshot(): ReadonlySet<string> {
  return EMPTY;
}

/**
 * Every prize the signed-in learner has claimed, as one snapshot of module slugs.
 *
 * @remarks
 * Claiming is an act, not a consequence of completion, so it is the one thing
 * about a prize that has to be stored. A claimed prize stays claimed: the
 * tickets were exchanged for it.
 *
 * Module slugs rather than ids, for the reason the prize catalog uses them —
 * they are stable, readable in devtools, and already the prize's identity.
 *
 * Browser-side only — do NOT call from a Server Component.
 *
 * @returns A stable set of module slugs; empty before hydration
 */
export function useClaimedPrizes(): ReadonlySet<string> {
  return useSyncExternalStore(learnerStore.subscribe, claimedPrizes, claimedPrizesServerSnapshot);
}

/**
 * Records that the learner claimed a module's prize, and tells every surface.
 *
 * @remarks
 * Idempotent: claiming an already claimed prize writes nothing and notifies no
 * one. The counter calls it the moment the control is activated, before the
 * reveal plays, so closing the dialog early still leaves the prize claimed.
 *
 * @param moduleSlug - The module whose prize was claimed
 */
export function claimPrize(moduleSlug: string): void {
  if (claimedPrizes().has(moduleSlug)) return;
  void writeThrough(
    (state) => ({ claimedPrizes: new Set(state.claimedPrizes).add(moduleSlug) }),
    async () => (await claimPrizeAction({ moduleSlug }))?.data?.claimed === true,
  );
}
