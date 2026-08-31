import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { Course } from "./course";

const baseCourseShape = {
  id: faker.string.uuid(),
  slug: faker.lorem.slug({ min: 3, max: 8 }),
  title: faker.commerce.productName(),
  description: faker.lorem.paragraph(),
  language: "en",
  lessonCount: 3,
  moduleCount: 2,
  sequence: 1,
};

describe("Course", () => {
  describe("GIVEN a course object matching the schema", () => {
    test("WHEN parsed THEN the typed course is returned", () => {
      // Arrange
      const input = { ...baseCourseShape };

      // Act
      const result = Course.parse(input);

      // Assert
      expect(result.title).toBe(input.title);
      expect(result.lessonCount).toBe(3);
      expect(result.moduleCount).toBe(2);
    });
  });

  describe("GIVEN a course missing required fields", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Arrange
      // `undefined` removes the field semantically without producing an
      // unused destructuring binding.
      const missing = { ...baseCourseShape, title: undefined };

      // Act + Assert
      expect(() => Course.parse(missing)).toThrow();
    });
  });

  describe("GIVEN a course with a negative lessonCount", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Arrange
      const input = { ...baseCourseShape, lessonCount: -1 };

      // Act + Assert
      expect(() => Course.parse(input)).toThrow();
    });
  });

  describe("GIVEN a course with a negative moduleCount", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Arrange
      const input = { ...baseCourseShape, moduleCount: -1 };

      // Act + Assert
      expect(() => Course.parse(input)).toThrow();
    });
  });

  describe("GIVEN a course with a non-integer moduleCount", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Arrange
      const input = { ...baseCourseShape, moduleCount: 1.5 };

      // Act + Assert
      expect(() => Course.parse(input)).toThrow();
    });
  });

  describe("GIVEN a course carrying its catalog sequence", () => {
    test("WHEN parsed THEN the sequence is returned", () => {
      // Arrange
      const input = { ...baseCourseShape, sequence: 2 };

      // Act
      const result = Course.parse(input);

      // Assert
      expect(result.sequence).toBe(2);
    });
  });

  describe("GIVEN a course with a zero sequence", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Arrange
      // Sequences are 1-based like `Module.sequence`: a zeroth level would
      // render as `Level 0` in the home ladder.
      const input = { ...baseCourseShape, sequence: 0 };

      // Act + Assert
      expect(() => Course.parse(input)).toThrow();
    });
  });

  describe("GIVEN a course with a fractional sequence", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Arrange
      const input = { ...baseCourseShape, sequence: 1.5 };

      // Act + Assert
      expect(() => Course.parse(input)).toThrow();
    });
  });

  describe("GIVEN a course missing its sequence", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Arrange
      const input = { ...baseCourseShape, sequence: undefined };

      // Act + Assert
      expect(() => Course.parse(input)).toThrow();
    });
  });
});
