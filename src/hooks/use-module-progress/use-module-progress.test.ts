import { LessonId } from "@/domain/entities/ids/ids";
import type { ModuleLesson } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import { faker } from "@faker-js/faker";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

import { useModuleProgress } from "./use-module-progress";

const aModule = (count: number): ModuleLesson[] =>
  Array.from({ length: count }, (_, index) => ({
    id: LessonId.parse(faker.string.uuid()),
    sequence: index + 1,
    title: faker.lorem.words(2),
    durationSeconds: 600,
  }));

const announceStorageChange = () => {
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });
};

describe("useModuleProgress", () => {
  beforeEach(() => {
    window.localStorage.clear();
    announceStorageChange();
  });

  describe("GIVEN nothing stored on this device", () => {
    test("WHEN the hook reads a module THEN it is not started", () => {
      // Arrange
      const lessons = aModule(4);

      // Act
      const { result } = renderHook(() => useModuleProgress(lessons));

      // Assert
      expect(result.current.kind).toBe("not-started");
    });
  });

  describe("GIVEN a completion mark AND a saved position in the module", () => {
    test("WHEN the hook reads the module THEN it reports progress from both stores", () => {
      // Arrange
      const lessons = aModule(4);
      givenLearner.completed([lessons[0]!.id]);
      givenLearner.positions({ [lessons[1]!.id]: 120 });

      // Act
      const { result } = renderHook(() => useModuleProgress(lessons));
      announceStorageChange();

      // Assert
      expect(result.current).toMatchObject({
        kind: "in-progress",
        completedCount: 1,
        target: lessons[1],
        secondsLeftInTarget: 480,
      });
    });
  });
});
