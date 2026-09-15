import type { HomeFirstLesson } from "@/components/home-view/home-view";
import type { CourseCatalogEntry } from "@/domain/use-cases/find-course-catalog/find-course-catalog";
import { lessonPath } from "@/i18n/lesson-routes";

const SECONDS_PER_MINUTE = 60;

/**
 * The lesson the new-visitor home's primary action opens: the first lesson of
 * the first catalog course, with its runtime in whole minutes.
 *
 * @remarks
 * The catalog arrives in `Course.sequence` order, so the first entry is the
 * first level. A reading lesson has no runtime, and the home then names the
 * course alone rather than claiming a length.
 *
 * It lives beside the page because it is that page's projection of the
 * catalog, not a general-purpose utility.
 *
 * @param entries - The catalog entries, in sequence order
 * @returns The lesson to link to, or `null` when the first course has no lesson
 */
export function homeFirstLesson(
  entries: ReadonlyArray<CourseCatalogEntry>,
): HomeFirstLesson | null {
  const entry = entries[0];
  const lesson = entry?.firstLesson;
  const firstModule = entry?.modules.find((candidate) => candidate.id === lesson?.moduleId);
  if (!entry || !lesson || !firstModule) {
    return null;
  }

  return {
    href: lessonPath(entry.course, firstModule, lesson),
    minutes:
      lesson.kind === "video" ? Math.round(lesson.durationSeconds / SECONDS_PER_MINUTE) : null,
    courseTitle: entry.course.title,
  };
}
