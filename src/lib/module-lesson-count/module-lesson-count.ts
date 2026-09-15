import type { ModuleId } from "@/domain/entities/ids/ids";
import type { LessonProgressSlice } from "@/domain/use-cases/find-course-catalog/find-course-catalog";

/**
 * How many lessons a module holds, counted from a course's progress slices.
 *
 * @remarks
 * The home already holds every lesson's slice from the catalog, so it counts
 * here instead of asking `findContinueWatching` to enumerate the course.
 *
 * @param lessonRuntimes - Every lesson slice of the course, in any order
 * @param moduleId - The module to count
 * @returns The number of slices that belong to the module; `0` when none do
 *
 * @category Utilities
 */
export function countModuleLessons(
  lessonRuntimes: ReadonlyArray<LessonProgressSlice>,
  moduleId: ModuleId,
): number {
  return lessonRuntimes.filter((slice) => slice.moduleId === moduleId).length;
}
