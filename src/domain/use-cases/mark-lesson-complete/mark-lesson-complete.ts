import type { LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { LessonRepository } from "@/domain/ports/lesson-repository/lesson-repository";
import type { ProgressTracker } from "@/domain/ports/progress-tracker/progress-tracker";
import { err, ok, Result, ResultAsync } from "@/domain/result/result";

import type { MarkLessonCompleteErrors } from "./mark-lesson-complete.errors";

const toInternalError = (cause: unknown): MarkLessonCompleteErrors => ({
  kind: "internal-error",
  cause,
});

/**
 * Use case: mark a lesson as complete. Validates the lesson exists and then
 * writes through the `ProgressTracker` port. In v1 the tracker is in-memory
 * and ephemeral; the use case contract is unchanged when persistence arrives.
 */
export type MarkLessonComplete = (input: {
  lessonId: LessonId;
}) => ResultAsync<{ completed: true }, MarkLessonCompleteErrors>;

export const makeMarkLessonComplete = (deps: {
  lessons: LessonRepository;
  progress: ProgressTracker;
}): MarkLessonComplete => {
  const useCase = (input: { lessonId: LessonId }) =>
    ResultAsync.fromPromise(deps.lessons.byId(input.lessonId), toInternalError)
      .andThen((lesson): Result<Lesson, MarkLessonCompleteErrors> => {
        if (lesson === null) {
          return err({ kind: "lesson-not-found" });
        }
        return ok(lesson);
      })
      .andThen((lesson) =>
        ResultAsync.fromPromise(deps.progress.markComplete(lesson.id), toInternalError).map(() => ({
          completed: true as const,
        })),
      );

  return useCase as MarkLessonComplete;
};
