import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { studyPace } from "./study-pace";

/** The Basic Course's total runtime: 10 h 29 min 28 s. */
const BASIC_COURSE_SECONDS = 37_768;

describe("studyPace", () => {
  describe("GIVEN the Basic Course's runtime", () => {
    test.each([
      [10, 63, 9],
      [20, 32, 5],
      [30, 21, 3],
      [45, 14, 2],
    ])(
      "WHEN studying %i minutes a day THEN it takes %i days AND about %i weeks",
      (minutesPerDay, days, weeks) => {
        // Arrange
        const runtimeSeconds = BASIC_COURSE_SECONDS;

        // Act
        const pace = studyPace(runtimeSeconds, minutesPerDay);

        // Assert
        expect(pace).toEqual({ days, weeks });
      },
    );
  });

  describe("GIVEN a course shorter than a few days of study", () => {
    test("WHEN it takes under half a week THEN it still reads as one week", () => {
      // Arrange
      const minutesPerDay = faker.number.int({ min: 10, max: 45 });
      const runtimeSeconds = minutesPerDay * 60;

      // Act
      const pace = studyPace(runtimeSeconds, minutesPerDay);

      // Assert
      expect(pace).toEqual({ days: 1, weeks: 1 });
    });
  });

  describe("GIVEN a runtime that does not fill the last day", () => {
    test("WHEN the leftover is a single second THEN it counts as another day", () => {
      // Arrange
      const minutesPerDay = faker.number.int({ min: 10, max: 45 });
      const runtimeSeconds = minutesPerDay * 60 * 3 + 1;

      // Act
      const pace = studyPace(runtimeSeconds, minutesPerDay);

      // Assert
      expect(pace.days).toBe(4);
    });
  });
});
