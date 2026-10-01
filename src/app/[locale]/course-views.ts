import { getCoursePlatformDeps } from "@/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";

import { cache } from "react";

import { loadCatalogEntries } from "./catalog-levels";

/**
 * Every catalog course as the course overview sees it — modules, and lessons
 * with their titles, durations and posters — in catalog order.
 *
 * @remarks
 * The learner pages compute each course's progress and next video on the
 * client from this data, exactly as the course overview does, so they never
 * need a round-trip to resolve where the learner is. Cached per request; a
 * course that fails to load is left out rather than failing the page.
 */
export const loadCourseViews = cache(async (): Promise<CourseForView[]> => {
  const { findCourseForView } = getCoursePlatformDeps().useCases;
  const entries = await loadCatalogEntries();
  const results = await Promise.all(
    entries.map(({ course }) => findCourseForView({ courseSlug: course.slug })),
  );
  return results.flatMap((result) => (result.isOk() ? [result.value] : []));
});
