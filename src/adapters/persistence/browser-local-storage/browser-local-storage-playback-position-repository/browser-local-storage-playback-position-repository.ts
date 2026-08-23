import type { LessonId } from "@/domain/entities/ids/ids";
import type { PlaybackPositionRepository } from "@/domain/ports/playback-position-repository/playback-position-repository";

const STORAGE_KEY_PREFIX = "learning-english:playback:";

const buildKey = (lessonId: LessonId): string => `${STORAGE_KEY_PREFIX}${lessonId}`;

/**
 * Driven adapter: browser `localStorage`-backed `PlaybackPositionRepository`.
 *
 * **Browser only.** Do NOT import from a Server Component, Server Action, or
 * `getCoursePlatformDeps`. Doing so would bundle `window` access into the
 * server build and crash. The server-side default for SSR/tests is the
 * sibling `InMemoryPlaybackPositionRepository` (see
 * `src/adapters/persistence/in-memory/in-memory-playback-position-repository/`).
 *
 * Storage namespace: `learning-english:playback:{lessonId}`. Prefixed to
 * avoid collisions in DevTools and with other apps sharing the origin.
 *
 * The adapter guards against `window.localStorage` being `undefined` (SSR
 * or restricted environments) by treating any read or write as a no-op.
 * The optional `localStorage` parameter is the dependency-injection seam
 * tests use to simulate that environment without monkey-patching globals.
 */
export class BrowserLocalStoragePlaybackPositionRepository implements PlaybackPositionRepository {
  readonly #storage: Storage | undefined;

  constructor(params?: { localStorage?: Storage }) {
    this.#storage =
      params?.localStorage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
  }

  async getPosition(lessonId: LessonId): Promise<number | null> {
    if (this.#storage === undefined) {
      return null;
    }
    const raw = this.#storage.getItem(buildKey(lessonId));
    if (raw === null) {
      return null;
    }
    const seconds = Number.parseFloat(raw);
    return Number.isFinite(seconds) ? seconds : null;
  }

  async setPosition(lessonId: LessonId, seconds: number): Promise<void> {
    if (this.#storage === undefined) {
      return;
    }
    this.#storage.setItem(buildKey(lessonId), seconds.toString());
  }
}
