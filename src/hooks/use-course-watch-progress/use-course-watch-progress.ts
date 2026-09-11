"use client";

import type { Lesson } from "@/domain/entities/lesson/lesson";
import { useCompletedLessons } from "@/hooks/use-lesson-completion/use-lesson-completion";
import { useSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import { countsAsComplete } from "@/lib/watch-progress/watch-progress";

/**
 * How many of a set of lessons the learner has finished.
 *
 * @category Utilities
 */
export type WatchTally = {
  /** Lessons marked complete or watched to the end. */
  completedCount: number;
  /** Every lesson the set holds. */
  lessonCount: number;
};

/**
 * How far the learner has got through a whole course.
 */
export type CourseWatchProgress = WatchTally & {
  /** The completed share, in the unit range; `0` for a course with no lessons. */
  completedFraction: number;
  /** The same tally per module, so a per-module meter needs no hook of its own. */
  byModuleId: ReadonlyMap<string, WatchTally>;
};

/**
 * How far the learner has got through a course, in whole lessons.
 *
 * @remarks
 * Counts with `countsAsComplete`, the same rule `useLessonWatchState` applies
 * to a single lesson and `useModuleWatchProgress` to a module, so a course
 * meter can never disagree with the lesson rows it sits above.
 *
 * A lesson with no runtime — a reading lesson — is counted by its mark alone,
 * which is the same thing `LessonWatchProgress` says when it renders no bar
 * for one.
 *
 * The per-module breakdown is returned rather than left to the caller because
 * a course's module count varies: a hook call per module would break the rules
 * of hooks the moment a course is reordered. It is keyed, not ordered, so the
 * caller's own module list decides what order the segments draw in.
 *
 * Browser-side only — do NOT call from a Server Component. The reading appears
 * at hydration, so a caller rendering a meter must keep its track on the
 * server and gate only the fill (see `useIsHydrated`).
 *
 * @param lessons - Every lesson in the course, in any order
 * @returns The course tally, its fraction, and the same tally per module
 *
 * @example
 * ```tsx
 * const { completedFraction, byModuleId } = useCourseWatchProgress(lessons);
 * ```
 */
export function useCourseWatchProgress(lessons: readonly Lesson[]): CourseWatchProgress {
  const completedLessons = useCompletedLessons();
  const positions = useSavedPlaybackPositions();

  const byModuleId = new Map<string, WatchTally>();
  let completedCount = 0;

  for (const lesson of lessons) {
    const tally = byModuleId.get(lesson.moduleId) ?? { completedCount: 0, lessonCount: 0 };
    tally.lessonCount += 1;

    if (
      countsAsComplete({
        isMarkedComplete: completedLessons.has(lesson.id),
        positionSeconds: positions.get(lesson.id) ?? null,
        durationSeconds: runtimeOf(lesson),
      })
    ) {
      tally.completedCount += 1;
      completedCount += 1;
    }

    byModuleId.set(lesson.moduleId, tally);
  }

  return {
    completedCount,
    lessonCount: lessons.length,
    completedFraction: lessons.length > 0 ? completedCount / lessons.length : 0,
    byModuleId,
  };
}

/**
 * A lesson's runtime in seconds, or `0` for a lesson that has none.
 *
 * @remarks
 * A reading lesson carries no `durationSeconds` at all, and `countsAsComplete`
 * reads `0` as "there is nothing here to watch to the end" — which leaves the
 * completion mark as the lesson's only route to being counted.
 *
 * @param lesson - The lesson to measure
 * @returns The runtime in seconds; `0` when the lesson has no media
 */
function runtimeOf(lesson: Lesson): number {
  return lesson.kind === "video" ? lesson.durationSeconds : 0;
}
