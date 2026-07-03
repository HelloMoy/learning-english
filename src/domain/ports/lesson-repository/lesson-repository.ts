import type { CourseId, LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";

/**
 * Port: read-only access to lessons.
 *
 * Lessons are returned in canonical sequence order by `listByCourse` so that
 * downstream use cases do not need to re-sort.
 */
export interface LessonRepository {
  byId(id: LessonId): Promise<Lesson | null>;
  listByCourse(courseId: CourseId): Promise<Lesson[]>;
}
