import type { LessonId } from "@/domain/entities/ids/ids";
import type { PlaybackPositionRepository } from "@/domain/ports/playback-position-repository/playback-position-repository";

/**
 * Driven adapter: in-memory implementation of `PlaybackPositionRepository`.
 *
 * Positions live in a `Map`. The state is **ephemeral** — it does not
 * survive a server restart. This is the SSR/test default used when a
 * client `localStorage` is not available; the browser-side adapter
 * (`BrowserLocalStoragePlaybackPositionRepository`) is the production
 * adapter for the Lesson Page.
 */
export class InMemoryPlaybackPositionRepository implements PlaybackPositionRepository {
  readonly #positions: Map<LessonId, number>;

  constructor(params?: { initial?: Record<string, number> }) {
    this.#positions = new Map(
      Object.entries(params?.initial ?? {}).map(([id, seconds]) => [id as LessonId, seconds]),
    );
  }

  async getPosition(lessonId: LessonId): Promise<number | null> {
    return this.#positions.has(lessonId) ? (this.#positions.get(lessonId) as number) : null;
  }

  async setPosition(lessonId: LessonId, seconds: number): Promise<void> {
    this.#positions.set(lessonId, seconds);
  }
}
