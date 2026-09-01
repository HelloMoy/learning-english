import type { CourseId, LessonId, ModuleId, ResourceId } from "@/domain/entities/ids/ids";
import type { Resource } from "@/domain/entities/resource/resource";
import type { ResourceRepository } from "@/domain/ports/resource-repository/resource-repository";

/**
 * Driven adapter: one `ResourceRepository` built from several.
 *
 * The sibling of `CompositeLessonRepository`, and the same join: the A1
 * seed's resources are in-memory entities while the generated course's are
 * content rows resolved through a `BlobStore`, and the domain sees one port.
 *
 * `byId` takes the first delegate's non-null answer. The list methods
 * concatenate without re-sorting — unlike lessons, the resource port
 * promises no canonical order, so imposing one here would invent a
 * guarantee callers cannot rely on from any other adapter.
 */
export class CompositeResourceRepository implements ResourceRepository {
  readonly #delegates: ReadonlyArray<ResourceRepository>;

  constructor(delegates: ReadonlyArray<ResourceRepository>) {
    this.#delegates = delegates;
  }

  async byId(id: ResourceId): Promise<Resource | null> {
    for (const delegate of this.#delegates) {
      const found = await delegate.byId(id);
      if (found) {
        return found;
      }
    }
    return null;
  }

  listByLesson(lessonId: LessonId): Promise<Resource[]> {
    return this.#gather((delegate) => delegate.listByLesson(lessonId));
  }

  listByModule(moduleId: ModuleId): Promise<Resource[]> {
    return this.#gather((delegate) => delegate.listByModule(moduleId));
  }

  listByCourse(courseId: CourseId): Promise<Resource[]> {
    return this.#gather((delegate) => delegate.listByCourse(courseId));
  }

  async #gather(query: (delegate: ResourceRepository) => Promise<Resource[]>): Promise<Resource[]> {
    const perDelegate = await Promise.all(this.#delegates.map(query));
    return perDelegate.flat();
  }
}
