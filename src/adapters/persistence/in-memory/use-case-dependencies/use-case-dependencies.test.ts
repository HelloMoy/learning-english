import { SEED_COURSE_ID, seedCourse } from "@/adapters/persistence/in-memory/seed/seed";
import {
  SEED_CONTENT_COURSE_ID,
  seedContentCourse,
} from "@/adapters/persistence/in-memory/seed/seed-content";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { getCoursePlatformDeps, isCourseContentSeedEnabled } from "./use-case-dependencies";

/**
 * The env-var switch is read at function-call time (not module-load), so
 * tests can flip it freely without re-importing the module. We capture
 * the original value and restore it in `afterEach` so tests don't leak
 * state into each other or into the rest of the suite.
 */
const ORIGINAL_ENV = process.env.USE_COURSE_CONTENT_SEED;

describe("getCoursePlatformDeps env-var switch", () => {
  beforeEach(() => {
    delete process.env.USE_COURSE_CONTENT_SEED;
  });

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) {
      delete process.env.USE_COURSE_CONTENT_SEED;
    } else {
      process.env.USE_COURSE_CONTENT_SEED = ORIGINAL_ENV;
    }
  });

  describe("isCourseContentSeedEnabled", () => {
    test("WHEN `USE_COURSE_CONTENT_SEED` is unset THEN it returns `false`", () => {
      // Arrange — beforeEach clears the env var.
      // Act
      const result = isCourseContentSeedEnabled();

      // Assert
      expect(result).toBe(false);
    });

    test('WHEN `USE_COURSE_CONTENT_SEED` is `"1"` THEN it returns `true`', () => {
      // Arrange
      process.env.USE_COURSE_CONTENT_SEED = "1";

      // Act
      const result = isCourseContentSeedEnabled();

      // Assert
      expect(result).toBe(true);
    });

    test('WHEN `USE_COURSE_CONTENT_SEED` is `"true"` THEN it returns `false` (only `"1"` is honoured)', () => {
      // Arrange — string `"true"` is NOT the trigger; we use `"1"` so that
      // shell scripts can pass a numeric flag (`USE_COURSE_CONTENT_SEED=1`).
      process.env.USE_COURSE_CONTENT_SEED = "true";

      // Act
      const result = isCourseContentSeedEnabled();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("getCoursePlatformDeps", () => {
    test("WHEN the env var is unset THEN the dependency graph is built from the A1 seed", async () => {
      // Arrange — beforeEach clears the env var.
      // Act
      const deps = getCoursePlatformDeps();
      const courses = await deps.courses.listAvailable();

      // Assert — the A1 seed has exactly one course and that course is
      // the fictitious "Basic — Foundational Pronunciation".
      expect(courses).toHaveLength(1);
      expect(courses[0]?.id).toBe(SEED_COURSE_ID);
      expect(courses[0]?.title).toBe(seedCourse.title);
    });

    test("WHEN `USE_COURSE_CONTENT_SEED=1` THEN the dependency graph is built from the content seed", async () => {
      // Arrange
      process.env.USE_COURSE_CONTENT_SEED = "1";

      // Act
      const deps = getCoursePlatformDeps();
      const courses = await deps.courses.listAvailable();

      // Assert — the content seed has exactly one course and that course
      // is the "Advanced Intermediate Pronunciation" placeholder (or the
      // generator's real output once group 7 has run).
      expect(courses).toHaveLength(1);
      expect(courses[0]?.id).toBe(SEED_CONTENT_COURSE_ID);
      expect(courses[0]?.title).toBe(seedContentCourse.title);
    });

    test('WHEN the env var is set to a non-`"1"` value THEN the A1 seed is still used', async () => {
      // Arrange — protect against accidental activation via truthy strings.
      process.env.USE_COURSE_CONTENT_SEED = "yes";

      // Act
      const deps = getCoursePlatformDeps();
      const courses = await deps.courses.listAvailable();

      // Assert
      expect(courses).toHaveLength(1);
      expect(courses[0]?.id).toBe(SEED_COURSE_ID);
    });
  });
});
