import type { LessonId } from "@/domain/entities/ids/ids";

/**
 * Port: persists the playback position per lesson.
 *
 * In v1 the adapter is `BrowserLocalStoragePlaybackPositionRepository` for
 * client use, with `InMemoryPlaybackPositionRepository` available as the
 * server-side default for SSR and tests. The contract is what stays; the
 * adapter changes when a server-backed store is introduced (see
 * `openspec/changes/2026-07-26-lesson-playback-resume/design.md` §D1, D7).
 *
 * Orthogonal to `ProgressTracker`: `completed` (boolean) and `lastPosition`
 * (numeric seconds) are independent concepts that migrate to independent
 * stores.
 */
export interface PlaybackPositionRepository {
  /** Returns the saved position in seconds, or `null` when none is persisted. */
  getPosition(lessonId: LessonId): Promise<number | null>;

  /** Persists the position in seconds; idempotent. */
  setPosition(lessonId: LessonId, seconds: number): Promise<void>;
}
