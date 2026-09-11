import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { refreshSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";

import { faker } from "@faker-js/faker";

/** Exactly the props `OutlineDrawer` takes, so a fixture can be spread into it. */
export type OutlineDrawerProps = {
  course: Course;
  modules: Module[];
  lessonsByModuleId: Map<string, Lesson[]>;
  currentLessonId: LessonId;
};

/**
 * A course fixture shaped like the one the drawer is used on.
 *
 * @internal
 */
export type CourseFixture = {
  props: OutlineDrawerProps;
  modules: Module[];
  lessons: Lesson[];
  currentLesson: Lesson;
  currentModule: Module;
};

const LESSON_DURATION_SECONDS = 600;

/**
 * Builds a course of `lessonsPerModule.length` modules, with the current lesson
 * placed at `currentLessonIndex` inside the module at `currentModuleIndex`.
 *
 * @remarks
 * Deliberately hands over no position reading. The drawer derives
 * `Module · Lesson N of M` itself from `modules` and `lessonsByModuleId`, so a
 * fixture that supplied it would route the tests around the code path
 * production takes.
 *
 * @param lessonsPerModule - How many lessons each module holds, in order
 * @param currentModuleIndex - Which module the current lesson belongs to
 * @param currentLessonIndex - Where the current lesson sits in that module
 * @returns The drawer's props plus the entities the assertions need
 *
 * @internal
 */
export function makeCourseFixture({
  lessonsPerModule,
  currentModuleIndex = 0,
  currentLessonIndex = 0,
}: {
  lessonsPerModule: number[];
  currentModuleIndex?: number;
  currentLessonIndex?: number;
}): CourseFixture {
  const courseId = CourseId.parse(faker.string.uuid());
  const course = Course.parse({
    id: courseId,
    slug: "basic-course",
    title: "Basic course",
    description: faker.lorem.sentence(),
    language: "en",
    lessonCount: lessonsPerModule.reduce((sum, count) => sum + count, 0),
    moduleCount: lessonsPerModule.length,
    sequence: 1,
  });

  const modules = lessonsPerModule.map((_, index) =>
    Module.parse({
      id: ModuleId.parse(faker.string.uuid()),
      courseId,
      slug: `module-${index + 1}`,
      title: index === currentModuleIndex ? "Consonants" : `Module ${index + 1}`,
      sequence: index + 1,
    }),
  );

  const lessonsByModuleId = new Map<string, Lesson[]>();
  const lessons: Lesson[] = [];
  modules.forEach((mod, moduleIndex) => {
    const bucket = Array.from({ length: lessonsPerModule[moduleIndex]! }, (_, lessonIndex) =>
      Lesson.parse({
        kind: "video",
        id: LessonId.parse(faker.string.uuid()),
        courseId,
        moduleId: mod.id,
        sequence: lessonIndex + 1,
        title: `Lesson ${moduleIndex + 1}.${lessonIndex + 1}`,
        description: faker.lorem.sentence(),
        source: "https://example.com/lesson.mp4",
        durationSeconds: LESSON_DURATION_SECONDS,
      }),
    );
    lessonsByModuleId.set(mod.id, bucket);
    lessons.push(...bucket);
  });

  const currentModule = modules[currentModuleIndex]!;
  const currentLesson = lessonsByModuleId.get(currentModule.id)![currentLessonIndex]!;

  return {
    props: { course, modules, lessonsByModuleId, currentLessonId: currentLesson.id },
    modules,
    lessons,
    currentLesson,
    currentModule,
  };
}

/**
 * Marks the given lessons complete in the browser's own store.
 *
 * @remarks
 * Shared by the drawer's tests and its stories: completion lives in
 * `localStorage`, so the only way to show a part-finished course is to put one
 * there. Both stores cache their snapshot, so the write has to be announced or
 * the component reads the stale one.
 *
 * @param lessons - The lessons to mark complete
 *
 * @internal
 */
export function seedCompletedLessons(lessons: readonly Lesson[]): void {
  for (const lesson of lessons) {
    window.localStorage.setItem(`learning-english:completed:${lesson.id}`, "1");
  }
  refreshSavedPlaybackPositions();
  window.dispatchEvent(new StorageEvent("storage", { key: null }));
}

/**
 * Empties the completion and playback stores.
 *
 * @remarks
 * Stories share one browser, so a story showing an untouched course has to
 * clear what the story before it seeded.
 *
 * @internal
 */
export function clearWatchProgress(): void {
  window.localStorage.clear();
  refreshSavedPlaybackPositions();
  window.dispatchEvent(new StorageEvent("storage", { key: null }));
}
