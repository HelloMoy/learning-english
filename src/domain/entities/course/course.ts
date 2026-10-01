import { CourseId } from "@/domain/entities/ids/ids";
import { Slug } from "@/domain/entities/slug/slug";

import { z } from "zod";

/**
 * Whether a course is a rung of the catalog ladder or reference material.
 *
 * @remarks
 * A `level` course is one step of the ordered path through the catalog and is
 * numbered as such ("Level 2"). A `reference` course can be studied at any point:
 * it is ordered with the rest of the catalog but is never numbered, never
 * recommended as the first course, and never required for the gold distinction.
 */
export const CourseTrack = z.enum(["level", "reference"]);

export type CourseTrack = z.infer<typeof CourseTrack>;

/**
 * What a learner can do once they finish a course, one sentence each, in the
 * order the course presents them.
 */
export const CourseOutcomes = z.array(z.string().min(1));

export type CourseOutcomes = z.infer<typeof CourseOutcomes>;

/** Who a course is for, in one sentence, so a learner can tell whether it suits them. */
export const CourseAudience = z.string().min(1);

/**
 * What a course teaches, cut to a few short points for a glance — the long
 * {@link CourseOutcomes} stay on the course page.
 */
export const CourseHighlights = z.array(z.string().min(1));

export type CourseHighlights = z.infer<typeof CourseHighlights>;

/**
 * The sounds a course teaches, as IPA symbols. Vowels include diphthongs and
 * r-coloured vowels; they are kept apart from consonants because a learner
 * reads the two groups differently.
 */
export const CourseSounds = z.object({
  vowels: z.array(z.string().min(1)),
  consonants: z.array(z.string().min(1)),
});

export type CourseSounds = z.infer<typeof CourseSounds>;

/** A course's prose in one other language; a field left out falls back to the course's own. */
export const CourseTranslation = z.object({
  description: z.string().min(1).optional(),
  outcomes: CourseOutcomes.optional(),
  audience: CourseAudience.optional(),
  highlights: CourseHighlights.optional(),
});

export type CourseTranslation = z.infer<typeof CourseTranslation>;

/**
 * A course's prose in other languages, keyed by ISO 639-1 code (`es`, `pt`).
 * Titles are never translated: only the description, outcomes, audience and highlights.
 */
export const CourseTranslations = z.record(
  z.string().regex(/^[a-z]{2}$/, "ISO 639-1 lower-case"),
  CourseTranslation,
);

export type CourseTranslations = z.infer<typeof CourseTranslations>;

/**
 * A course in the platform. The hexágono does not know the subject — `language`
 * is data, not behavior. A "course" of cooking would satisfy the same schema.
 */
export const Course = z.object({
  id: CourseId,
  slug: Slug,
  title: z.string().min(1),
  description: z.string().min(1),
  language: z
    .string()
    .length(2)
    .regex(/^[a-z]{2}$/, "ISO 639-1 lower-case"),
  lessonCount: z.number().int().nonnegative(),
  moduleCount: z.number().int().nonnegative(),
  /**
   * The course's place in the catalog, 1-based like {@link Module.sequence}.
   * `CourseRepository.listAvailable` orders on it, so catalog order is data
   * rather than the order an adapter happened to return rows in. It orders
   * level and reference courses alike and is never a level number — that is
   * derived by `courseStandings`.
   */
  sequence: z.number().int().positive(),
  track: CourseTrack,
  /** Absent when the course declares none; a surface then shows no outcomes section. */
  outcomes: CourseOutcomes.optional(),
  /** Absent when the course declares none; a surface then shows no audience line. */
  audience: CourseAudience.optional(),
  /** Absent when the course declares none; a surface then shows no highlights. */
  highlights: CourseHighlights.optional(),
  /** Absent for courses that are not about single sounds. */
  sounds: CourseSounds.optional(),
  /** The course's prose in other languages; absent when the course declares none. */
  translations: CourseTranslations.optional(),
});

export type Course = z.infer<typeof Course>;
