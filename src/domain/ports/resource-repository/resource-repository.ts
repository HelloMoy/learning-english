import type { CourseId, LessonId, ModuleId, ResourceId } from "@/domain/entities/ids/ids";
import type { Resource } from "@/domain/entities/resource/resource";

/**
 * Port: read-only access to resources.
 *
 * Resource is a first-class domain entity (see design.md §D1) — Lessons do NOT
 * carry their resources as a field. The Lesson Page's use case fetches the
 * Lesson and the Resources separately and composes them in the view.
 *
 * `listByCourse` exists for parity with the deferred Workbook view (see
 * GLOSSARY.md § Deferred to a future change). It returns every resource in
 * the course, regardless of which lesson it is attached to.
 */
export interface ResourceRepository {
  byId(id: ResourceId): Promise<Resource | null>;
  listByLesson(lessonId: LessonId): Promise<Resource[]>;
  listByModule(moduleId: ModuleId): Promise<Resource[]>;
  listByCourse(courseId: CourseId): Promise<Resource[]>;
}
