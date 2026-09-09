"use client";

import type { LessonRuntime } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useCompletedLessons } from "@/hooks/use-lesson-completion/use-lesson-completion";
import { useSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import { countsAsComplete } from "@/lib/watch-progress/watch-progress";

/**
 * How far the learner has got through one module.
 */
export type ModuleWatchProgress = {
  /** Lessons marked complete or watched to the end. */
  completedCount: number;
  /** Every lesson the module holds, previewed or not. */
  lessonCount: number;
};

/**
 * How many of a module's lessons the learner has finished.
 *
 * @remarks
 * Counts with `countsAsComplete`, the same rule `useLessonWatchState` applies
 * to a single lesson, so a module's meter and its lessons' rows can never
 * disagree.
 *
 * It reads the two stores once and applies the rule per lesson rather than
 * calling `useLessonWatchState` in a loop: the number of lessons varies from
 * module to module, and a hook call per lesson would break the rules of
 * hooks the moment a course is reordered.
 *
 * The caller is expected to pass `ModuleSummary.lessonRuntimes` — every
 * lesson the module holds, not the bounded preview the gallery renders.
 *
 * Browser-side only — do NOT call from a Server Component.
 *
 * @param lessonRuntimes - The module's lessons, each with its runtime
 * @returns The completed count and the module's lesson count; both `0` for a
 *          module holding no lessons, which the caller renders as no meter
 *
 * @example
 * ```tsx
 * const { completedCount, lessonCount } = useModuleWatchProgress(summary.lessonRuntimes);
 * if (completedCount === 0) return null;
 * ```
 */
export function useModuleWatchProgress(
  lessonRuntimes: ReadonlyArray<LessonRuntime>,
): ModuleWatchProgress {
  const completedLessons = useCompletedLessons();
  const positions = useSavedPlaybackPositions();

  const completedCount = lessonRuntimes.filter((lesson) =>
    countsAsComplete({
      isMarkedComplete: completedLessons.has(lesson.id),
      positionSeconds: positions.get(lesson.id) ?? null,
      durationSeconds: lesson.durationSeconds,
    }),
  ).length;

  return { completedCount, lessonCount: lessonRuntimes.length };
}
