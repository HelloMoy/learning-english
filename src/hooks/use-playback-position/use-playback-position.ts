"use client";

import { BrowserLocalStoragePlaybackPositionRepository } from "@/adapters/persistence/browser-local-storage/browser-local-storage-playback-position-repository/browser-local-storage-playback-position-repository";
import type { LessonId } from "@/domain/entities/ids/ids";

import { useMemo } from "react";

/**
 * Client hook: thin facade over `BrowserLocalStoragePlaybackPositionRepository`,
 * bound to a single `lessonId`. The returned object is memoized on
 * `lessonId`, so consumers can safely include it in `useEffect` dependency
 * arrays without retriggering the effect on every render. The underlying
 * adapter is also memoized — no per-render construction, no per-render
 * I/O.
 *
 * Browser-side only — do NOT call from a Server Component or Server Action.
 *
 * @example
 * ```ts
 * const position = usePlaybackPosition(lessonId);
 *
 * // Save the latest position (e.g. inside a debounced timeupdate handler).
 * await position.set(videoRef.current.currentTime);
 *
 * // Read on mount to seek the player.
 * const saved = await position.get();
 * ```
 */
export function usePlaybackPosition(lessonId: LessonId): {
  get: () => Promise<number | null>;
  set: (seconds: number) => Promise<void>;
} {
  // The adapter is stateless and keyed per call, so one instance serves
  // every lesson — it does not need rebuilding when `lessonId` changes.
  const adapter = useMemo(() => new BrowserLocalStoragePlaybackPositionRepository(), []);

  // Memoize the returned facade so `position` has stable identity across
  // renders. Consumers (e.g. `PlaybackPositionedVideoPlayer`) can list
  // it in a `useEffect` dependency array without retriggering the effect
  // on every render.
  return useMemo(
    () => ({
      get: () => adapter.getPosition(lessonId),
      set: (seconds: number) => adapter.setPosition(lessonId, seconds),
    }),
    [adapter, lessonId],
  );
}
