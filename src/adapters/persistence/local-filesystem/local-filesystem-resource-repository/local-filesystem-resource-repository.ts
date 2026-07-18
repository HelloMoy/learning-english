import type { CourseId, LessonId, ModuleId, ResourceId } from "@/domain/entities/ids/ids";
import type { Resource } from "@/domain/entities/resource/resource";
import type { ResourceRepository } from "@/domain/ports/resource-repository/resource-repository";

/**
 * Driven adapter: filesystem-backed `ResourceRepository`.
 *
 * Mirrors `InMemoryResourceRepository` exactly — same methods, same
 * `listByModule` / `listByCourse` "return everything" semantics because
 * `Resource` does not currently carry `moduleId` / `courseId` fields. The
 * "filesystem-backed" name is historical: it describes where the seed
 * data was generated from, not where the adapter looks at runtime.
 *
 * URL resolution happened at seed-gen time inside
 * `scripts/generate-course-content-seed.ts`. The adapter is a thin
 * pass-through — it does not consult any BlobStore.
 */
export class LocalFilesystemResourceRepository implements ResourceRepository {
  readonly #resources: ReadonlyArray<Resource>;

  constructor(resources: ReadonlyArray<Resource>) {
    this.#resources = resources;
  }

  byId(id: ResourceId): Promise<Resource | null> {
    return Promise.resolve(this.#resources.find((r) => r.id === id) ?? null);
  }

  listByLesson(lessonId: LessonId): Promise<Resource[]> {
    return Promise.resolve(this.#resources.filter((r) => r.lessonId === lessonId));
  }

  listByModule(moduleId: ModuleId): Promise<Resource[]> {
    // Resources are attached to lessons; module-level listing returns all
    // resources whose lesson belongs to the module. The lesson→module join
    // is the consumer's responsibility (use the ModuleRepository). The
    // `moduleId` argument is part of the port contract even though the
    // current seed doesn't carry it directly on the Resource.
    void moduleId;
    return Promise.resolve(this.#resources.slice());
  }

  listByCourse(courseId: CourseId): Promise<Resource[]> {
    void courseId;
    return Promise.resolve(this.#resources.slice());
  }
}
