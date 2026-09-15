import { LessonId } from "@/domain/entities/ids/ids";
import type { ModuleLesson } from "@/domain/use-cases/find-course-for-view/find-course-for-view";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { moduleProgress, selectInitialModuleIndex, type ModuleProgress } from "./module-progress";

const MINUTE = 60;

const aLesson = (sequence: number, durationSeconds = 10 * MINUTE): ModuleLesson => ({
  id: LessonId.parse(faker.string.uuid()),
  sequence,
  title: faker.lorem.words(2),
  durationSeconds,
});

const aModule = (count: number): ModuleLesson[] =>
  Array.from({ length: count }, (_, index) => aLesson(index + 1));

const noMarks = new Set<string>();
const noPositions = new Map<string, number>();

describe("moduleProgress", () => {
  describe("GIVEN a module holding no lessons", () => {
    test("WHEN its progress is read THEN it is empty", () => {
      // Arrange + Act
      const progress = moduleProgress({
        lessons: [],
        completedIds: noMarks,
        positions: noPositions,
      });

      // Assert
      expect(progress).toEqual({ kind: "empty" });
    });
  });

  describe("GIVEN a module the learner has not touched", () => {
    test("WHEN its progress is read THEN it is not started AND targets the first lesson", () => {
      // Arrange
      const lessons = aModule(25);

      // Act
      const progress = moduleProgress({ lessons, completedIds: noMarks, positions: noPositions });

      // Assert
      expect(progress).toEqual({
        kind: "not-started",
        target: lessons[0],
        lessonCount: 25,
        upNext: lessons.slice(1, 4),
      });
    });

    test("WHEN a lesson has a saved position of zero THEN the module still counts as not started", () => {
      // Arrange
      const lessons = aModule(3);
      const positions = new Map([[lessons[1]!.id, 0]]);

      // Act
      const progress = moduleProgress({ lessons, completedIds: noMarks, positions });

      // Assert
      expect(progress.kind).toBe("not-started");
    });
  });

  describe("GIVEN the first three of 25 lessons complete AND the fourth part-watched", () => {
    const lessons = [
      aLesson(1, 22 * MINUTE),
      aLesson(2, 30 * MINUTE),
      aLesson(3, 13 * MINUTE),
      aLesson(4, 13 * MINUTE),
      ...Array.from({ length: 21 }, (_, index) => aLesson(index + 5, 10 * MINUTE)),
    ];
    const completedIds = new Set(lessons.slice(0, 3).map((lesson) => lesson.id));
    const positions = new Map([[lessons[3]!.id, 6 * MINUTE]]);

    test("WHEN its progress is read THEN it is in progress AND targets the fourth lesson", () => {
      // Act
      const progress = moduleProgress({ lessons, completedIds, positions });

      // Assert
      expect(progress).toMatchObject({
        kind: "in-progress",
        target: lessons[3],
        targetNumber: 4,
        completedCount: 3,
        lessonCount: 25,
      });
    });

    test("WHEN its progress is read THEN time left counts the target's remainder AND every unfinished lesson", () => {
      // Act
      const progress = moduleProgress({ lessons, completedIds, positions });

      // Assert
      expect(progress).toMatchObject({
        secondsLeftInTarget: 7 * MINUTE,
        secondsLeftInModule: 7 * MINUTE + 21 * 10 * MINUTE,
      });
    });

    test("WHEN its progress is read THEN up next lists the three lessons after the target", () => {
      // Act
      const progress = moduleProgress({ lessons, completedIds, positions });

      // Assert
      expect(progress).toMatchObject({ upNext: lessons.slice(4, 7) });
    });
  });

  describe("GIVEN a lesson watched to the end without a completion mark", () => {
    test("WHEN its progress is read THEN that lesson counts as complete", () => {
      // Arrange
      const lessons = aModule(2);
      const positions = new Map([[lessons[0]!.id, lessons[0]!.durationSeconds]]);

      // Act
      const progress = moduleProgress({ lessons, completedIds: noMarks, positions });

      // Assert
      expect(progress).toMatchObject({
        kind: "in-progress",
        completedCount: 1,
        target: lessons[1],
      });
    });
  });

  describe("GIVEN only the last lesson unfinished", () => {
    test("WHEN its progress is read THEN up next is empty", () => {
      // Arrange
      const lessons = aModule(4);
      const completedIds = new Set(lessons.slice(0, 3).map((lesson) => lesson.id));

      // Act
      const progress = moduleProgress({ lessons, completedIds, positions: noPositions });

      // Assert
      expect(progress).toMatchObject({ kind: "in-progress", target: lessons[3], upNext: [] });
    });
  });

  describe("GIVEN every lesson complete", () => {
    test("WHEN its progress is read THEN it is completed AND points back to the first lesson", () => {
      // Arrange
      const lessons = aModule(5);
      const completedIds = new Set(lessons.map((lesson) => lesson.id));

      // Act
      const progress = moduleProgress({ lessons, completedIds, positions: noPositions });

      // Assert
      expect(progress).toEqual({ kind: "completed", first: lessons[0], lessonCount: 5 });
    });
  });
});

describe("selectInitialModuleIndex", () => {
  const notStarted = { kind: "not-started" } as ModuleProgress;
  const inProgress = { kind: "in-progress" } as ModuleProgress;
  const completed = { kind: "completed" } as ModuleProgress;
  const empty = { kind: "empty" } as ModuleProgress;

  describe("GIVEN a module in progress after finished and untouched ones", () => {
    test("WHEN the initial selection is chosen THEN the module in progress is selected", () => {
      // Arrange + Act
      const index = selectInitialModuleIndex([completed, notStarted, inProgress, notStarted]);

      // Assert
      expect(index).toBe(2);
    });
  });

  describe("GIVEN no module in progress", () => {
    test("WHEN the initial selection is chosen THEN the first unfinished module is selected", () => {
      // Arrange + Act
      const index = selectInitialModuleIndex([completed, empty, notStarted, notStarted]);

      // Assert
      expect(index).toBe(2);
    });
  });

  describe("GIVEN every module finished", () => {
    test("WHEN the initial selection is chosen THEN the first module is selected", () => {
      // Arrange + Act
      const index = selectInitialModuleIndex([completed, completed]);

      // Assert
      expect(index).toBe(0);
    });
  });
});
