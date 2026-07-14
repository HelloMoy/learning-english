import type { CourseId, LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import type { CourseRepository } from "@/domain/ports/course-repository/course-repository";
import type { LessonRepository } from "@/domain/ports/lesson-repository/lesson-repository";
import type { ModuleRepository } from "@/domain/ports/module-repository/module-repository";
import { err, ok, Result, ResultAsync } from "@/domain/result/result";

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
 * Compute the next lesson given a validated current lesson, the course's
 * lessons, and the course's modules. Pure function; easy to unit-test.
 */
const computeNext = (
  current: Lesson,
  lessons: ReadonlyArray<Lesson>,
  modules: ReadonlyArray<Module>,
): Lesson | null => {
  // Step 1 — try the next lesson in the same module first.
  const sameModule = lessons
    .filter((l) => l.moduleId === current.moduleId)
    .slice()
    .sort((a, b) => a.sequence - b.sequence);
  const inModuleIndex = sameModule.findIndex((l) => l.id === current.id);
  const nextInModule = sameModule[inModuleIndex + 1];
  if (nextInModule) {
    return nextInModule;
  }
  // Step 2 — current is the last in its module. Cross to the next module
  // and return its first lesson (or `null` if this was the last module).
  const currentModuleIndex = modules.findIndex((m) => m.id === current.moduleId);
  const nextModule = modules[currentModuleIndex + 1];
  if (!nextModule) {
    return null;
  }
  const nextModuleLessons = lessons
    .filter((l) => l.moduleId === nextModule.id)
    .slice()
    .sort((a, b) => a.sequence - b.sequence);
  return nextModuleLessons[0] ?? null;
};

/**
 * Use case: given a course and a current lesson, recommend the next lesson
 * in the course. Crosses module boundaries — when the current lesson is the
 * last in its module, returns the first lesson of the next module; returns
 * `null` when the learner just finished the last lesson of the last module.
 */
export type FindNextLesson = (input: {
  courseId: CourseId;
  currentLessonId: LessonId;
}) => ResultAsync<Lesson | null, FindNextLessonErrors>;

export const makeFindNextLesson = (deps: {
  courses: CourseRepository;
  lessons: LessonRepository;
  modules: ModuleRepository;
}): FindNextLesson => {
  const useCase = ({
    courseId,
    currentLessonId,
  }: {
    courseId: CourseId;
    currentLessonId: LessonId;
  }): ResultAsync<Lesson | null, FindNextLessonErrors> =>
    // Step 1 — confirm the course exists. Returning a sync `Result` here
    // keeps the next andThen callback's return type a clean union
    // (always `Result<...>` from the success branch, never a mixed
    // `Result | ResultAsync` that TS can't unify).
    ResultAsync.fromPromise(deps.courses.byId(courseId), toInternalError)
      .andThen((found): Result<{ lessons: ReadonlyArray<Lesson> }, FindNextLessonErrors> => {
        if (!found) {
          return err({ kind: "course-not-found" });
        }
        return ok({ lessons: [] });
      })
      // Step 2 — fetch the course's lessons. Wrapped in andThen to keep
      // the chain flat.
      .andThen(() => ResultAsync.fromPromise(deps.lessons.listByCourse(courseId), toInternalError))
      // Step 3 — fetch the course's modules and validate the current
      // lesson in one stage. Returns the validated `current` + the
      // `lessons` + `modules` together so the next stage has what it
      // needs.
      .andThen((lessons) =>
        ResultAsync.fromPromise(deps.modules.listByCourse(courseId), toInternalError).map(
          (modules) => ({ lessons, modules }),
        ),
      )
      .andThen(({ lessons, modules }): Result<Lesson | null, FindNextLessonErrors> => {
        const currentIndex = lessons.findIndex((l) => l.id === currentLessonId);
        if (currentIndex === -1) {
          return err({ kind: "lesson-not-in-course" });
        }
        return ok(computeNext(lessons[currentIndex]!, lessons, modules));
      });

  return useCase;
};
