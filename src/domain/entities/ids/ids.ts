import { z } from "zod";

/**
 * Branded UUID identifiers for course-platform entities.
 *
 * Brands prevent a `CourseId` from being passed where a `LessonId` is expected
 * and force adapters to validate their inputs at the boundary.
 */
export const CourseId = z.string().uuid().brand<"CourseId">();
export const LessonId = z.string().uuid().brand<"LessonId">();
export const StudentId = z.string().uuid().brand<"StudentId">();

export type CourseId = z.infer<typeof CourseId>;
export type LessonId = z.infer<typeof LessonId>;
export type StudentId = z.infer<typeof StudentId>;
