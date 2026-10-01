import type { Course } from "@/domain/entities/course/course";

/** A course's prose in one language: what it is about, who it is for and what it teaches. */
export type CourseCopy = {
  description: string;
  outcomes: ReadonlyArray<string>;
  /** Who the course is for, or `undefined` when the course declares no audience. */
  audience: string | undefined;
  /** What it teaches in a few short points; empty when the course declares none. */
  highlights: ReadonlyArray<string>;
};

/**
 * A course's description, outcomes, audience and highlights in a locale.
 *
 * @remarks
 * Each field comes from the locale's translation when the course declares
 * that field for it, and from the course's own copy otherwise, so a partial
 * translation never leaves a blank. Titles are not part of the copy: they
 * are never translated.
 *
 * @example
 * ```ts
 * const { description, outcomes } = courseCopy(course, useLocale());
 * ```
 *
 * @param course - The course, with its translations
 * @param locale - The active locale, such as `es`
 * @returns The prose to show
 *
 * @category Course copy
 */
export function courseCopy(
  course: Pick<Course, "description" | "outcomes" | "audience" | "highlights" | "translations">,
  locale: string,
): CourseCopy {
  const translation = course.translations?.[locale];
  return {
    description: translation?.description ?? course.description,
    outcomes: translation?.outcomes ?? course.outcomes ?? [],
    audience: translation?.audience ?? course.audience,
    highlights: translation?.highlights ?? course.highlights ?? [],
  };
}
