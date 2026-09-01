import type { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import type { Course } from "@/domain/entities/course/course";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import type { CourseRepository } from "@/domain/ports/course-repository/course-repository";
import type { LessonRepository } from "@/domain/ports/lesson-repository/lesson-repository";
import type { ModuleRepository } from "@/domain/ports/module-repository/module-repository";
import { err, ok, Result, ResultAsync } from "@/domain/result/result";

import type { FindContinueWatchingErrors } from "./find-continue-watching.errors";

/**
 * What the home's "Continue watching" panel renders: the three entities
 * behind a stored {@link ContinueWatchingLocation}, and nothing else.
 *
 * Deliberately narrower than `LessonView`. That use case also loads the
 * lesson's resources, the next lesson, and every module and lesson of the
 * course — 107 lessons for the Advanced course — to fill a panel that shows
 * a breadcrumb, a title and a link.
 */
export type ContinueWatchingView = {
  course: Course;
  module: Module;
  lesson: Lesson;
};

export type FindContinueWatching = (
  input: ContinueWatchingLocation,
) => ResultAsync<ContinueWatchingView, FindContinueWatchingErrors>;

const toInternalError = (cause: unknown): FindContinueWatchingErrors => ({
  kind: "internal-error",
  cause,
});

/**
 * Use case: resolve a stored location into the entities the home needs.
 *
 * A location that no longer resolves is an ordinary outcome, not a fault:
 * lessons get renamed, moved and removed while a device holds the record
 * that points at them. Each step therefore fails with the variant that
 * names the step, and the caller decides what to show — the home shows
 * nothing at all.
 */
export const makeFindContinueWatching = (deps: {
  courses: CourseRepository;
  modules: ModuleRepository;
  lessons: LessonRepository;
}): FindContinueWatching => {
  const useCase = ({
    courseSlug,
    moduleSlug,
    lessonId,
  }: ContinueWatchingLocation): ResultAsync<ContinueWatchingView, FindContinueWatchingErrors> =>
    ResultAsync.fromPromise(deps.courses.bySlug(courseSlug), toInternalError)
      .andThen((course): Result<{ course: Course }, FindContinueWatchingErrors> => {
        if (!course) {
          return err({ kind: "course-not-found" });
        }
        return ok({ course });
      })
      .andThen(({ course }) =>
        ResultAsync.fromPromise(
          Promise.all([
            deps.modules.byCourseAndSlug(course.id, moduleSlug),
            deps.lessons.byId(lessonId),
          ]),
          toInternalError,
        ).andThen(([mod, lesson]): Result<ContinueWatchingView, FindContinueWatchingErrors> => {
          if (!mod) {
            return err({ kind: "module-not-in-course" });
          }
          // A lesson that still exists but has moved to another module
          // would render a breadcrumb that lies, so it fails the same way
          // a deleted one does.
          if (!lesson || lesson.moduleId !== mod.id) {
            return err({ kind: "lesson-not-in-module" });
          }
          return ok({ course, module: mod, lesson });
        }),
      );
  return useCase;
};
