import type { CourseId, ModuleId } from "@/domain/entities/ids/ids";
import type { Module } from "@/domain/entities/module/module";
import type { Slug } from "@/domain/entities/slug/slug";
import type { ModuleRepository } from "@/domain/ports/module-repository/module-repository";

/**
 * Driven adapter: in-memory implementation of `ModuleRepository`.
 *
 * Modules are returned in ascending `sequence` order from `listByCourse` so
 * downstream use cases do not need to re-sort.
 */
export class InMemoryModuleRepository implements ModuleRepository {
  readonly #modules: ReadonlyArray<Module>;

  constructor(modules: ReadonlyArray<Module>) {
    this.#modules = modules;
  }

  byId(id: ModuleId): Promise<Module | null> {
    return Promise.resolve(this.#modules.find((m) => m.id === id) ?? null);
  }

  byCourseAndSlug(courseId: CourseId, slug: Slug): Promise<Module | null> {
    return Promise.resolve(
      this.#modules.find((m) => m.courseId === courseId && m.slug === slug) ?? null,
    );
  }

  listByCourse(courseId: CourseId): Promise<Module[]> {
    return Promise.resolve(
      this.#modules
        .filter((m) => m.courseId === courseId)
        .slice()
        .sort((a, b) => a.sequence - b.sequence),
    );
  }
}
