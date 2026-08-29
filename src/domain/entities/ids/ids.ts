import { z } from "zod";

/**
 * Branded UUID identifiers for course-platform entities.
 *
 * Brands prevent a `CourseId` from being passed where a `LessonId` is expected
 * and force adapters to validate their inputs at the boundary.
 */
export const CourseId = z.uuid().brand<"CourseId">();
export const LessonId = z.uuid().brand<"LessonId">();
export const ModuleId = z.uuid().brand<"ModuleId">();
export const ResourceId = z.uuid().brand<"ResourceId">();
export const StudentId = z.uuid().brand<"StudentId">();

export type CourseId = z.infer<typeof CourseId>;
export type LessonId = z.infer<typeof LessonId>;
export type ModuleId = z.infer<typeof ModuleId>;
export type ResourceId = z.infer<typeof ResourceId>;
export type StudentId = z.infer<typeof StudentId>;
