"use client";

import type { LessonId } from "@/domain/entities/ids/ids";
import { markLessonComplete } from "@/hooks/use-lesson-completion/use-lesson-completion";
import { hasFinishedWatching } from "@/lib/watch-progress/watch-progress";

import { useCallback, useEffect, useRef } from "react";

/**
 * What this hook reads from a player: where playback is, and how long the
 * lesson runs.
 *
 * @remarks
 * Structural rather than a Vidstack type, for the same reason as
 * `PositionedPlayer` — jsdom loads no media provider, so a real player
 * reports `0` forever and could never demonstrate that a finished lesson was
 * marked.
 */
export type WatchedPlayer = {
  readonly currentTime: number;
  readonly duration: number;
};

/**
 * What the player binds to its lifecycle callbacks.
 */
export type WatchedCompletion = {
  /** Bind to `play`, beside the position hook's write gate. */
  handlePlaybackStarted: () => void;
  /** Bind to `time-update` and `ended`. */
  handleProgress: () => void;
};

/**
 * Marks a lesson complete once the learner has watched it to the end.
 *
 * @remarks
 * The finish rule itself lives in `hasFinishedWatching`; this hook is the
 * part that has to know *when* it is fair to act on it. Two refs carry that:
 *
 * - A gate, closed until playback begins. Opening a lesson whose stored
 *   position is already past the threshold fires `time-update` at that
 *   position, and writing then would record a completion the learner did not
 *   earn on this visit. The lesson already reads as complete from its
 *   position, so nothing is lost by waiting.
 * - A "written" flag. `time-update` fires several times a second, and the
 *   last fifteen seconds of a lesson would otherwise write the same mark
 *   fifty times.
 *
 * The write goes through `markLessonComplete` — the same path the manual
 * button uses — so there is one stored notion of "done" rather than two.
 * Completion is never withdrawn here: rewinding a finished lesson leaves the
 * mark standing.
 *
 * The lesson's own `durationSeconds` is preferred, and the provider's
 * reported duration is the fallback, so a lesson whose metadata is missing a
 * runtime can still be finished.
 *
 * @param lessonId - The lesson to mark
 * @param durationSeconds - The lesson's runtime; `0` defers to the player
 * @param player - Anything reporting a `currentTime` and a `duration`
 * @returns The two handlers a player binds to its lifecycle events
 */
export function useCompleteWhenWatched({
  lessonId,
  durationSeconds,
  player,
}: {
  lessonId: LessonId;
  durationSeconds: number;
  player: WatchedPlayer;
}): WatchedCompletion {
  // Refs, not state: the media listeners must observe both flips
  // immediately. As state, an `ended` arriving in the same tick as the
  // opening `play` would still run the listener closed over `false`.
  const hasPlaybackStartedRef = useRef(false);
  const hasMarkedRef = useRef(false);

  // The player is read at event time, never captured. Callers pass a fresh
  // handle each render, so closing over it would pin the callback to a stale
  // `currentTime`.
  const playerRef = useRef(player);
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  const handlePlaybackStarted = useCallback(() => {
    hasPlaybackStartedRef.current = true;
  }, []);

  const handleProgress = useCallback(() => {
    if (!hasPlaybackStartedRef.current || hasMarkedRef.current) return;
    const runtime = durationSeconds > 0 ? durationSeconds : playerRef.current.duration;
    if (!hasFinishedWatching(playerRef.current.currentTime, runtime)) return;
    hasMarkedRef.current = true;
    void markLessonComplete(lessonId);
  }, [durationSeconds, lessonId]);

  return { handlePlaybackStarted, handleProgress };
}
