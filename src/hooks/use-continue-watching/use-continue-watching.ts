"use client";

import { LearnerStoreContinueWatchingRepository } from "@/adapters/persistence/learner-store/learner-store-continue-watching-repository/learner-store-continue-watching-repository";
import { recordContinueWatchingAction } from "@/app/[locale]/learner-actions";
import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";

import { useMemo } from "react";

/** The one browser adapter: a single slot, shared by every caller in the tab. */
const learnerLocations = new LearnerStoreContinueWatchingRepository({
  record: async (location) =>
    (await recordContinueWatchingAction(location))?.data?.recorded === true,
});

/**
 * Client hook: reads and writes the one location the learner was last at.
 *
 * @remarks
 * This hook is the client's composition root for the continue-watching
 * record — the one place allowed to name a concrete adapter, the same role
 * {@link usePlaybackPosition} plays for playback and the learner
 * dependencies play on the server. Everything downstream of it
 * sees only the `ContinueWatchingRepository` port.
 *
 * Writes are validated by the `ContinueWatchingLocation` value object first,
 * so a route triple assembled from a malformed URL segment is never saved. A rejected write reports `false` rather than throwing: failing to
 * remember where the learner was is not worth breaking the page they are on.
 *
 * Reads go straight to the port rather than through a use case. There is no
 * domain decision to make — an absent record and a corrupt one are both
 * simply "nothing to continue", which the adapter already collapses.
 *
 * The returned object is memoized on the repository, so consumers can list
 * it in a `useEffect` dependency array without re-recording on every render.
 *
 * Browser-side only — do NOT call from a Server Component or Server Action.
 *
 * @param repository - Overrides the adapter; tests inject a fake here
 * @returns `get` resolving to the stored location (or `null`), and `set`
 *          resolving to whether the value passed validation and persisted
 */
export function useContinueWatching(repository?: ContinueWatchingRepository): {
  get: () => Promise<ContinueWatchingLocation | null>;
  set: (location: unknown) => Promise<boolean>;
} {
  const locations = repository ?? learnerLocations;

  return useMemo(
    () => ({
      get: () => locations.get(),
      set: async (location: unknown) => {
        const parsed = ContinueWatchingLocation.safeParse(location);
        if (!parsed.success) {
          return false;
        }
        await locations.set(parsed.data);
        return true;
      },
    }),
    [locations],
  );
}
