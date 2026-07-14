import { LessonId } from "@/domain/entities/ids/ids";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { InMemoryProgressTracker } from "./in-memory-progress-tracker";

describe("InMemoryProgressTracker", () => {
  describe("GIVEN a fresh tracker", () => {
    test("WHEN `isComplete` is called for an unknown lesson THEN it returns `false`", async () => {
      // Arrange
      const tracker = new InMemoryProgressTracker();

      // Act
      const result = await tracker.isComplete(LessonId.parse(faker.string.uuid()));

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("GIVEN a tracker that has marked a lesson complete", () => {
    test("WHEN `isComplete` is called for that lesson THEN it returns `true`", async () => {
      // Arrange
      const tracker = new InMemoryProgressTracker();
      const lessonId = LessonId.parse(faker.string.uuid());

      // Act
      await tracker.markComplete(lessonId);
      const result = await tracker.isComplete(lessonId);

      // Assert
      expect(result).toBe(true);
    });

    test("WHEN `markComplete` is called twice with the same lesson THEN it is idempotent", async () => {
      // Arrange
      const tracker = new InMemoryProgressTracker();
      const lessonId = LessonId.parse(faker.string.uuid());

      // Act
      await tracker.markComplete(lessonId);
      await tracker.markComplete(lessonId);

      // Assert
      expect(await tracker.isComplete(lessonId)).toBe(true);
    });
  });
});
