import type { Course } from "@/domain/entities/course/course";
import type { LessonId, ModuleId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import type { Slug } from "@/domain/entities/slug/slug";
import type { CourseRepository } from "@/domain/ports/course-repository/course-repository";
import type { LessonRepository } from "@/domain/ports/lesson-repository/lesson-repository";
import type { ModuleRepository } from "@/domain/ports/module-repository/module-repository";
import { err, ok, Result, ResultAsync } from "@/domain/result/result";

import type { FindCourseForViewErrors } from "./find-course-for-view.errors";

/**
 * One lesson as the course overview sees it: its position in the module, its
 * title, its runtime and its artwork, and nothing more.
 *
 * @remarks
 * `durationSeconds` is zero for reading lessons, which have no runtime, so
 * completion can still be derived from a saved playback position measured
 * against it. `poster` is absent — not `undefined` — for reading lessons,
 * whose schema has no such field.
 */
export type ModuleLesson = {
  id: LessonId;
  sequence: number;
  title: string;
  durationSeconds: number;
  poster?: string;
};

/**
 * What progress accounting needs of a lesson: which lesson it is, and how long
 * it runs. Any {@link ModuleLesson} satisfies it.
 */
export type LessonRuntime = Pick<ModuleLesson, "id" | "durationSeconds">;

/**
 * What a course overview needs to know about one module without opening it:
 * how many lessons it holds, how long they run in total, and every lesson in
 * `sequence` order — enough to preview the module's artwork, count how far the
 * learner has got across all of it, and name whichever lesson comes next.
 */
export type ModuleSummary = {
  moduleId: ModuleId;
  lessonCount: number;
  totalDurationSeconds: number;
  lessons: ModuleLesson[];
};

export type CourseForView = {
  course: Course;
  modules: Module[];
  /** One entry per module, in the same `sequence` order as `modules`. */
  moduleSummaries: ModuleSummary[];
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

const toModuleLesson = (lesson: Lesson): ModuleLesson => ({
  id: lesson.id,
  sequence: lesson.sequence,
  title: lesson.title,
  durationSeconds: lesson.kind === "video" ? lesson.durationSeconds : 0,
  // An absent poster stays absent rather than becoming `poster: undefined`,
  // so the optional field is genuinely optional for consumers. Reading
  // lessons have no such field at all.
  ...(lesson.kind === "video" && lesson.poster !== undefined ? { poster: lesson.poster } : {}),
});

/**
 * Group the course's lessons by module and reduce each group to what a
 * course overview card needs.
 *
 * Both arguments come from the two fetches the use case already performs —
 * summarizing costs no extra round-trip. A module with no lessons still gets
 * a zero summary so the view can pair summaries with modules positionally.
 */
const summarizeModules = (
  modules: ReadonlyArray<Module>,
  lessons: ReadonlyArray<Lesson>,
): ModuleSummary[] => {
  const lessonsByModule = new Map<ModuleId, Lesson[]>(modules.map((module) => [module.id, []]));
  for (const lesson of lessons) {
    lessonsByModule.get(lesson.moduleId)?.push(lesson);
  }
  return [...modules].sort(bySequence).map((module) => {
    const moduleLessons = [...(lessonsByModule.get(module.id) ?? [])].sort(bySequence);
    return {
      moduleId: module.id,
      lessonCount: moduleLessons.length,
      totalDurationSeconds: moduleLessons.reduce(
        (total, lesson) => total + (lesson.kind === "video" ? lesson.durationSeconds : 0),
        0,
      ),
      lessons: moduleLessons.map(toModuleLesson),
    };
  });
};

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
          moduleSummaries: summarizeModules(modules, lessons),
          firstLesson: pickFirstLessonInFirstModule(modules, lessons),
        }),
      );
  return useCase;
};
