import type { CourseId, LessonId, ModuleId, ResourceId } from "@/domain/entities/ids/ids";
import type { Resource } from "@/domain/entities/resource/resource";
import type { ResourceRepository } from "@/domain/ports/resource-repository/resource-repository";

/**
 * Driven adapter: in-memory implementation of `ResourceRepository`.
 *
 * Resources are stored in insertion order. `listByModule` and `listByCourse`
 * do not currently filter by `moduleId` / `courseId` because Resources are
 * attached to Lessons (not directly to Modules / Courses); a future change
 * that introduces a `Resource.moduleId` field will tighten these methods.
 */
export class InMemoryResourceRepository implements ResourceRepository {
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
