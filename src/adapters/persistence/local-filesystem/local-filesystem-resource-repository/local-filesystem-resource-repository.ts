import type { BlobStore } from "@/adapters/persistence/blob-store/blob-store";
import {
  resolveResourceRow,
  type ResourceRow,
} from "@/adapters/persistence/local-filesystem/resolve-content-row/resolve-content-row";
import type { CourseId, LessonId, ModuleId, ResourceId } from "@/domain/entities/ids/ids";
import type { Resource } from "@/domain/entities/resource/resource";
import type { ResourceRepository } from "@/domain/ports/resource-repository/resource-repository";

/**
 * Driven adapter: `ResourceRepository` backed by generated seed rows whose
 * content keys are resolved through a `BlobStore` on every read.
 *
 * Mirrors `InMemoryResourceRepository`'s query semantics exactly — same
 * methods, same `listByModule` / `listByCourse` "return everything" behaviour
 * because `Resource` does not currently carry `moduleId` / `courseId` fields.
 * The difference is the storage shape: rows hold opaque content KEYS in `url`,
 * and resolution happens here at read time rather than at seed-gen time, so
 * the storage backend can change without regenerating `seed-content.ts`.
 */
export class LocalFilesystemResourceRepository implements ResourceRepository {
  readonly #rows: ReadonlyArray<ResourceRow>;
  readonly #blobStore: BlobStore;

  constructor({ rows, blobStore }: { rows: ReadonlyArray<ResourceRow>; blobStore: BlobStore }) {
    this.#rows = rows;
    this.#blobStore = blobStore;
  }

  byId(id: ResourceId): Promise<Resource | null> {
    const row = this.#rows.find((r) => r.id === id);
    return Promise.resolve(row ? this.#resolve(row) : null);
  }

  listByLesson(lessonId: LessonId): Promise<Resource[]> {
    return Promise.resolve(
      this.#rows.filter((r) => r.lessonId === lessonId).map((r) => this.#resolve(r)),
    );
  }

  listByModule(moduleId: ModuleId): Promise<Resource[]> {
    // Resources are attached to lessons; module-level listing returns all
    // resources whose lesson belongs to the module. The lesson→module join
    // is the consumer's responsibility (use the ModuleRepository). The
    // `moduleId` argument is part of the port contract even though the
    // current seed doesn't carry it directly on the Resource.
    void moduleId;
    return Promise.resolve(this.#rows.map((r) => this.#resolve(r)));
  }

  listByCourse(courseId: CourseId): Promise<Resource[]> {
    void courseId;
    return Promise.resolve(this.#rows.map((r) => this.#resolve(r)));
  }

  #resolve(row: ResourceRow): Resource {
    return resolveResourceRow(row, this.#blobStore);
  }
}
