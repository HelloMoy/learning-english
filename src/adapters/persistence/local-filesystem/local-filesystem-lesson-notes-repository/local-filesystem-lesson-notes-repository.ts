import type { BlobStore } from "@/adapters/persistence/blob-store/blob-store";
import {
  resolveResourceRow,
  type ResourceRow,
} from "@/adapters/persistence/local-filesystem/resolve-content-row/resolve-content-row";
import type { LessonId } from "@/domain/entities/ids/ids";
import type {
  LessonNotes,
  LessonNotesRepository,
} from "@/domain/ports/lesson-notes-repository/lesson-notes-repository";

/**
 * Driven adapter: filesystem-backed `LessonNotesRepository`.
 *
 * Resolves the Markdown notes for a lesson using a generated `lessonId → key`
 * map and a `BlobStore`. The adapter only reads keys the seed generator
 * has validated via `BlobStore.exists`; the UI never supplies a key.
 *
 * The notes `Resource` is located by comparing content KEYS. Matching on the
 * resolved URL instead would couple this adapter to the resource adapter
 * having been given an identically-configured `BlobStore`: when the two
 * disagree the lookup returns `null` and the notes silently disappear with no
 * error. Keys are configuration-independent, so that failure mode is gone.
 */
export class LocalFilesystemLessonNotesRepository implements LessonNotesRepository {
  readonly #notes: Map<LessonId, string>;
  /** Keyed by `${lessonId}:${contentKey}` — the notes map holds both halves. */
  readonly #rowsByLessonAndKey: Map<string, ResourceRow>;
  readonly #blobStore: BlobStore;

  constructor(params: {
    notesKeys: Readonly<Record<string, string>>;
    resourceRows: ReadonlyArray<ResourceRow>;
    blobStore: BlobStore;
  }) {
    this.#notes = new Map();
    for (const [lessonId, key] of Object.entries(params.notesKeys)) {
      this.#notes.set(lessonId as LessonId, key);
    }
    this.#rowsByLessonAndKey = new Map();
    for (const row of params.resourceRows) {
      this.#rowsByLessonAndKey.set(`${row.lessonId}:${row.url}`, row);
    }
    this.#blobStore = params.blobStore;
  }

  async byLesson(lessonId: LessonId): Promise<LessonNotes | null> {
    const key = this.#notes.get(lessonId);
    if (!key) return null;
    // Read first: an unsafe key must be rejected whether or not a matching
    // resource row exists.
    const markdown = await this.#blobStore.readText(key);
    const row = this.#rowsByLessonAndKey.get(`${lessonId}:${key}`);
    if (!row) return null;
    return { resource: resolveResourceRow(row, this.#blobStore), markdown };
  }
}
