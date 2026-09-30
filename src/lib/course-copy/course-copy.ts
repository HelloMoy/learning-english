import type { Course } from "@/domain/entities/course/course";

/** A course's prose in one language: what it is about and what it teaches. */
export type CourseCopy = {
  description: string;
  outcomes: ReadonlyArray<string>;
};

/**
 * A course's description and outcomes in a locale.
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
 * @returns The description and outcomes to show
 *
 * @category Course copy
 */
export function courseCopy(
  course: Pick<Course, "description" | "outcomes" | "translations">,
  locale: string,
): CourseCopy {
  const translation = course.translations?.[locale];
  return {
    description: translation?.description ?? course.description,
    outcomes: translation?.outcomes ?? course.outcomes ?? [],
  };
}
