"use client";

import { LearnerStorePlaybackPositionRepository } from "@/adapters/persistence/learner-store/learner-store-playback-position-repository/learner-store-playback-position-repository";
import { recordPlaybackPositionAction } from "@/app/[locale]/learner-actions";
import type { LessonId } from "@/domain/entities/ids/ids";
import { PlaybackPosition } from "@/domain/ports/playback-position-repository/playback-position";
import type { PlaybackPositionRepository } from "@/domain/ports/playback-position-repository/playback-position-repository";
import { makeGetPlaybackPosition } from "@/domain/use-cases/get-playback-position/get-playback-position";

import { useMemo } from "react";

/** Where the page-hide beacon delivers the last position of a visit. */
const PLAYBACK_BEACON_URL = "/api/learner/playback-position";

/**
 * The one browser adapter every lesson shares: its write windows are per
 * lesson, and the learner store behind it is shared by the whole tab.
 */
const learnerPositions = new LearnerStorePlaybackPositionRepository({
  record: async (lessonId, seconds) =>
    (await recordPlaybackPositionAction({ lessonId, seconds }))?.data?.recorded === true,
  beacon: (position) => navigator.sendBeacon(PLAYBACK_BEACON_URL, JSON.stringify(position)),
});

/**
 * A playback port that can also send positions still waiting for their
 * server window — the default adapter, or a test's recording fake.
 *
 * @category Hooks
 */
export type FlushablePlaybackPositions = PlaybackPositionRepository & {
  flush?: () => Promise<void>;
  flushWithBeacon?: () => void;
};

/**
 * What {@link usePlaybackPosition} hands its caller.
 *
 * @category Hooks
 */
export type PlaybackPositionHandle = {
  /** The saved seconds for the lesson, or `null` when none is saved. */
  get: () => Promise<number | null>;
  /** Saves a position; resolves `false` when the value is not a valid position. */
  set: (seconds: number) => Promise<boolean>;
  /** Writes any position still waiting for its server window, now. */
  flush: () => Promise<void>;
  /** Hands any waiting position to `navigator.sendBeacon`, for a page being hidden. */
  flushWithBeacon: () => void;
};

/**
 * Client hook: reads and writes the playback position for one lesson.
 *
 * @remarks
 * This hook is the client's composition root for playback persistence — the
 * one place allowed to name a concrete adapter, the same role the learner
 * dependencies play on the server. Everything downstream of it sees only the
 * `PlaybackPositionRepository` port.
 *
 * The default adapter shows every position at once on every progress bar
 * (through the learner store) and saves it for the signed-in learner at most
 * every ten seconds per lesson; `flush` and `flushWithBeacon` send what is
 * still waiting. Writes are validated by the `PlaybackPosition` value object
 * first: a `<video>` detached mid-teardown reports `NaN` for `currentTime`,
 * and that must never be saved.
 *
 * Reads go through the `getPlaybackPosition` use case rather than calling the
 * adapter, so the domain owns the "no entry yet" semantics.
 *
 * The returned object is memoized on the lesson, so consumers can list it in
 * a `useEffect` dependency array without retriggering on every render.
 *
 * Browser-side only — do NOT call from a Server Component or Server Action.
 *
 * @param lessonId - The lesson whose position is being tracked
 * @param repository - Overrides the adapter; tests inject a fake here. A port
 *                     without flush methods has nothing to flush.
 * @returns `get`, `set`, `flush` and `flushWithBeacon`
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
  repository?: FlushablePlaybackPositions,
): PlaybackPositionHandle {
  return useMemo(() => {
    const positions: FlushablePlaybackPositions = repository ?? learnerPositions;
    const getPlaybackPosition = makeGetPlaybackPosition({ positions });

    return {
      get: async () => {
        const result = await getPlaybackPosition({ lessonId });
        return result.isOk() ? result.value.seconds : null;
      },
      set: async (seconds: number) => {
        const position = PlaybackPosition.safeParse({ lessonId, seconds });
        if (!position.success) return false;
        await positions.setPosition(position.data.lessonId, position.data.seconds);
        return true;
      },
      flush: async () => {
        await positions.flush?.();
      },
      flushWithBeacon: () => {
        positions.flushWithBeacon?.();
      },
    };
  }, [repository, lessonId]);
}
