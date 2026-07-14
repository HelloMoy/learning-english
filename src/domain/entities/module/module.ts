import { CourseId, ModuleId } from "@/domain/entities/ids/ids";
import { Slug } from "@/domain/entities/slug/slug";

import { z } from "zod";

/**
 * A grouping of related Lessons within a Course.
 *
 * A Module belongs to exactly one Course; a Lesson belongs to exactly one
 * Module. `sequence` orders modules within a course (1, 2, 3, ...).
 */
export const Module = z.object({
  id: ModuleId,
  courseId: CourseId,
  slug: Slug,
  title: z.string().min(1),
  sequence: z.number().int().positive(),
});

export type Module = z.infer<typeof Module>;
