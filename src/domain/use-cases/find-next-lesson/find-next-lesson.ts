import type { CourseId, LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { CourseRepository } from "@/domain/ports/course-repository/course-repository";
import type { LessonRepository } from "@/domain/ports/lesson-repository/lesson-repository";
import { err, ok, ResultAsync } from "@/domain/result/result";

import type { FindNextLessonErrors } from "./find-next-lesson.errors";

/**
 * Type-narrowing helper used by `fromPromise` so a rejecting port is
 * surfaced as a domain error instead of bubbling out of the use case.
 */
const toInternalError = (cause: unknown): FindNextLessonErrors => ({
  kind: "internal-error",
  cause,
});

/**
 * Use case: given a course and a current lesson, recommend the next lesson
 * in the course (or `null` if the learner just finished the last lesson).
 *
 * Returns a `ResultAsync` so failures are part of the domain contract, not
 * exceptions that escape the boundary. Adapters (e.g. `next-safe-action`)
 * translate the `Err` variants to whatever their delivery mechanism expects.
 */
export type FindNextLesson = (input: {
  courseId: CourseId;
  currentLessonId: LessonId;
}) => ResultAsync<Lesson | null, FindNextLessonErrors>;

export const makeFindNextLesson = (deps: {
  courses: CourseRepository;
  lessons: LessonRepository;
}): FindNextLesson => {
  // The `ResultAsync` chain below is type-correct at runtime; the explicit
  // cast captures the contract `FindNextLesson` describes without forcing
  // TypeScript to thread neverthrow's generic parameters through every
  // `.andThen` call.
  const useCase = (({ courseId, currentLessonId }) => {
    // Step 1 — confirm the course exists. `fromPromise` swallows rejections
    // into the Err branch so a misbehaving adapter can never throw out of
    // the use case.
    return ResultAsync.fromPromise(deps.courses.byId(courseId), toInternalError).andThen(
      (found) => {
        if (!found) {
          return err<FindNextLessonErrors>({ kind: "course-not-found" });
        }

        // Step 2 — fetch and order the course's lessons.
        return ResultAsync.fromPromise(
          deps.lessons.listByCourse(courseId),
          toInternalError,
        ).andThen((lessons) => {
          const i = lessons.findIndex((l) => l.id === currentLessonId);
          if (i === -1) {
            return err<FindNextLessonErrors>({ kind: "lesson-not-in-course" });
          }
          return ok<Lesson | null>(lessons[i + 1] ?? null);
        });
      },
    );
  }) as FindNextLesson;

  return useCase;
};
