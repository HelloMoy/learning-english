import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import {
  countsAsComplete,
  FINISHED_FRACTION,
  finishThresholdSeconds,
  hasFinishedWatching,
  SECONDS_FROM_END,
  watchedFraction,
} from "./watch-progress";

const LESSON_DURATION_SECONDS = 600;

describe("watchedFraction", () => {
  describe("GIVEN a position inside the lesson", () => {
    test("WHEN the learner is four tenths in THEN the fraction is 0.4", () => {
      expect(watchedFraction(240, LESSON_DURATION_SECONDS)).toBeCloseTo(0.4);
    });

    test("WHEN called with an arbitrary in-range position THEN the fraction stays within the unit range", () => {
      const seconds = faker.number.int({ min: 0, max: LESSON_DURATION_SECONDS });

      const fraction = watchedFraction(seconds, LESSON_DURATION_SECONDS);

      expect(fraction).toBeGreaterThanOrEqual(0);
      expect(fraction).toBeLessThanOrEqual(1);
    });
  });

  describe("GIVEN a position outside the lesson", () => {
    test("WHEN the position runs past the duration THEN the fraction is clamped to 1", () => {
      expect(watchedFraction(LESSON_DURATION_SECONDS + 120, LESSON_DURATION_SECONDS)).toBe(1);
    });

    test("WHEN the position is negative THEN the fraction is clamped to 0", () => {
      expect(watchedFraction(-30, LESSON_DURATION_SECONDS)).toBe(0);
    });
  });

  describe("GIVEN nothing usable to divide", () => {
    test("WHEN no position is stored THEN the fraction is 0", () => {
      expect(watchedFraction(null, LESSON_DURATION_SECONDS)).toBe(0);
    });

    test("WHEN the position is NaN THEN the fraction is 0", () => {
      expect(watchedFraction(Number.NaN, LESSON_DURATION_SECONDS)).toBe(0);
    });

    test("WHEN the position is Infinity THEN the fraction is 0", () => {
      expect(watchedFraction(Number.POSITIVE_INFINITY, LESSON_DURATION_SECONDS)).toBe(0);
    });

    test("WHEN the lesson has no duration THEN the fraction is 0 rather than NaN", () => {
      expect(watchedFraction(240, 0)).toBe(0);
    });

    test("WHEN the duration is negative THEN the fraction is 0", () => {
      expect(watchedFraction(240, -600)).toBe(0);
    });

    test("WHEN the duration is NaN THEN the fraction is 0", () => {
      expect(watchedFraction(240, Number.NaN)).toBe(0);
    });
  });
});

describe("finishThresholdSeconds", () => {
  test("WHEN the fixed tail is the earlier rule THEN the threshold is the percentage one", () => {
    // 600 - 15 = 585, 600 × 0.95 = 570. The percentage comes first.
    expect(finishThresholdSeconds(LESSON_DURATION_SECONDS)).toBe(
      LESSON_DURATION_SECONDS * FINISHED_FRACTION,
    );
  });

  test("WHEN the percentage is the later rule THEN the threshold is the fixed tail", () => {
    // 60 - 15 = 45, 60 × 0.95 = 57. The tail comes first.
    expect(finishThresholdSeconds(60)).toBe(60 - SECONDS_FROM_END);
  });

  test("WHEN the clip is shorter than the fixed tail THEN the threshold falls back to the percentage", () => {
    expect(finishThresholdSeconds(10)).toBe(10 * FINISHED_FRACTION);
  });
});

describe("hasFinishedWatching", () => {
  describe("GIVEN a lesson long enough for the percentage rule", () => {
    test("WHEN the position sits exactly on the threshold THEN the lesson is finished", () => {
      const onThreshold = finishThresholdSeconds(LESSON_DURATION_SECONDS);

      expect(hasFinishedWatching(onThreshold, LESSON_DURATION_SECONDS)).toBe(true);
    });

    test("WHEN the position is one second below the threshold THEN the lesson is not finished", () => {
      const belowThreshold = finishThresholdSeconds(LESSON_DURATION_SECONDS) - 1;

      expect(hasFinishedWatching(belowThreshold, LESSON_DURATION_SECONDS)).toBe(false);
    });

    test("WHEN the position is mid-lesson THEN the lesson is not finished", () => {
      expect(hasFinishedWatching(240, LESSON_DURATION_SECONDS)).toBe(false);
    });

    test("WHEN the video ran to its end THEN the lesson is finished", () => {
      expect(hasFinishedWatching(LESSON_DURATION_SECONDS, LESSON_DURATION_SECONDS)).toBe(true);
    });
  });

  describe("GIVEN a clip shorter than the fixed tail", () => {
    test("WHEN a ten-second clip is watched to its end THEN it is finished", () => {
      expect(hasFinishedWatching(10, 10)).toBe(true);
    });

    test("WHEN a ten-second clip is barely started THEN it is not finished", () => {
      expect(hasFinishedWatching(1, 10)).toBe(false);
    });
  });

  describe("GIVEN nothing usable to compare", () => {
    test("WHEN no position is stored THEN the lesson is not finished", () => {
      expect(hasFinishedWatching(null, LESSON_DURATION_SECONDS)).toBe(false);
    });

    test("WHEN the position is NaN THEN the lesson is not finished", () => {
      expect(hasFinishedWatching(Number.NaN, LESSON_DURATION_SECONDS)).toBe(false);
    });

    test("WHEN the position is Infinity THEN the lesson is not finished", () => {
      expect(hasFinishedWatching(Number.POSITIVE_INFINITY, LESSON_DURATION_SECONDS)).toBe(false);
    });

    test("WHEN the lesson has no duration THEN the lesson is not finished", () => {
      expect(hasFinishedWatching(240, 0)).toBe(false);
    });

    test("WHEN the duration is negative THEN the lesson is not finished", () => {
      expect(hasFinishedWatching(240, -600)).toBe(false);
    });

    test("WHEN the duration is NaN THEN the lesson is not finished", () => {
      expect(hasFinishedWatching(240, Number.NaN)).toBe(false);
    });
  });
});

describe("countsAsComplete", () => {
  test("WHEN the learner marked the lesson THEN it counts as complete whatever was watched", () => {
    expect(
      countsAsComplete({
        isMarkedComplete: true,
        positionSeconds: null,
        durationSeconds: LESSON_DURATION_SECONDS,
      }),
    ).toBe(true);
  });

  test("WHEN the learner watched to the end THEN it counts as complete without a mark", () => {
    expect(
      countsAsComplete({
        isMarkedComplete: false,
        positionSeconds: finishThresholdSeconds(LESSON_DURATION_SECONDS),
        durationSeconds: LESSON_DURATION_SECONDS,
      }),
    ).toBe(true);
  });

  test("WHEN the learner stopped partway and never marked THEN it does not count as complete", () => {
    expect(
      countsAsComplete({
        isMarkedComplete: false,
        positionSeconds: 240,
        durationSeconds: LESSON_DURATION_SECONDS,
      }),
    ).toBe(false);
  });

  test("WHEN a marked lesson has no runtime THEN it still counts as complete", () => {
    expect(
      countsAsComplete({ isMarkedComplete: true, positionSeconds: null, durationSeconds: 0 }),
    ).toBe(true);
  });
});
