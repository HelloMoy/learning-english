import { getCoursePlatformDeps } from "@/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies";
import type { HomeLevel } from "@/components/home-view/home-view";
import type { LearnerCardLevel } from "@/components/learner-card/learner-card";
import type {
  CourseCatalogEntry,
  LessonProgressSlice,
} from "@/domain/use-cases/find-course-catalog/find-course-catalog";

import { cache } from "react";

/**
 * The catalog, resolved once per request for every route that renders it —
 * the home and the learner's own pages.
 *
 * @returns The catalog entries in sequence order, or none when the catalog cannot be read
 */
export const loadCatalogEntries = cache(async (): Promise<CourseCatalogEntry[]> => {
  const result = await getCoursePlatformDeps().useCases.findCourseCatalog();
  return result.isOk() ? result.value.entries : [];
});

/**
 * Projects catalog entries onto what the client pages count progress over:
 * each course with its modules and lesson slices. Lesson bodies stay on the
 * server.
 *
 * @param entries - The catalog entries, in sequence order
 * @returns One level per course, in the same order
 */
export function catalogLevels(entries: ReadonlyArray<CourseCatalogEntry>): HomeLevel[] {
  return entries.map(({ course, modules, lessonRuntimes }) => ({
    course,
    modules,
    lessonRuntimes,
  }));
}

/**
 * The level a learner card names — the first course — and its lessons, which
 * the card's progress line counts.
 *
 * @param entries - The catalog entries, in sequence order
 * @returns The first level, or `null` for an empty catalog
 */
export function firstLearnerLevel(
  entries: ReadonlyArray<CourseCatalogEntry>,
): { level: LearnerCardLevel; lessonRuntimes: LessonProgressSlice[] } | null {
  const first = entries[0];
  if (!first) return null;
  return {
    level: { number: first.course.sequence, courseTitle: first.course.title },
    lessonRuntimes: first.lessonRuntimes,
  };
}
