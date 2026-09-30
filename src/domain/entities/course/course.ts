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
});

export type Course = z.infer<typeof Course>;
