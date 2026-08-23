import type { LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { LessonRepository } from "@/domain/ports/lesson-repository/lesson-repository";
import type { PlaybackPositionRepository } from "@/domain/ports/playback-position-repository/playback-position-repository";
import { err, ok, Result, ResultAsync } from "@/domain/result/result";

import type { RecordPlaybackPositionErrors } from "./record-playback-position.errors";

const toInternalError = (cause: unknown): RecordPlaybackPositionErrors => ({
  kind: "internal-error",
  cause,
});

/**
 * Use case: persist the playback position for a lesson.
 *
 * Validates that the lesson exists, then writes through the
 * `PlaybackPositionRepository` port. The port stays agnostic of the storage
 * (localStorage today, future Postgres-backed adapter unchanged) so the
 * use case contract is preserved when persistence moves off-device.
 */
export type RecordPlaybackPosition = (input: {
  lessonId: LessonId;
  seconds: number;
}) => ResultAsync<{ recorded: true }, RecordPlaybackPositionErrors>;

export const makeRecordPlaybackPosition = (deps: {
  lessons: LessonRepository;
  positions: PlaybackPositionRepository;
}): RecordPlaybackPosition => {
  const useCase = (input: { lessonId: LessonId; seconds: number }) =>
    ResultAsync.fromPromise(deps.lessons.byId(input.lessonId), toInternalError)
      .andThen((lesson): Result<Lesson, RecordPlaybackPositionErrors> => {
        if (lesson === null) {
          return err({ kind: "lesson-not-found" });
        }
        return ok(lesson);
      })
      .andThen((lesson) =>
        ResultAsync.fromPromise(
          deps.positions.setPosition(lesson.id, input.seconds),
          toInternalError,
        ).map(() => ({ recorded: true as const })),
      );

  return useCase as RecordPlaybackPosition;
};
