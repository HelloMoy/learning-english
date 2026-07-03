import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { Course } from "./course";

describe("Course", () => {
  describe("GIVEN a course object matching the schema", () => {
    test("WHEN parsed THEN the typed course is returned", () => {
      // Arrange
      const input = {
        id: faker.string.uuid(),
        slug: faker.lorem.slug(),
        title: faker.commerce.productName(),
        description: faker.lorem.paragraph(),
        language: "en",
        lessonCount: 3,
      };

      // Act
      const result = Course.parse(input);

      // Assert
      expect(result.title).toBe(input.title);
      expect(result.lessonCount).toBe(3);
    });
  });

  describe("GIVEN a course missing required fields", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Arrange
      const full = {
        id: faker.string.uuid(),
        slug: faker.lorem.slug(),
        title: faker.commerce.productName(),
        description: faker.lorem.paragraph(),
        language: "en",
        lessonCount: 3,
      };
      // `undefined` removes the field semantically without producing an
      // unused destructuring binding.
      const missing = { ...full, title: undefined };

      // Act + Assert
      expect(() => Course.parse(missing)).toThrow();
    });
  });

  describe("GIVEN a course with a negative lessonCount", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Arrange
      const input = {
        id: faker.string.uuid(),
        slug: faker.lorem.slug(),
        title: faker.commerce.productName(),
        description: faker.lorem.paragraph(),
        language: "en",
        lessonCount: -1,
      };

      // Act + Assert
      expect(() => Course.parse(input)).toThrow();
    });
  });
});
