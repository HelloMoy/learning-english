import { CourseId } from "@/domain/entities/ids/ids";
import { Slug } from "@/domain/entities/slug/slug";

import { z } from "zod";

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
});

export type Course = z.infer<typeof Course>;
