import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { ContinueWatchingRecord } from "./continue-watching-record";

const aLocation = () => ({
  courseSlug: faker.lorem.slug({ min: 3, max: 8 }),
  moduleSlug: faker.lorem.slug({ min: 3, max: 8 }),
  lessonId: faker.string.uuid(),
});

describe("ContinueWatchingRecord", () => {
  describe("GIVEN a location and the time it was written", () => {
    test("WHEN parsed THEN both are kept", () => {
      // Arrange
      const input = { location: aLocation(), watchedAt: faker.date.past().getTime() };

      // Act
      const result = ContinueWatchingRecord.parse(input);

      // Assert
      expect(result).toEqual(input);
    });
  });

  describe("GIVEN a time before the epoch", () => {
    test("WHEN parsed THEN it is rejected", () => {
      // Arrange
      const input = { location: aLocation(), watchedAt: -1 };

      // Act
      const result = ContinueWatchingRecord.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe("GIVEN a fractional time", () => {
    test("WHEN parsed THEN it is rejected", () => {
      // Arrange
      const input = { location: aLocation(), watchedAt: 1.5 };

      // Act
      const result = ContinueWatchingRecord.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});
