import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type { LessonProgressSlice } from "@/domain/use-cases/find-course-catalog/find-course-catalog";
import { refreshSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import type { AchievementLevel } from "@/lib/learner-achievements/learner-achievements";
import { finishThresholdSeconds } from "@/lib/watch-progress/watch-progress";

import { faker } from "@faker-js/faker";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

import { useLearnerAchievements } from "./use-learner-achievements";

const LESSON_DURATION_SECONDS = 600;

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
 * A fresh module and lessons per test.
 *
 * @remarks
 * Tickets and claims are stored, and the stores keep a module-level snapshot
 * that no test can clear from the outside. Fresh ids and a fresh slug per test
 * are what keep one test's storage out of the next one's.
 */
const aModuleWithLessons = (lessonCount = 3) => {
  const vowels = Module.parse({
    id: ModuleId.parse(faker.string.uuid()),
    courseId: course.id,
    slug: `vowels-${faker.string.alphanumeric(8)}`,
    title: "Vowels",
    sequence: 1,
  });
  const lessons: LessonProgressSlice[] = Array.from({ length: lessonCount }, (_, index) => ({
    id: LessonId.parse(faker.string.uuid()),
    moduleId: vowels.id,
    durationSeconds: LESSON_DURATION_SECONDS,
    title: faker.lorem.words(3),
    sequence: index + 1,
  }));
  const levels: AchievementLevel[] = [{ course, modules: [vowels], lessonRuntimes: lessons }];
  return { vowels, lessons, levels };
};

const markCompleteInStorage = (lessonId: LessonId): void => {
  window.localStorage.setItem(`learning-english:completed:${lessonId}`, "1");
};

const storePosition = (lessonId: LessonId, seconds: number): void => {
  window.localStorage.setItem(`learning-english:playback:${lessonId}`, seconds.toString());
};

/** Both stores cache their snapshot, so seeded storage has to be announced. */
const announceStorageChange = (): void => {
  act(() => {
    refreshSavedPlaybackPositions();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });
};

const earnedTicketIds = (levels: ReadonlyArray<AchievementLevel>) => {
  const { result } = renderHook(() => useLearnerAchievements(levels));
  return result.current.courses
    .flatMap(({ modules }) => modules)
    .flatMap(({ tickets }) => tickets)
    .filter((ticket) => ticket.isEarned)
    .map((ticket) => ticket.lessonId);
};

beforeEach(() => {
  window.localStorage.clear();
  announceStorageChange();
});

describe("useLearnerAchievements", () => {
  test("WHEN a lesson is marked complete THEN its ticket is earned", () => {
    const { lessons, levels } = aModuleWithLessons();
    markCompleteInStorage(lessons[0]!.id);
    announceStorageChange();

    expect(earnedTicketIds(levels)).toEqual([lessons[0]!.id]);
  });

  test("WHEN a lesson was watched to the end without a mark THEN its ticket is earned", () => {
    const { lessons, levels } = aModuleWithLessons();
    storePosition(lessons[1]!.id, finishThresholdSeconds(LESSON_DURATION_SECONDS));
    announceStorageChange();

    expect(earnedTicketIds(levels)).toEqual([lessons[1]!.id]);
  });

  test("WHEN a marked lesson is un-marked THEN it keeps the ticket it earned", () => {
    const { lessons, levels } = aModuleWithLessons();
    markCompleteInStorage(lessons[2]!.id);
    announceStorageChange();
    // Reading the achievements is what records the ticket, the way the
    // Achievements page does on a visit.
    expect(earnedTicketIds(levels)).toEqual([lessons[2]!.id]);

    window.localStorage.removeItem(`learning-english:completed:${lessons[2]!.id}`);
    announceStorageChange();

    expect(earnedTicketIds(levels)).toEqual([lessons[2]!.id]);
  });

  test("WHEN a prize has been claimed THEN its module reads as claimed", () => {
    const { vowels, levels } = aModuleWithLessons();
    window.localStorage.setItem(`learning-english:prize-claimed:${vowels.slug}`, "1");
    announceStorageChange();

    const { result } = renderHook(() => useLearnerAchievements(levels));

    expect(result.current.courses[0]?.modules[0]?.prizeState).toBe("claimed");
    expect(result.current.prizesRedeemed).toBe(1);
  });

  test("WHEN no prize has been claimed THEN a fully ticketed module only waits to be claimed", () => {
    const { lessons, levels } = aModuleWithLessons();
    for (const lesson of lessons) markCompleteInStorage(lesson.id);
    announceStorageChange();

    const { result } = renderHook(() => useLearnerAchievements(levels));

    expect(result.current.courses[0]?.modules[0]?.prizeState).toBe("ready");
    expect(result.current.prizesRedeemed).toBe(0);
  });
});
