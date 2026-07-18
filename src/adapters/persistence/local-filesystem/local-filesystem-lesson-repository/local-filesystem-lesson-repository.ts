import type { CourseId, LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { LessonRepository } from "@/domain/ports/lesson-repository/lesson-repository";

/**
 * Driven adapter: filesystem-backed `LessonRepository`.
 *
 * Lessons are stored in insertion order. The adapter is a thin pass-through
 * over the seed array: it does not re-resolve URLs, does not scan the
 * filesystem at construction, and does not consult any BlobStore. URL
 * resolution happened at seed-gen time inside
 * `scripts/generate-course-content-seed.ts`, which owned the BlobStore.
 *
 * The "filesystem-backed" name is historical — it describes where the
 * seed DATA was generated from. At runtime the adapter is functionally
 * identical to `InMemoryLessonRepository`.
 */
export class LocalFilesystemLessonRepository implements LessonRepository {
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
