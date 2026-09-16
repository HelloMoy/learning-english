import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { refreshSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";

import { faker } from "@faker-js/faker";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

import { useModulePrize } from "./use-module-prize";

const course = Course.parse({
  id: CourseId.parse(faker.string.uuid()),
  slug: "basic-course",
  title: faker.lorem.words(2),
  description: faker.lorem.sentence(),
  language: "en",
  lessonCount: 3,
  moduleCount: 1,
  sequence: 1,
});

/**
 * A fresh module per test: the ticket and claim stores keep a module-level
 * snapshot, so fresh ids and a fresh slug keep one test's storage out of the
 * next one's.
 */
const aModuleWithLessons = (lessonCount = 3) => {
  const courseModule = Module.parse({
    id: ModuleId.parse(faker.string.uuid()),
    courseId: course.id,
    slug: `vowels-${faker.string.alphanumeric(8).toLowerCase()}`,
    title: "Vowels",
    sequence: 1,
  });
  const lessons = Array.from({ length: lessonCount }, (_, index) =>
    Lesson.parse({
      kind: "video",
      id: LessonId.parse(faker.string.uuid()),
      courseId: course.id,
      moduleId: courseModule.id,
      sequence: index + 1,
      title: faker.lorem.words(3),
      description: faker.lorem.sentence(),
      source: faker.internet.url(),
      durationSeconds: faker.number.int({ min: 60, max: 1200 }),
    }),
  );
  return { courseModule, lessons };
};

const markComplete = (lesson: Lesson): void => {
  window.localStorage.setItem(`learning-english:completed:${lesson.id}`, "1");
};

const claim = (courseModule: Module): void => {
  window.localStorage.setItem(`learning-english:prize-claimed:${courseModule.slug}`, "1");
};

const announceStorageChange = (): void => {
  act(() => {
    refreshSavedPlaybackPositions();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });
};

const readPrize = (courseModule: Module, lessons: ReadonlyArray<Lesson>) =>
  renderHook(() => useModulePrize({ course, module: courseModule, lessons })).result;

beforeEach(() => {
  window.localStorage.clear();
  announceStorageChange();
});

describe("useModulePrize", () => {
  test("WHEN no lesson has earned its ticket THEN the module's prize is locked with none of its tickets", () => {
    const { courseModule, lessons } = aModuleWithLessons(3);

    expect(readPrize(courseModule, lessons).current).toEqual({
      hasPrize: true,
      prize: "gift",
      state: "locked",
      ticketsEarned: 0,
      ticketCount: 3,
    });
  });

  test("WHEN some lessons are complete THEN the prize is collecting with those tickets", () => {
    const { courseModule, lessons } = aModuleWithLessons(3);
    markComplete(lessons[0]!);
    markComplete(lessons[1]!);
    announceStorageChange();

    expect(readPrize(courseModule, lessons).current).toMatchObject({
      state: "collecting",
      ticketsEarned: 2,
      ticketCount: 3,
    });
  });

  test("WHEN every lesson is complete and nothing is claimed THEN the prize is ready", () => {
    const { courseModule, lessons } = aModuleWithLessons(2);
    lessons.forEach(markComplete);
    announceStorageChange();

    expect(readPrize(courseModule, lessons).current).toMatchObject({
      state: "ready",
      ticketsEarned: 2,
    });
  });

  test("WHEN the prize was claimed on the counter THEN it reads as claimed", () => {
    const { courseModule, lessons } = aModuleWithLessons(2);
    lessons.forEach(markComplete);
    claim(courseModule);
    announceStorageChange();

    expect(readPrize(courseModule, lessons).current).toMatchObject({ state: "claimed" });
  });

  test("WHEN a completed lesson is un-marked THEN its ticket still counts", () => {
    const { courseModule, lessons } = aModuleWithLessons(2);
    lessons.forEach(markComplete);
    announceStorageChange();
    expect(readPrize(courseModule, lessons).current).toMatchObject({ state: "ready" });

    window.localStorage.removeItem(`learning-english:completed:${lessons[0]!.id}`);
    announceStorageChange();

    expect(readPrize(courseModule, lessons).current).toMatchObject({
      state: "ready",
      ticketsEarned: 2,
    });
  });

  test("WHEN the module is Vowels THEN its prize is the harmonica", () => {
    const { lessons } = aModuleWithLessons(1);
    const vowels = Module.parse({
      id: lessons[0]!.moduleId,
      courseId: course.id,
      slug: "2-vowels",
      title: "Vowels",
      sequence: 2,
    });

    expect(readPrize(vowels, lessons).current).toMatchObject({ prize: "harmonica" });
  });

  test("WHEN the module holds no lessons THEN it has no prize", () => {
    const { courseModule } = aModuleWithLessons(0);

    expect(readPrize(courseModule, []).current).toEqual({ hasPrize: false });
  });
});
