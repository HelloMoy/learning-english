import type { LessonId } from "@/domain/entities/ids/ids";
import type { ProgressTracker } from "@/domain/ports/progress-tracker/progress-tracker";

const STORAGE_KEY_PREFIX = "learning-english:completed:";

const buildKey = (lessonId: LessonId): string => `${STORAGE_KEY_PREFIX}${lessonId}`;

/**
 * Driven adapter: browser `localStorage`-backed `ProgressTracker`.
 *
 * **Browser only.** Do NOT import from a Server Component, Server Action, or
 * `getCoursePlatformDeps`. Doing so would bundle `window` access into the
 * server build and crash. The server-side default stays the sibling
 * `InMemoryProgressTracker`, whose state is ephemeral by design.
 *
 * Storage namespace: `learning-english:completed:{lessonId}`. Prefixed to
 * avoid collisions in DevTools and with other apps sharing the origin.
 *
 * The key's *presence* means complete and its absence means incomplete —
 * the value is a constant. That keeps the read total: unlike the sibling
 * playback adapter, which must reject a non-finite `Number.parseFloat`,
 * there is no third state to mis-handle.
 *
 * Completion recorded here is per-device, not per-user: the application has
 * no authentication, so nothing syncs across browsers. The port contract is
 * unchanged when a server-backed adapter replaces this one.
 *
 * Both methods are defensive about storage being unusable. `localStorage`
 * is undefined during SSR and in some restricted environments, and `setItem`
 * throws outright when the quota is exceeded or storage is blocked (Safari
 * private mode). Neither may break the page: a completion mark is not worth
 * an exception, so a failed write is simply a mark that does not stick.
 * The optional `localStorage` parameter is the dependency-injection seam
 * tests use to simulate those environments without monkey-patching globals.
 */
export class BrowserLocalStorageProgressTracker implements ProgressTracker {
  readonly #storage: Storage | undefined;

  constructor(params?: { localStorage?: Storage }) {
    this.#storage =
      params && "localStorage" in params
        ? params.localStorage
        : typeof window !== "undefined"
          ? window.localStorage
          : undefined;
  }

  async markComplete(lessonId: LessonId): Promise<void> {
    if (this.#storage === undefined) {
      return;
    }
    try {
      this.#storage.setItem(buildKey(lessonId), "1");
    } catch {
      // Quota exceeded or storage blocked. The mark is lost, which is the
      // correct degradation: the learner keeps browsing.
    }
  }

  async isComplete(lessonId: LessonId): Promise<boolean> {
    if (this.#storage === undefined) {
      return false;
    }
    return this.#storage.getItem(buildKey(lessonId)) !== null;
  }
}
