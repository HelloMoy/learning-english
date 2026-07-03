import type { CourseId, LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { LessonRepository } from "@/domain/ports/lesson-repository/lesson-repository";

/**
 * Driven adapter: in-memory implementation of `LessonRepository`.
 *
 * Lessons are stored in insertion order; `listByCourse` returns them sorted
 * by `sequence` ascending so downstream use cases do not need to re-sort.
 */
export class InMemoryLessonRepository implements LessonRepository {
  readonly #lessons: ReadonlyArray<Lesson>;

  constructor(lessons: ReadonlyArray<Lesson>) {
    this.#lessons = lessons;
  }

  byId(id: LessonId): Promise<Lesson | null> {
    return Promise.resolve(this.#lessons.find((l) => l.id === id) ?? null);
  }

  listByCourse(courseId: CourseId): Promise<Lesson[]> {
    return Promise.resolve(
      this.#lessons
        .filter((l) => l.courseId === courseId)
        .slice()
        .sort((a, b) => a.sequence - b.sequence),
    );
  }
}
