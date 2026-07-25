import type { BlobStore } from "@/adapters/persistence/blob-store/blob-store";
import type { LessonId } from "@/domain/entities/ids/ids";
import type { Resource } from "@/domain/entities/resource/resource";
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
 */
export class LocalFilesystemLessonNotesRepository implements LessonNotesRepository {
  readonly #notes: Map<LessonId, string>;
  readonly #resources: Map<string, Resource>;
  readonly #blobStore: BlobStore;

  constructor(params: {
    notesKeys: Readonly<Record<string, string>>;
    resources: ReadonlyArray<Resource>;
    blobStore: BlobStore;
  }) {
    this.#notes = new Map();
    for (const [lessonId, key] of Object.entries(params.notesKeys)) {
      this.#notes.set(lessonId as LessonId, key);
    }
    this.#resources = new Map();
    for (const resource of params.resources) {
      this.#resources.set(`${resource.lessonId}:${resource.url}`, resource);
    }
    this.#blobStore = params.blobStore;
  }

  async byLesson(lessonId: LessonId): Promise<LessonNotes | null> {
    const key = this.#notes.get(lessonId);
    if (!key) return null;
    const markdown = await this.#blobStore.readText(key);
    const resource = this.#findMarkdownResource(lessonId, key);
    if (!resource) return null;
    return { resource, markdown };
  }

  #findMarkdownResource(lessonId: LessonId, key: string): Resource | null {
    const expectedUrl = this.#blobStore.url(key);
    const direct = this.#resources.get(`${lessonId}:${expectedUrl}`);
    if (direct) return direct;
    for (const resource of this.#resources.values()) {
      if (resource.lessonId === lessonId && resource.url === expectedUrl) {
        return resource;
      }
    }
    return null;
  }
}
