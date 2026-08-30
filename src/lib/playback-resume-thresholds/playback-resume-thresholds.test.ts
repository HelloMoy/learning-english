import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import {
  isPositionResumable,
  MIN_SECONDS_FROM_START,
  SECONDS_NEAR_END,
} from "./playback-resume-thresholds";

const LESSON_DURATION_SECONDS = 600;

describe("isPositionResumable", () => {
  describe("GIVEN no stored position", () => {
    test("WHEN the position is null THEN it is not resumable", () => {
      expect(isPositionResumable(null, LESSON_DURATION_SECONDS)).toBe(false);
    });
  });

  describe("GIVEN a position that is not a usable number", () => {
    test("WHEN the position is NaN THEN it is not resumable", () => {
      expect(isPositionResumable(Number.NaN, LESSON_DURATION_SECONDS)).toBe(false);
    });

    test("WHEN the position is Infinity THEN it is not resumable", () => {
      expect(isPositionResumable(Number.POSITIVE_INFINITY, LESSON_DURATION_SECONDS)).toBe(false);
    });

    test("WHEN the position is negative THEN it is not resumable", () => {
      expect(isPositionResumable(-1, LESSON_DURATION_SECONDS)).toBe(false);
    });
  });

  describe("GIVEN an unknown lesson duration", () => {
    test("WHEN durationSeconds is 0 THEN it is not resumable", () => {
      expect(isPositionResumable(180, 0)).toBe(false);
    });

    test("WHEN durationSeconds is negative THEN it is not resumable", () => {
      expect(isPositionResumable(180, -600)).toBe(false);
    });

    test("WHEN durationSeconds is NaN THEN it is not resumable", () => {
      expect(isPositionResumable(180, Number.NaN)).toBe(false);
    });
  });

  describe("GIVEN a position too close to the start", () => {
    test("WHEN the position is below the minimum THEN it is not resumable", () => {
      expect(isPositionResumable(MIN_SECONDS_FROM_START - 1, LESSON_DURATION_SECONDS)).toBe(false);
    });

    test("WHEN the position sits exactly on the minimum THEN it is resumable", () => {
      expect(isPositionResumable(MIN_SECONDS_FROM_START, LESSON_DURATION_SECONDS)).toBe(true);
    });
  });

  describe("GIVEN a position effectively at the end", () => {
    test("WHEN the position is inside the near-end window THEN it is not resumable", () => {
      const insideWindow = LESSON_DURATION_SECONDS - SECONDS_NEAR_END + 1;

      expect(isPositionResumable(insideWindow, LESSON_DURATION_SECONDS)).toBe(false);
    });

    test("WHEN the position sits exactly on the near-end boundary THEN it is not resumable", () => {
      const onBoundary = LESSON_DURATION_SECONDS - SECONDS_NEAR_END;

      expect(isPositionResumable(onBoundary, LESSON_DURATION_SECONDS)).toBe(false);
    });

    test("WHEN the position is one second before the near-end boundary THEN it is resumable", () => {
      const beforeBoundary = LESSON_DURATION_SECONDS - SECONDS_NEAR_END - 1;

      expect(isPositionResumable(beforeBoundary, LESSON_DURATION_SECONDS)).toBe(true);
    });
  });

  describe("GIVEN a lesson shorter than the threshold window", () => {
    test("WHEN the lesson is trivially short THEN no position is resumable", () => {
      expect(isPositionResumable(5, 5)).toBe(false);
    });
  });

  describe("GIVEN a position in the middle of the lesson", () => {
    test("WHEN the position is mid-lesson THEN it is resumable", () => {
      expect(isPositionResumable(180, LESSON_DURATION_SECONDS)).toBe(true);
    });

    test("WHEN called with an arbitrary in-range position THEN it is resumable", () => {
      const seconds = faker.number.int({
        min: MIN_SECONDS_FROM_START,
        max: LESSON_DURATION_SECONDS - SECONDS_NEAR_END - 1,
      });

      expect(isPositionResumable(seconds, LESSON_DURATION_SECONDS)).toBe(true);
    });
  });
});
