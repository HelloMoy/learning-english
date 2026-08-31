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
 * How many of a module's lessons a summary carries in `leadingLessons`.
 *
 * The cap lives here rather than in the view so a module holding 31 lessons
 * cannot have all of them projected into one card. The course overview shows
 * a bounded preview and discloses the remainder from `lessonCount`.
 */
export const LEADING_LESSONS_CAP = 6;

/**
 * The slice of a Lesson a course-overview card needs: its position in the
 * module and its artwork, and nothing more.
 *
 * `poster` is absent — not `undefined` — for reading lessons, whose schema
 * has no such field.
 */
export type LeadingLesson = {
  id: LessonId;
  sequence: number;
  title: string;
  poster?: string;
};

/**
 * What a course overview needs to know about one module without opening it:
 * how many lessons it holds, how long they run in total, and enough of the
 * leading ones to show that the module is a container rather than a video.
 */
export type ModuleSummary = {
  moduleId: ModuleId;
  lessonCount: number;
  totalDurationSeconds: number;
  leadingLessons: LeadingLesson[];
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

const toLeadingLesson = (lesson: Lesson): LeadingLesson => ({
  id: lesson.id,
  sequence: lesson.sequence,
  title: lesson.title,
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
      leadingLessons: moduleLessons.slice(0, LEADING_LESSONS_CAP).map(toLeadingLesson),
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
