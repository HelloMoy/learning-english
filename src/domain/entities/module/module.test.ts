import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { Module } from "./module";

const baseModuleShape = {
  id: faker.string.uuid(),
  courseId: faker.string.uuid(),
  slug: faker.lorem.slug({ min: 3, max: 8 }),
  title: faker.commerce.productName(),
  sequence: 1,
};

describe("Module", () => {
  describe("GIVEN a valid module", () => {
    test("WHEN parsed THEN the typed module is returned", () => {
      // Arrange
      const input = { ...baseModuleShape };

      // Act
      const result = Module.parse(input);

      // Assert
      expect(result.title).toBe(input.title);
      expect(result.courseId).toBe(input.courseId);
      expect(result.slug).toBe(input.slug);
      expect(result.sequence).toBe(1);
    });
  });

  describe("GIVEN a module missing required fields", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Arrange — `undefined` removes the field semantically without
      // producing an unused destructuring binding.
      const missing = { ...baseModuleShape, title: undefined };

      // Act + Assert
      expect(() => Module.parse(missing)).toThrow();
    });
  });

  describe("GIVEN a module with non-positive sequence", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Arrange
      const input = { ...baseModuleShape, sequence: 0 };

      // Act + Assert
      expect(() => Module.parse(input)).toThrow();
    });
  });

  describe("GIVEN a module with a slug shorter than 3 characters", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Arrange
      const input = { ...baseModuleShape, slug: "ab" };

      // Act + Assert
      expect(() => Module.parse(input)).toThrow();
    });
  });

  describe("GIVEN a module whose id is not a UUID", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Arrange
      const input = { ...baseModuleShape, id: "not-a-uuid" };

      // Act + Assert
      expect(() => Module.parse(input)).toThrow();
    });
  });
});
