import type { Course } from "@/domain/entities/course/course";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import type { Slug } from "@/domain/entities/slug/slug";
import type { CourseRepository } from "@/domain/ports/course-repository/course-repository";
import type { LessonRepository } from "@/domain/ports/lesson-repository/lesson-repository";
import type { ModuleRepository } from "@/domain/ports/module-repository/module-repository";
import { err, ok, Result, ResultAsync } from "@/domain/result/result";

import type { FindModuleForViewErrors } from "./find-module-for-view.errors";

export type ModuleForView = {
  course: Course;
  module: Module;
  lessons: Lesson[];
};

export type FindModuleForView = (input: {
  courseSlug: Slug;
  moduleSlug: Slug;
}) => ResultAsync<ModuleForView, FindModuleForViewErrors>;

const toInternalError = (cause: unknown): FindModuleForViewErrors => ({
  kind: "internal-error",
  cause,
});

const bySequence = <T extends { sequence: number }>(a: T, b: T): number => a.sequence - b.sequence;

export const makeFindModuleForView = (deps: {
  courses: CourseRepository;
  modules: ModuleRepository;
  lessons: LessonRepository;
}): FindModuleForView => {
  const useCase = ({
    courseSlug,
    moduleSlug,
  }: {
    courseSlug: Slug;
    moduleSlug: Slug;
  }): ResultAsync<ModuleForView, FindModuleForViewErrors> =>
    ResultAsync.fromPromise(deps.courses.bySlug(courseSlug), toInternalError)
      .andThen((course): Result<{ course: Course }, FindModuleForViewErrors> => {
        if (!course) {
          return err({ kind: "course-not-found" });
        }
        return ok({ course });
      })
      .andThen(({ course }) =>
        ResultAsync.fromPromise(
          deps.modules.byCourseAndSlug(course.id, moduleSlug),
          toInternalError,
        ).andThen((mod): Result<{ course: Course; mod: Module }, FindModuleForViewErrors> => {
          if (!mod) {
            return err({ kind: "module-not-in-course" });
          }
          return ok({ course, mod });
        }),
      )
      .andThen(({ course, mod }) =>
        ResultAsync.fromPromise(deps.lessons.listByCourse(course.id), toInternalError).map(
          (lessons) => {
            const inThisModule = lessons
              .filter((lesson) => lesson.moduleId === mod.id)
              .sort(bySequence);
            return { course, module: mod, lessons: inThisModule };
          },
        ),
      );
  return useCase;
};
