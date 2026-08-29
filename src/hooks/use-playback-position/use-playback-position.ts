"use client";

import { BrowserLocalStoragePlaybackPositionRepository } from "@/adapters/persistence/browser-local-storage/browser-local-storage-playback-position-repository/browser-local-storage-playback-position-repository";
import type { LessonId } from "@/domain/entities/ids/ids";
import { PlaybackPosition } from "@/domain/ports/playback-position-repository/playback-position";
import type { PlaybackPositionRepository } from "@/domain/ports/playback-position-repository/playback-position-repository";
import { makeGetPlaybackPosition } from "@/domain/use-cases/get-playback-position/get-playback-position";

import { useMemo } from "react";

/**
 * Client hook: reads and writes the playback position for one lesson.
 *
 * @remarks
 * This hook is the client's composition root for playback persistence — the
 * one place allowed to name a concrete adapter, the same role
 * `getCoursePlatformDeps` plays on the server. Everything downstream of it
 * sees only the `PlaybackPositionRepository` port.
 *
 * Reads go through the `getPlaybackPosition` use case rather than calling
 * the adapter, so the domain owns the "no entry yet" semantics. Writes are
 * validated by the `PlaybackPosition` value object first: a `<video>` that
 * has been detached mid-teardown reports `NaN` for `currentTime`, and that
 * must never reach storage.
 *
 * Writes deliberately do **not** run `recordPlaybackPosition`. That use case
 * checks the lesson exists via `LessonRepository`, which has no browser-side
 * implementation — reaching it needs the Server Action path, which is where
 * this moves when per-user sync arrives with auth.
 *
 * The returned object is memoized on the lesson, so consumers can list it in
 * a `useEffect` dependency array without retriggering on every render.
 *
 * Browser-side only — do NOT call from a Server Component or Server Action.
 *
 * @param lessonId - The lesson whose position is being tracked
 * @param repository - Overrides the storage adapter; tests inject a fake here
 *                     instead of monkey-patching `window.localStorage`
 * @returns `get` resolving to the saved seconds (or `null`), and `set`
 *          resolving to whether the value passed validation and persisted
 *
 * @example
 * ```ts
 * const position = usePlaybackPosition(lessonId);
 *
 * const saved = await position.get(); // seek the player to this
 * await position.set(videoRef.current.currentTime);
 * ```
 */
export function usePlaybackPosition(
  lessonId: LessonId,
  repository?: PlaybackPositionRepository,
): {
  get: () => Promise<number | null>;
  set: (seconds: number) => Promise<boolean>;
} {
  // The adapter is stateless and keyed per call, so one instance serves every
  // lesson — it does not need rebuilding when `lessonId` changes.
  const positions = useMemo(
    () => repository ?? new BrowserLocalStoragePlaybackPositionRepository(),
    [repository],
  );

  return useMemo(() => {
    const getPlaybackPosition = makeGetPlaybackPosition({ positions });

    return {
      get: async () => {
        const result = await getPlaybackPosition({ lessonId });
        return result.isOk() ? result.value.seconds : null;
      },
      set: async (seconds: number) => {
        const position = PlaybackPosition.safeParse({ lessonId, seconds });
        if (!position.success) {
          return false;
        }
        await positions.setPosition(position.data.lessonId, position.data.seconds);
        return true;
      },
    };
  }, [positions, lessonId]);
}
