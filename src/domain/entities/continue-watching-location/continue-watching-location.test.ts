import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { ContinueWatchingLocation } from "./continue-watching-location";

const baseLocationShape = () => ({
  courseSlug: faker.lorem.slug({ min: 3, max: 8 }),
  moduleSlug: faker.lorem.slug({ min: 3, max: 8 }),
  lessonId: faker.string.uuid(),
});

describe("ContinueWatchingLocation", () => {
  describe("GIVEN a location object matching the schema", () => {
    test("WHEN parsed THEN the typed location is returned", () => {
      // Arrange
      const input = baseLocationShape();

      // Act
      const result = ContinueWatchingLocation.parse(input);

      // Assert
      expect(result.courseSlug).toBe(input.courseSlug);
      expect(result.moduleSlug).toBe(input.moduleSlug);
      expect(result.lessonId).toBe(input.lessonId);
    });
  });

  describe("GIVEN a location carrying display values", () => {
    test("WHEN parsed THEN they are stripped", () => {
      // Arrange
      // The record answers "where was the learner", never "what did that
      // place look like" — a stored title would go stale on the first
      // retitle and teach storage about presentation.
      const input = { ...baseLocationShape(), title: "Vowels: short vs. long", seconds: 42 };

      // Act
      const result = ContinueWatchingLocation.parse(input);

      // Assert
      expect(result).not.toHaveProperty("title");
      expect(result).not.toHaveProperty("seconds");
    });
  });

  describe("GIVEN a location whose lessonId is not a UUID", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Arrange
      const input = { ...baseLocationShape(), lessonId: "not-a-uuid" };

      // Act + Assert
      expect(() => ContinueWatchingLocation.parse(input)).toThrow();
    });
  });

  describe("GIVEN a location missing a slug", () => {
    test("WHEN parsed THEN Zod throws", () => {
      // Arrange
      const input = { ...baseLocationShape(), moduleSlug: undefined };

      // Act + Assert
      expect(() => ContinueWatchingLocation.parse(input)).toThrow();
    });
  });

  describe("GIVEN an arbitrary unknown value", () => {
    test("WHEN safeParsed THEN it reports failure instead of throwing", () => {
      // Arrange
      // This is the shape a corrupt `localStorage` entry arrives in, so the
      // adapter needs a total, non-throwing check.
      const input = { anything: faker.lorem.word() };

      // Act
      const result = ContinueWatchingLocation.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});
