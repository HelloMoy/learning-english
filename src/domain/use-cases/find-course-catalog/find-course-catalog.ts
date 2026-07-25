import type { Course } from "@/domain/entities/course/course";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { CourseRepository } from "@/domain/ports/course-repository/course-repository";
import type { LessonRepository } from "@/domain/ports/lesson-repository/lesson-repository";
import type { ModuleRepository } from "@/domain/ports/module-repository/module-repository";
import { ResultAsync } from "@/domain/result/result";

import type { FindCourseCatalogErrors } from "./find-course-catalog.errors";

/**
 * One row of the locale-home course catalog. Includes the deterministic
 * entry lesson so the course card can render a CTA and an artwork poster
 * without the page having to read ports directly.
 */
export type CourseCatalogEntry = {
  course: Course;
  firstLesson: Lesson | null;
};

export type CourseCatalog = {
  entries: CourseCatalogEntry[];
};

export type FindCourseCatalog = () => ResultAsync<CourseCatalog, FindCourseCatalogErrors>;

const toInternalError = (cause: unknown): FindCourseCatalogErrors => ({
  kind: "internal-error",
  cause,
});

const bySequenceThenTitle = (a: { sequence: number }, b: { sequence: number }): number =>
  a.sequence - b.sequence;

const pickFirstLesson = (lessons: ReadonlyArray<Lesson>): Lesson | null => {
  if (lessons.length === 0) return null;
  const sorted = [...lessons].sort(bySequenceThenTitle);
  return sorted[0] ?? null;
};

export const makeFindCourseCatalog = (deps: {
  courses: CourseRepository;
  modules: ModuleRepository;
  lessons: LessonRepository;
}): FindCourseCatalog => {
  const useCase = (): ResultAsync<CourseCatalog, FindCourseCatalogErrors> =>
    ResultAsync.fromPromise(deps.courses.listAvailable(), toInternalError).andThen(
      (courses): ResultAsync<CourseCatalog, FindCourseCatalogErrors> => {
        if (courses.length === 0) {
          return ResultAsync.fromSafePromise(Promise.resolve({ entries: [] }));
        }
        return ResultAsync.fromPromise(
          Promise.all(
            courses.map((course) =>
              Promise.all([
                deps.modules.listByCourse(course.id),
                deps.lessons.listByCourse(course.id),
              ]).then(([modules, lessons]) => {
                const lessonsInFirstModule =
                  modules.length > 0
                    ? lessons.filter((lesson) => lesson.moduleId === modules[0]?.id)
                    : [];
                return {
                  course,
                  firstLesson: pickFirstLesson(lessonsInFirstModule),
                };
              }),
            ),
          ).then((entries) => ({ entries })),
          toInternalError,
        );
      },
    );
  return useCase;
};
