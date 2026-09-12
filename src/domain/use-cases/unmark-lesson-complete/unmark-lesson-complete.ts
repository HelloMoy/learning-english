import type { LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { LessonRepository } from "@/domain/ports/lesson-repository/lesson-repository";
import type { ProgressTracker } from "@/domain/ports/progress-tracker/progress-tracker";
import { err, ok, Result, ResultAsync } from "@/domain/result/result";

import type { UnmarkLessonCompleteErrors } from "./unmark-lesson-complete.errors";

const toInternalError = (cause: unknown): UnmarkLessonCompleteErrors => ({
  kind: "internal-error",
  cause,
});

/**
 * Use case: clear a lesson's completion — the learner's own undo of
 * `markLessonComplete`. Validates the lesson exists and then writes through
 * the `ProgressTracker` port. Un-marking a lesson that was never marked is
 * not an error: the port's writer is idempotent, so the caller never has to
 * ask whether the mark is there first.
 */
export type UnmarkLessonComplete = (input: {
  lessonId: LessonId;
}) => ResultAsync<{ completed: false }, UnmarkLessonCompleteErrors>;

export const makeUnmarkLessonComplete = (deps: {
  lessons: LessonRepository;
  progress: ProgressTracker;
}): UnmarkLessonComplete => {
  const useCase = (input: { lessonId: LessonId }) =>
    ResultAsync.fromPromise(deps.lessons.byId(input.lessonId), toInternalError)
      .andThen((lesson): Result<Lesson, UnmarkLessonCompleteErrors> => {
        if (lesson === null) {
          return err({ kind: "lesson-not-found" });
        }
        return ok(lesson);
      })
      .andThen((lesson) =>
        ResultAsync.fromPromise(deps.progress.unmarkComplete(lesson.id), toInternalError).map(
          () => ({ completed: false as const }),
        ),
      );

  return useCase as UnmarkLessonComplete;
};
