import type { Course } from "@/domain/entities/course/course";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import type { Slug } from "@/domain/entities/slug/slug";
import type { CourseRepository } from "@/domain/ports/course-repository/course-repository";
import type { LessonRepository } from "@/domain/ports/lesson-repository/lesson-repository";
import type { ModuleRepository } from "@/domain/ports/module-repository/module-repository";
import { err, ok, Result, ResultAsync } from "@/domain/result/result";

import type { FindCourseForViewErrors } from "./find-course-for-view.errors";

export type CourseForView = {
  course: Course;
  modules: Module[];
  firstLesson: Lesson | null;
};

export type FindCourseForView = (input: {
  courseSlug: Slug;
}) => ResultAsync<CourseForView, FindCourseForViewErrors>;

const toInternalError = (cause: unknown): FindCourseForViewErrors => ({
  kind: "internal-error",
  cause,
});

const bySequence = <T extends { sequence: number }>(a: T, b: T): number => a.sequence - b.sequence;

const pickFirstLessonInFirstModule = (
  modules: ReadonlyArray<Module>,
  lessons: ReadonlyArray<Lesson>,
): Lesson | null => {
  if (modules.length === 0) return null;
  const firstModule = [...modules].sort(bySequence)[0];
  if (!firstModule) return null;
  const lessonsInFirstModule = lessons
    .filter((lesson) => lesson.moduleId === firstModule.id)
    .sort(bySequence);
  return lessonsInFirstModule[0] ?? null;
};

export const makeFindCourseForView = (deps: {
  courses: CourseRepository;
  modules: ModuleRepository;
  lessons: LessonRepository;
}): FindCourseForView => {
  const useCase = ({
    courseSlug,
  }: {
    courseSlug: Slug;
  }): ResultAsync<CourseForView, FindCourseForViewErrors> =>
    ResultAsync.fromPromise(deps.courses.bySlug(courseSlug), toInternalError)
      .andThen((course): Result<{ course: Course }, FindCourseForViewErrors> => {
        if (!course) {
          return err({ kind: "course-not-found" });
        }
        return ok({ course });
      })
      .andThen(({ course }) =>
        ResultAsync.fromPromise(
          Promise.all([
            deps.modules.listByCourse(course.id),
            deps.lessons.listByCourse(course.id),
          ]).then(([modules, lessons]) => ({ course, modules, lessons })),
          toInternalError,
        ),
      )
      .andThen(({ course, modules, lessons }): Result<CourseForView, FindCourseForViewErrors> =>
        ok({
          course,
          modules: [...modules].sort(bySequence),
          firstLesson: pickFirstLessonInFirstModule(modules, lessons),
        }),
      );
  return useCase;
};
