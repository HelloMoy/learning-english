import type { LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";

/**
 * Where a lesson sits inside its own module.
 *
 * @remarks
 * `total` counts the module's lessons, not the course's. The reading is
 * rendered beside the module's title — "Consonants · Lesson 13 of 27" — so a
 * course-wide denominator there would name one thing and count another.
 *
 * @category Utilities
 */
export type LessonPosition = {
  /** The lesson's one-based ordinal in `sequence` order. */
  position: number;
  /** How many lessons the module holds. */
  total: number;
};

/**
 * Where the current lesson sits inside its own module.
 *
 * @remarks
 * Derived from the course structure alone — never from `localStorage` — so the
 * reading is available during server rendering and does not appear at
 * hydration the way a watch-progress meter does.
 *
 * Ordering comes from `sequence` rather than the order the caller happens to
 * hold the lessons in, so a caller passing an unsorted list gets the same
 * answer as one passing a sorted one.
 *
 * @param lessons - The course's lessons, in any order
 * @param currentLessonId - The lesson being viewed
 * @returns The lesson's position within its module, or `undefined` when the
 *          course holds no such lesson — the caller renders no reading rather
 *          than an invented "0 of 27"
 *
 * @example
 * ```ts
 * lessonPositionInModule(lessons, currentLessonId); // { position: 13, total: 27 }
 * ```
 */
export function lessonPositionInModule(
  lessons: readonly Lesson[],
  currentLessonId: LessonId,
): LessonPosition | undefined {
  const currentLesson = lessons.find((lesson) => lesson.id === currentLessonId);
  if (currentLesson === undefined) return undefined;

  const moduleLessons = lessons
    .filter((lesson) => lesson.moduleId === currentLesson.moduleId)
    .sort((one, other) => one.sequence - other.sequence);

  return {
    position: moduleLessons.findIndex((lesson) => lesson.id === currentLessonId) + 1,
    total: moduleLessons.length,
  };
}
