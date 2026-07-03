import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { Lesson } from "./lesson";

const fixedReadingLessonShape = {
  kind: "reading" as const,
  id: faker.string.uuid(),
  courseId: faker.string.uuid(),
  sequence: 1,
  title: faker.lorem.sentence(),
  body: faker.lorem.paragraph(),
};

describe("Lesson", () => {
  describe("GIVEN a reading lesson", () => {
    test("WHEN parsed THEN it returns the typed lesson", () => {
      // Arrange — input shape at module scope; only form-specific fields fixed.
      const input = {
        ...fixedReadingLessonShape,
        title: faker.lorem.sentence(),
        body: faker.lorem.paragraph(),
      };

      // Act
      const result = Lesson.parse(input);

      // Assert
      expect(result.kind).toBe("reading");
      expect(result.sequence).toBe(1);
    });

    test("WHEN narrowed by kind THEN TypeScript exposes only reading fields", () => {
      // Arrange + Act
      const input = {
        ...fixedReadingLessonShape,
        title: faker.lorem.sentence(),
        body: faker.lorem.paragraph(),
      };
      const result = Lesson.parse(input);
      if (result.kind !== "reading") {
        throw new Error("expected reading");
      }

      // Assert — reading-only field exists on the narrowed type.
      expect(result.body.length).toBeGreaterThan(0);
    });
  });

  describe("GIVEN a lesson missing `sequence`", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Arrange — `undefined` removes the field semantically without
      // introducing an unused destructuring binding.
      const missing = { ...fixedReadingLessonShape, sequence: undefined };

      // Act + Assert
      expect(() => Lesson.parse(missing)).toThrow();
    });
  });

  describe("GIVEN a lesson with non-positive sequence", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Arrange
      const input = {
        ...fixedReadingLessonShape,
        sequence: 0,
      };

      // Act + Assert
      expect(() => Lesson.parse(input)).toThrow();
    });
  });
});
