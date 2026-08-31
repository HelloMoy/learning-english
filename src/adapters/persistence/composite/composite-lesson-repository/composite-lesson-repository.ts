import type { CourseId, LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { LessonRepository } from "@/domain/ports/lesson-repository/lesson-repository";

/**
 * Driven adapter: one `LessonRepository` built from several.
 *
 * The catalog holds courses backed by different storage — the hand-written
 * A1 seed is in-memory entities, the generated course is content rows
 * resolved through a `BlobStore` — and the domain must not know that. This
 * adapter is the join: it implements the port by fanning out over an ordered
 * list of delegates of the same port.
 *
 * `byId` takes the first delegate's non-null answer; `listByCourse`
 * concatenates every delegate's answer and re-sorts, because the port
 * promises canonical `sequence` order and merging two already-sorted lists
 * does not preserve it.
 *
 * The alternative — teaching one adapter both storage models — would put a
 * branch on every read, which is exactly what the `BlobStore` indirection
 * exists to avoid.
 */
export class CompositeLessonRepository implements LessonRepository {
  readonly #delegates: ReadonlyArray<LessonRepository>;

  constructor(delegates: ReadonlyArray<LessonRepository>) {
    this.#delegates = delegates;
  }

  async byId(id: LessonId): Promise<Lesson | null> {
    for (const delegate of this.#delegates) {
      const found = await delegate.byId(id);
      if (found) {
        return found;
      }
    }
    return null;
  }

  async listByCourse(courseId: CourseId): Promise<Lesson[]> {
    const perDelegate = await Promise.all(
      this.#delegates.map((delegate) => delegate.listByCourse(courseId)),
    );
    return perDelegate.flat().sort((a, b) => a.sequence - b.sequence);
  }
}
