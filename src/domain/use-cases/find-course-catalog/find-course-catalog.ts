import type { Course } from "@/domain/entities/course/course";
import type { LessonId, ModuleId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import type { CourseRepository } from "@/domain/ports/course-repository/course-repository";
import type { LessonRepository } from "@/domain/ports/lesson-repository/lesson-repository";
import type { ModuleRepository } from "@/domain/ports/module-repository/module-repository";
import { ResultAsync } from "@/domain/result/result";

import type { FindCourseCatalogErrors } from "./find-course-catalog.errors";

/**
 * One lesson reduced to what progress accounting needs: which lesson it is,
 * the module it belongs to, and how long it runs.
 *
 * @remarks
 * A reading lesson reports a `durationSeconds` of zero — there is nothing to
 * watch to the end — the same convention `findCourseForView` uses, so every
 * surface counts completion alike.
 */
export type LessonProgressSlice = {
  id: LessonId;
  moduleId: ModuleId;
  durationSeconds: number;
};

/**
 * One row of the locale-home course catalog. Includes the deterministic
 * entry lesson so the home can link into the course without reading ports,
 * every module so the home can list a course's progress lesson by lesson,
 * and each lesson's progress slice so that progress is counted in the browser
 * without a second round trip.
 */
export type CourseCatalogEntry = {
  course: Course;
  firstLesson: Lesson | null;
  modules: Module[];
  lessonRuntimes: LessonProgressSlice[];
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

/**
 * Reduce a lesson to its progress slice.
 *
 * @param lesson - A video or reading lesson
 * @returns Its id, module and runtime; `0` seconds for a reading lesson
 */
export const toLessonProgressSlice = (lesson: Lesson): LessonProgressSlice => ({
  id: lesson.id,
  moduleId: lesson.moduleId,
  durationSeconds: lesson.kind === "video" ? lesson.durationSeconds : 0,
});

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
                  modules,
                  lessonRuntimes: lessons.map(toLessonProgressSlice),
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
