"use client";

import type { LessonId } from "@/domain/entities/ids/ids";
import { useLessonCompletion } from "@/hooks/use-lesson-completion/use-lesson-completion";
import { useSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import { countsAsComplete, watchedFraction } from "@/lib/watch-progress/watch-progress";

/**
 * How far the learner has got with one lesson.
 */
export type LessonWatchState = {
  /** Share of the runtime watched, in `[0, 1]`; `1` once the lesson is complete. */
  watchedFraction: number;
  /** Marked through the button, or watched to the end. */
  isComplete: boolean;
};

/**
 * The one rule for "how far is this learner through this lesson", read by
 * every surface that shows progress or completion.
 *
 * @remarks
 * Completion has two producers — the **Mark as complete** button and playback
 * crossing the finish threshold — and this hook is where they are combined.
 * Keeping the union in one place is what stops a row, an outline entry and a
 * module card from disagreeing about the same lesson.
 *
 * Deriving completion from the saved position, rather than reading only what
 * the tracker stored, is also what lights up positions saved before the
 * finish rule existed: no migration, no backfill write.
 *
 * A complete lesson reports a `watchedFraction` of `1` whatever its stored
 * position, so "finished" and "nearly finished" are never drawn identically.
 *
 * A lesson with no runtime — every reading lesson — has no watched fraction,
 * and its completion is whatever the tracker says.
 *
 * Browser-side only — do NOT call from a Server Component.
 *
 * @param lessonId - The lesson to report on
 * @param durationSeconds - The lesson's runtime; `0` for a lesson that has none
 * @returns The watched fraction and whether the lesson counts as complete
 *
 * @example
 * ```tsx
 * const { watchedFraction, isComplete } = useLessonWatchState({
 *   lessonId,
 *   durationSeconds,
 * });
 * if (watchedFraction === 0 && !isComplete) return null;
 * ```
 */
export function useLessonWatchState({
  lessonId,
  durationSeconds,
}: {
  lessonId: LessonId;
  durationSeconds: number;
}): LessonWatchState {
  const isMarkedComplete = useLessonCompletion(lessonId);
  const positions = useSavedPlaybackPositions();
  const positionSeconds = positions.get(lessonId) ?? null;

  const isComplete = countsAsComplete({ isMarkedComplete, positionSeconds, durationSeconds });

  return {
    watchedFraction: isComplete ? 1 : watchedFraction(positionSeconds, durationSeconds),
    isComplete,
  };
}
