import type { BlobStore } from "@/adapters/persistence/blob-store/blob-store";
import {
  resolveLessonRow,
  type LessonRow,
} from "@/adapters/persistence/local-filesystem/resolve-content-row/resolve-content-row";
import type { CourseId, LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { LessonRepository } from "@/domain/ports/lesson-repository/lesson-repository";

/**
 * Driven adapter: `LessonRepository` backed by generated seed rows whose
 * content keys are resolved through a `BlobStore` on every read.
 *
 * Rows are stored in insertion order and hold opaque content KEYS in
 * `source` and `poster`. Resolution happens at read time, not at seed-gen
 * time, so repointing storage (local folder → S3/R2 bucket) is a change of
 * `BlobStore` driver rather than a regeneration of `seed-content.ts`. It is
 * also what makes per-request signed URLs possible: a signed URL expires and
 * therefore cannot be baked into a committed file.
 *
 * Parsing happens after resolution — `urlOrRelativePath()` rejects a bare
 * key — so a row that resolves to a malformed URL is rejected here rather
 * than reaching a `src` attribute in the UI.
 */
export class LocalFilesystemLessonRepository implements LessonRepository {
  readonly #rows: ReadonlyArray<LessonRow>;
  readonly #blobStore: BlobStore;

  constructor({ rows, blobStore }: { rows: ReadonlyArray<LessonRow>; blobStore: BlobStore }) {
    this.#rows = rows;
    this.#blobStore = blobStore;
  }

  byId(id: LessonId): Promise<Lesson | null> {
    const row = this.#rows.find((r) => r.id === id);
    return Promise.resolve(row ? this.#resolve(row) : null);
  }

  listByCourse(courseId: CourseId): Promise<Lesson[]> {
    return Promise.resolve(
      this.#rows
        .filter((r) => r.courseId === courseId)
        .map((r) => this.#resolve(r))
        .sort((a, b) => a.sequence - b.sequence),
    );
  }

  #resolve(row: LessonRow): Lesson {
    return resolveLessonRow(row, this.#blobStore);
  }
}
