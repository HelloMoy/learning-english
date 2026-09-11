import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { refreshSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import { finishThresholdSeconds } from "@/lib/watch-progress/watch-progress";

import { faker } from "@faker-js/faker";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

import { useCourseWatchProgress } from "./use-course-watch-progress";

const LESSON_DURATION_SECONDS = 600;

const courseId = CourseId.parse(faker.string.uuid());

const makeModuleId = (): ModuleId => ModuleId.parse(faker.string.uuid());

const makeVideoLesson = (moduleId: ModuleId, sequence: number): Lesson =>
  Lesson.parse({
    kind: "video",
    id: LessonId.parse(faker.string.uuid()),
    courseId,
    moduleId,
    sequence,
    title: faker.lorem.words(3),
    description: faker.lorem.sentence(),
    source: faker.internet.url(),
    durationSeconds: LESSON_DURATION_SECONDS,
  });

const makeReadingLesson = (moduleId: ModuleId, sequence: number): Lesson =>
  Lesson.parse({
    kind: "reading",
    id: LessonId.parse(faker.string.uuid()),
    courseId,
    moduleId,
    sequence,
    title: faker.lorem.words(3),
    body: faker.lorem.sentence(),
  });

const makeModuleLessons = (moduleId: ModuleId, lessonCount: number): Lesson[] =>
  Array.from({ length: lessonCount }, (_, index) => makeVideoLesson(moduleId, index + 1));

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

beforeEach(() => {
  window.localStorage.clear();
  announceStorageChange();
});

describe("useCourseWatchProgress", () => {
  describe("GIVEN a course the learner has never opened", () => {
    test("WHEN the progress is read THEN nothing is counted and the fraction is zero", () => {
      const lessons = makeModuleLessons(makeModuleId(), 21);

      const { result } = renderHook(() => useCourseWatchProgress(lessons));

      expect(result.current.completedCount).toBe(0);
      expect(result.current.lessonCount).toBe(21);
      expect(result.current.completedFraction).toBe(0);
    });
  });

  describe("GIVEN lessons completed by both routes", () => {
    test("WHEN one was marked and another watched to the end THEN both are counted", () => {
      // It defers to `countsAsComplete` rather than re-implementing the rule,
      // so a card can never disagree with the outline rows it opens.
      const lessons = makeModuleLessons(makeModuleId(), 21);
      markCompleteInStorage(lessons[0]!.id);
      storePosition(lessons[1]!.id, finishThresholdSeconds(LESSON_DURATION_SECONDS));
      announceStorageChange();

      const { result } = renderHook(() => useCourseWatchProgress(lessons));

      expect(result.current.completedCount).toBe(2);
    });

    test("WHEN a lesson was only partly watched THEN it is not counted", () => {
      const lessons = makeModuleLessons(makeModuleId(), 21);
      storePosition(lessons[0]!.id, 240);
      announceStorageChange();

      const { result } = renderHook(() => useCourseWatchProgress(lessons));

      expect(result.current.completedCount).toBe(0);
    });
  });

  describe("GIVEN a course part of the way through", () => {
    test("WHEN the fraction is read THEN it is the completed share of the course", () => {
      const lessons = makeModuleLessons(makeModuleId(), 21);
      for (const lesson of lessons.slice(0, 8)) markCompleteInStorage(lesson.id);
      announceStorageChange();

      const { result } = renderHook(() => useCourseWatchProgress(lessons));

      expect(result.current.completedCount).toBe(8);
      expect(result.current.completedFraction).toBeCloseTo(8 / 21);
    });
  });

  describe("GIVEN a course of several modules", () => {
    test("WHEN the breakdown is read THEN each module is counted on its own", () => {
      // Variant A draws one meter segment per module, so the per-module share
      // has to be available without calling a hook once per module.
      const firstModuleId = makeModuleId();
      const secondModuleId = makeModuleId();
      const firstModule = makeModuleLessons(firstModuleId, 4);
      const secondModule = makeModuleLessons(secondModuleId, 6);
      for (const lesson of firstModule) markCompleteInStorage(lesson.id);
      markCompleteInStorage(secondModule[0]!.id);
      announceStorageChange();

      const { result } = renderHook(() =>
        useCourseWatchProgress([...firstModule, ...secondModule]),
      );

      expect(result.current.byModuleId.get(firstModuleId)).toEqual({
        completedCount: 4,
        lessonCount: 4,
      });
      expect(result.current.byModuleId.get(secondModuleId)).toEqual({
        completedCount: 1,
        lessonCount: 6,
      });
    });

    test("WHEN a module holds nothing completed THEN it is present with a zero count", () => {
      // Absent and zero are different answers; the segment still has to draw.
      const untouchedModuleId = makeModuleId();
      const lessons = makeModuleLessons(untouchedModuleId, 5);

      const { result } = renderHook(() => useCourseWatchProgress(lessons));

      expect(result.current.byModuleId.get(untouchedModuleId)).toEqual({
        completedCount: 0,
        lessonCount: 5,
      });
    });
  });

  describe("GIVEN a course holding a lesson with no runtime", () => {
    test("WHEN that reading lesson was marked THEN it counts, and an unmarked one does not", () => {
      const moduleId = makeModuleId();
      const marked = makeReadingLesson(moduleId, 1);
      const unmarked = makeReadingLesson(moduleId, 2);
      markCompleteInStorage(marked.id);
      announceStorageChange();

      const { result } = renderHook(() => useCourseWatchProgress([marked, unmarked]));

      expect(result.current.completedCount).toBe(1);
      expect(result.current.lessonCount).toBe(2);
    });
  });

  describe("GIVEN a course holding no lessons", () => {
    test("WHEN the progress is read THEN nothing is divided", () => {
      const { result } = renderHook(() => useCourseWatchProgress([]));

      expect(result.current.completedCount).toBe(0);
      expect(result.current.lessonCount).toBe(0);
      expect(result.current.completedFraction).toBe(0);
      expect(result.current.byModuleId.size).toBe(0);
    });
  });
});
