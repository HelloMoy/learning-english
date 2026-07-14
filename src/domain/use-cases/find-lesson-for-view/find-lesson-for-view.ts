import type { Course } from "@/domain/entities/course/course";
import type { LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import type { Resource } from "@/domain/entities/resource/resource";
import type { Slug } from "@/domain/entities/slug/slug";
import type { CourseRepository } from "@/domain/ports/course-repository/course-repository";
import type { LessonRepository } from "@/domain/ports/lesson-repository/lesson-repository";
import type { ModuleRepository } from "@/domain/ports/module-repository/module-repository";
import type { ResourceRepository } from "@/domain/ports/resource-repository/resource-repository";
import { err, ok, Result, ResultAsync } from "@/domain/result/result";
import type { FindNextLesson } from "@/domain/use-cases/find-next-lesson/find-next-lesson";

import type { FindLessonForViewErrors } from "./find-lesson-for-view.errors";

const toInternalError = (cause: unknown): FindLessonForViewErrors => ({
  kind: "internal-error",
  cause,
});

/**
 * The view object the Lesson Page renders. Composed by the use case so the
 * Server Component does not have to reach for ports directly. `modules` and
 * `lessons` feed the Outline (sidebar); the rest is the page body.
 */
export type LessonView = {
  course: Course;
  module: Module;
  lesson: Lesson;
  resources: Resource[];
  nextLesson: Lesson | null;
  modules: Module[];
  lessons: Lesson[];
};

/**
 * Use case: resolve the slugs and id from the route into the full view the
 * Lesson Page needs to render. Returns a `ResultAsync<LessonView, ...>` so
 * delivery adapters can map errors to a 404 page or a localized message
 * without the use case knowing about HTTP or React.
 */
export type FindLessonForView = (input: {
  courseSlug: Slug;
  moduleSlug: Slug;
  lessonId: LessonId;
}) => ResultAsync<LessonView, FindLessonForViewErrors>;

export const makeFindLessonForView = (deps: {
  courses: CourseRepository;
  modules: ModuleRepository;
  lessons: LessonRepository;
  resources: ResourceRepository;
  findNextLesson: FindNextLesson;
}): FindLessonForView => {
  const useCase = ({
    courseSlug,
    moduleSlug,
    lessonId,
  }: {
    courseSlug: Slug;
    moduleSlug: Slug;
    lessonId: LessonId;
  }): ResultAsync<LessonView, FindLessonForViewErrors> =>
    // Step 1 — resolve the course by slug. A short-circuit on missing.
    ResultAsync.fromPromise(deps.courses.bySlug(courseSlug), toInternalError)
      .andThen((course): Result<{ course: Course }, FindLessonForViewErrors> => {
        if (!course) {
          return err({ kind: "course-not-found" });
        }
        return ok({ course });
      })
      // Step 2 — fetch the module by (course, slug) in parallel with the
      // lesson by id. Both async ops are independent.
      .andThen(({ course }) =>
        ResultAsync.fromPromise(
          Promise.all([
            deps.modules.byCourseAndSlug(course.id, moduleSlug),
            deps.lessons.byId(lessonId),
          ]).then(([mod, lesson]) => ({ course, mod, lesson })),
          toInternalError,
        ),
      )
      // Step 3 — validate module + lesson. Returning a sync `Result` here
      // keeps the next andThen's return type uniform.
      .andThen(
        ({
          course,
          mod,
          lesson,
        }): Result<{ course: Course; mod: Module; lesson: Lesson }, FindLessonForViewErrors> => {
          if (!mod) {
            return err({ kind: "module-not-in-course" });
          }
          if (!lesson || lesson.moduleId !== mod.id) {
            return err({ kind: "lesson-not-in-module" });
          }
          return ok({ course, mod, lesson });
        },
      )
      // Step 4 — fetch the supporting data (resources, modules, lessons)
      // in parallel, then dispatch to findNextLesson.
      .andThen(({ course, mod, lesson }) =>
        ResultAsync.fromPromise(
          Promise.all([
            deps.resources.listByLesson(lesson.id),
            deps.modules.listByCourse(course.id),
            deps.lessons.listByCourse(course.id),
          ]).then(([resources, modules, lessons]) => ({
            course,
            mod,
            lesson,
            resources,
            modules,
            lessons,
          })),
          toInternalError,
        ),
      )
      // Step 5 — ask the use case for the next lesson and compose the view.
      .andThen(({ course, mod, lesson, resources, modules, lessons }) =>
        ResultAsync.fromPromise(
          deps.findNextLesson({ courseId: course.id, currentLessonId: lesson.id }),
          toInternalError,
        ).map((nextResult) => {
          const nextLesson = nextResult.isOk() ? nextResult.value : null;
          return {
            course,
            module: mod,
            lesson,
            resources,
            nextLesson,
            modules,
            lessons,
          };
        }),
      );

  return useCase;
};
