import type { LessonId } from "@/domain/entities/ids/ids";
import type { PlaybackPositionRepository } from "@/domain/ports/playback-position-repository/playback-position-repository";
import { learnerStore } from "@/lib/learner-store/learner-store";

/**
 * The shortest time between two server writes of one lesson's position.
 * The store is updated on every position; only the server write is spaced.
 */
export const SERVER_WRITE_INTERVAL_MS = 10_000;

/**
 * How a {@link LearnerStorePlaybackPositionRepository} reaches the server.
 *
 * @category Learner state
 */
export type PositionRequests = {
  /** Saves one position through the Server Action; resolves whether it was accepted. */
  record: (lessonId: LessonId, seconds: number) => Promise<boolean>;
  /** Queues one position on `navigator.sendBeacon`; returns whether it was queued. */
  beacon: (position: { lessonId: LessonId; seconds: number }) => boolean;
};

type LessonWindow = {
  lastSentAt: number;
  pendingSeconds?: number;
  timer?: ReturnType<typeof setTimeout>;
};

/**
 * The browser's `PlaybackPositionRepository`: every position reaches the
 * learner store at once, and the server at most once every
 * {@link SERVER_WRITE_INTERVAL_MS} per lesson.
 *
 * @remarks
 * The player hands over a position every second or two. Showing it on every
 * progress bar is free; writing each one to a hosted database is not. So the
 * first position of a window is written at once, later ones only replace the
 * pending value, and the window's close writes the latest. {@link flush}
 * writes a pending position now — for a pause, a seek, the end of the video,
 * leaving the page within the app — and {@link flushWithBeacon} hands it to
 * `navigator.sendBeacon`, the one request a closing page is allowed to finish.
 *
 * A refused write is not rolled back: the next write carries a newer position
 * anyway (capability `learner-state`).
 */
export class LearnerStorePlaybackPositionRepository implements PlaybackPositionRepository {
  readonly #windows = new Map<LessonId, LessonWindow>();

  constructor(private readonly requests: PositionRequests) {}

  async getPosition(lessonId: LessonId): Promise<number | null> {
    return learnerStore.getState().positions.get(lessonId) ?? null;
  }

  async setPosition(lessonId: LessonId, seconds: number): Promise<void> {
    learnerStore.setState(({ positions }) => ({
      positions: new Map(positions).set(lessonId, seconds),
    }));
    const lessonWindow = this.#windows.get(lessonId);
    if (!lessonWindow || Date.now() - lessonWindow.lastSentAt >= SERVER_WRITE_INTERVAL_MS) {
      await this.#send(lessonId, seconds);
      return;
    }
    this.#holdUntilWindowCloses(lessonId, lessonWindow, seconds);
  }

  /** Writes every pending position now, through the Server Action. */
  async flush(): Promise<void> {
    await Promise.all(
      this.#pendingPositions().map(([lessonId, seconds]) => this.#send(lessonId, seconds)),
    );
  }

  /** Hands every pending position to `navigator.sendBeacon`, for a page being hidden. */
  flushWithBeacon(): void {
    for (const [lessonId, seconds] of this.#pendingPositions()) {
      this.#clearPending(lessonId);
      this.requests.beacon({ lessonId, seconds });
    }
  }

  async #send(lessonId: LessonId, seconds: number): Promise<void> {
    this.#clearPending(lessonId);
    this.#windows.set(lessonId, { lastSentAt: Date.now() });
    await this.requests.record(lessonId, seconds).catch(() => false);
  }

  #holdUntilWindowCloses(lessonId: LessonId, lessonWindow: LessonWindow, seconds: number): void {
    lessonWindow.pendingSeconds = seconds;
    lessonWindow.timer ??= setTimeout(
      () => void this.#send(lessonId, lessonWindow.pendingSeconds ?? seconds),
      SERVER_WRITE_INTERVAL_MS - (Date.now() - lessonWindow.lastSentAt),
    );
  }

  #pendingPositions(): Array<[LessonId, number]> {
    return [...this.#windows]
      .filter(([, lessonWindow]) => lessonWindow.pendingSeconds !== undefined)
      .map(([lessonId, lessonWindow]) => [lessonId, lessonWindow.pendingSeconds as number]);
  }

  #clearPending(lessonId: LessonId): void {
    const lessonWindow = this.#windows.get(lessonId);
    if (!lessonWindow) return;
    clearTimeout(lessonWindow.timer);
    lessonWindow.timer = undefined;
    lessonWindow.pendingSeconds = undefined;
  }
}
