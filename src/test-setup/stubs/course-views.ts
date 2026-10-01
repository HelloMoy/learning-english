import { ContinueWatchingRecord } from "@/domain/entities/continue-watching-record/continue-watching-record";
import type { LevelStanding } from "@/domain/entities/course-standing/course-standing";
import { Course } from "@/domain/entities/course/course";
import { LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type {
  CourseForView,
  ModuleLesson,
} from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import {
  courseCardModel,
  courseShelf,
  type CourseCardModel,
} from "@/lib/course-shelf/course-shelf";

import { faker } from "@faker-js/faker";

/** Every fixture video runs ten minutes. */
export const FIXTURE_LESSON_SECONDS = 600;

/**
 * Test double: a course as `findCourseForView` returns it, with
 * `lessonsPerModule[i]` ten-minute videos in module `i + 1`
 * (`module-1`, `module-2`, …). Posters are set so artwork renders.
 */
export function aCourseView(
  slug: string,
  sequence: number,
  lessonsPerModule: ReadonlyArray<number>,
): CourseForView & { standing: LevelStanding } {
  const course = Course.parse({
    id: faker.string.uuid(),
    slug,
    title: faker.lorem.words(2),
    description: faker.lorem.sentence(),
    language: "en",
    lessonCount: lessonsPerModule.reduce((total, count) => total + count, 0),
    moduleCount: lessonsPerModule.length,
    track: "level",
    sequence,
  });
  const modules = lessonsPerModule.map((_, index) =>
    Module.parse({
      id: ModuleId.parse(faker.string.uuid()),
      courseId: course.id,
      slug: `module-${index + 1}`,
      title: faker.lorem.words(2),
      sequence: index + 1,
    }),
  );
  const moduleSummaries = modules.map((courseModule, index) => {
    const lessons: ModuleLesson[] = Array.from({ length: lessonsPerModule[index]! }, (_, at) => ({
      id: LessonId.parse(faker.string.uuid()),
      sequence: at + 1,
      title: faker.lorem.words(3),
      durationSeconds: FIXTURE_LESSON_SECONDS,
      poster: `/posters/${slug}/${courseModule.slug}/${at + 1}.jpg`,
    }));
    return {
      moduleId: courseModule.id,
      lessonCount: lessons.length,
      totalDurationSeconds: lessons.length * FIXTURE_LESSON_SECONDS,
      lessons,
    };
  });
  return {
    course,
    standing: { kind: "level", number: sequence },
    modules,
    moduleSummaries,
    firstLesson: null,
  };
}

/** Test double: the same fixture course, standing as reference material rather than a level. */
export function asReference(view: CourseForView): CourseForView {
  return {
    ...view,
    course: Course.parse({ ...view.course, track: "reference" }),
    standing: { kind: "reference" },
  };
}

/** The `lessonIndex`-th video of the `moduleIndex`-th module of a fixture view. */
export function lessonOf(view: CourseForView, moduleIndex: number, lessonIndex: number) {
  return view.moduleSummaries[moduleIndex]!.lessons[lessonIndex]!;
}

/**
 * Test double: the card model of an enrolled fixture course, read through the
 * real `courseShelf` and `courseCardModel`.
 */
export function aCardModel(
  view: CourseForView,
  options: {
    recordAt?: [moduleIndex: number, lessonIndex: number];
    watchedAt?: number;
    positions?: ReadonlyMap<string, number>;
    completed?: ReadonlyArray<string>;
    claimedPrizes?: ReadonlyArray<string>;
  } = {},
): CourseCardModel {
  const records = options.recordAt
    ? [
        ContinueWatchingRecord.parse({
          location: {
            courseSlug: view.course.slug,
            moduleSlug: view.modules[options.recordAt[0]]!.slug,
            lessonId: lessonOf(view, ...options.recordAt).id,
          },
          watchedAt: options.watchedAt ?? 1_000,
        }),
      ]
    : [];
  const positions = options.positions ?? new Map<string, number>();
  const shelf = courseShelf({
    courses: [view],
    enrolledSlugs: new Set([view.course.slug]),
    records,
    completedIds: new Set(options.completed ?? []),
    positions,
  });
  return courseCardModel(shelf.featured!, {
    positions,
    claimedPrizes: new Set(options.claimedPrizes ?? []),
  });
}

/** Every video id of a fixture view. */
export function everyVideoOf(view: CourseForView): string[] {
  return view.moduleSummaries.flatMap(({ lessons }) => lessons.map(({ id }) => id));
}
