import type { CourseId, ModuleId } from "@/domain/entities/ids/ids";
import type { Module } from "@/domain/entities/module/module";
import type { Slug } from "@/domain/entities/slug/slug";

/**
 * Port: read-only access to modules.
 *
 * `listByCourse` returns modules in ascending `sequence` order so downstream
 * use cases do not need to re-sort. `byCourseAndSlug` is the lookup the
 * Lesson Page uses to resolve the module segment of the route.
 */
export interface ModuleRepository {
  byId(id: ModuleId): Promise<Module | null>;
  byCourseAndSlug(courseId: CourseId, slug: Slug): Promise<Module | null>;
  listByCourse(courseId: CourseId): Promise<Module[]>;
}
