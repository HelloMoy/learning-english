import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { CourseId, LessonId, StudentId } from "./ids";

describe("branded id schemas", () => {
  describe("GIVEN a valid UUID string", () => {
    test("WHEN parsed as CourseId THEN it returns the branded value", () => {
      // Arrange
      const uuid = faker.string.uuid();

      // Act
      const result = CourseId.parse(uuid);

      // Assert
      expect(result).toBe(uuid);
    });

    test("WHEN parsed as LessonId THEN it returns the branded value", () => {
      // Arrange
      const uuid = faker.string.uuid();

      // Act
      const result = LessonId.parse(uuid);

      // Assert
      expect(result).toBe(uuid);
    });

    test("WHEN parsed as StudentId THEN it returns the branded value", () => {
      // Arrange
      const uuid = faker.string.uuid();

      // Act
      const result = StudentId.parse(uuid);

      // Assert
      expect(result).toBe(uuid);
    });
  });

  describe("GIVEN a non-UUID string", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Arrange + Act + Assert — the literal is the hypothesis of the test.
      expect(() => CourseId.parse("not-a-uuid")).toThrow();
      expect(() => LessonId.parse("not-a-uuid")).toThrow();
      expect(() => StudentId.parse("not-a-uuid")).toThrow();
    });
  });
});
