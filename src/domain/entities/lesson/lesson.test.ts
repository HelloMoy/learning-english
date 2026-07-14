import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { Lesson } from "./lesson";

const fixedReadingLessonShape = {
  kind: "reading" as const,
  id: faker.string.uuid(),
  courseId: faker.string.uuid(),
  moduleId: faker.string.uuid(),
  sequence: 1,
  title: faker.lorem.sentence(),
  body: faker.lorem.paragraph(),
};

const fixedVideoLessonShape = {
  kind: "video" as const,
  id: faker.string.uuid(),
  courseId: faker.string.uuid(),
  moduleId: faker.string.uuid(),
  sequence: 1,
  title: faker.lorem.sentence(),
  description: faker.lorem.paragraph(),
  source: faker.internet.url(),
  durationSeconds: 600,
  poster: faker.internet.url(),
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

    test("WHEN parsed THEN the lesson carries a moduleId", () => {
      // Arrange
      const input = { ...fixedReadingLessonShape };

      // Act
      const result = Lesson.parse(input);

      // Assert
      if (result.kind !== "reading") throw new Error("expected reading");
      expect(result.moduleId).toBe(input.moduleId);
    });
  });

  describe("GIVEN a video lesson", () => {
    test("WHEN parsed THEN it returns the typed video lesson", () => {
      // Arrange
      const input = { ...fixedVideoLessonShape };

      // Act
      const result = Lesson.parse(input);

      // Assert
      if (result.kind !== "video") {
        throw new Error("expected video");
      }
      expect(result.kind).toBe("video");
      expect(result.durationSeconds).toBe(600);
    });

    test("WHEN narrowed by kind THEN TypeScript exposes only video fields", () => {
      // Arrange + Act
      const input = { ...fixedVideoLessonShape };
      const result = Lesson.parse(input);
      if (result.kind !== "video") {
        throw new Error("expected video");
      }

      // Assert — video-only field exists on the narrowed type.
      expect(result.source.length).toBeGreaterThan(0);
      expect(result.description.length).toBeGreaterThan(0);
    });

    test("WHEN parsed without a poster THEN poster is optional and undefined", () => {
      // Arrange
      const input = { ...fixedVideoLessonShape, poster: undefined };

      // Act
      const result = Lesson.parse(input);

      // Assert
      if (result.kind !== "video") throw new Error("expected video");
      expect(result.poster).toBeUndefined();
    });
  });

  describe("GIVEN a video lesson with non-positive duration", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Arrange
      const input = { ...fixedVideoLessonShape, durationSeconds: 0 };

      // Act + Assert
      expect(() => Lesson.parse(input)).toThrow();
    });
  });

  describe("GIVEN a video lesson with an invalid source URL", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Arrange
      const input = { ...fixedVideoLessonShape, source: "not-a-url" };

      // Act + Assert
      expect(() => Lesson.parse(input)).toThrow();
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
