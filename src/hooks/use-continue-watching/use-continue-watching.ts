"use client";

import { BrowserLocalStorageContinueWatchingRepository } from "@/adapters/persistence/browser-local-storage/browser-local-storage-continue-watching-repository/browser-local-storage-continue-watching-repository";
import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";

import { useMemo } from "react";

/**
 * Client hook: reads and writes the one location the learner was last at.
 *
 * @remarks
 * This hook is the client's composition root for the continue-watching
 * record — the one place allowed to name a concrete adapter, the same role
 * {@link usePlaybackPosition} plays for playback and
 * `getCoursePlatformDeps` plays on the server. Everything downstream of it
 * sees only the `ContinueWatchingRepository` port.
 *
 * Writes are validated by the `ContinueWatchingLocation` value object first,
 * so a route triple assembled from a malformed URL segment can never reach
 * storage. A rejected write reports `false` rather than throwing: failing to
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
 * @param repository - Overrides the storage adapter; tests inject a fake here
 *                     instead of monkey-patching `window.localStorage`
 * @returns `get` resolving to the stored location (or `null`), and `set`
 *          resolving to whether the value passed validation and persisted
 */
export function useContinueWatching(repository?: ContinueWatchingRepository): {
  get: () => Promise<ContinueWatchingLocation | null>;
  set: (location: unknown) => Promise<boolean>;
} {
  // The adapter is stateless and holds a single slot, so one instance serves
  // every caller and never needs rebuilding.
  const locations = useMemo(
    () => repository ?? new BrowserLocalStorageContinueWatchingRepository(),
    [repository],
  );

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
