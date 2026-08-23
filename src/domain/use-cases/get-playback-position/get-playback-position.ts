import type { LessonId } from "@/domain/entities/ids/ids";
import type { PlaybackPositionRepository } from "@/domain/ports/playback-position-repository/playback-position-repository";
import { ResultAsync } from "@/domain/result/result";

import type { GetPlaybackPositionErrors } from "./get-playback-position.errors";

const toInternalError = (cause: unknown): GetPlaybackPositionErrors => ({
  kind: "internal-error",
  cause,
});

/**
 * Use case: read the persisted playback position for a lesson.
 *
 * Resolves to `{ seconds: number | null }` — `null` when the adapter has
 * no entry for the lesson. The use case never throws.
 */
export type GetPlaybackPosition = (input: {
  lessonId: LessonId;
}) => ResultAsync<{ seconds: number | null }, GetPlaybackPositionErrors>;

export const makeGetPlaybackPosition = (deps: {
  positions: PlaybackPositionRepository;
}): GetPlaybackPosition => {
  const useCase = (input: { lessonId: LessonId }) =>
    ResultAsync.fromPromise(deps.positions.getPosition(input.lessonId), toInternalError).map(
      (seconds) => ({ seconds }),
    );

  return useCase as GetPlaybackPosition;
};
