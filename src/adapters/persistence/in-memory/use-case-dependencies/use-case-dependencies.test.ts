import { SEED_COURSE_ID, seedCourse } from "@/adapters/persistence/in-memory/seed/seed";
import {
  SEED_CONTENT_COURSE_ID,
  seedContentCourse,
} from "@/adapters/persistence/in-memory/seed/seed-content";
import { CourseId } from "@/domain/entities/ids/ids";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { getCoursePlatformDeps, isCourseContentSeedEnabled } from "./use-case-dependencies";

/**
 * The env-var switch is read at function-call time (not module-load), so
 * tests can flip it freely without re-importing the module. We capture
 * the original value and restore it in `afterEach` so tests don't leak
 * state into each other or into the rest of the suite.
 */
const ORIGINAL_ENV = process.env.USE_COURSE_CONTENT_SEED;
const ORIGINAL_BASE_URL = process.env.CONTENT_BASE_URL;

const restore = (name: string, original: string | undefined): void => {
  if (original === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = original;
  }
};

/** First video lesson of the content seed, read through the real deps graph. */
const firstContentVideoSource = async (): Promise<string> => {
  const deps = getCoursePlatformDeps();
  const lessons = await deps.lessons.listByCourse(CourseId.parse(SEED_CONTENT_COURSE_ID));
  const video = lessons.find((l) => l.kind === "video");
  if (video?.kind !== "video") throw new Error("content seed has no video lesson");
  return video.source;
};

describe("getCoursePlatformDeps env-var switch", () => {
  beforeEach(() => {
    delete process.env.USE_COURSE_CONTENT_SEED;
    delete process.env.CONTENT_BASE_URL;
  });

  afterEach(() => {
    restore("USE_COURSE_CONTENT_SEED", ORIGINAL_ENV);
    restore("CONTENT_BASE_URL", ORIGINAL_BASE_URL);
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

  describe("CONTENT_BASE_URL", () => {
    test("WHEN it is unset THEN content URLs keep the pre-change local prefix", async () => {
      // Arrange — the default must be byte-identical to the old baked-in
      // behaviour, or every existing page silently 404s.
      process.env.USE_COURSE_CONTENT_SEED = "1";

      // Act
      const source = await firstContentVideoSource();

      // Assert
      expect(source.startsWith("/local-filesystem-lesson/")).toBe(true);
    });

    test("WHEN it is set THEN content URLs carry the configured prefix, with the seed untouched", async () => {
      // Arrange — the payoff: repointing storage is configuration, not a
      // regeneration of seed-content.ts.
      process.env.USE_COURSE_CONTENT_SEED = "1";
      process.env.CONTENT_BASE_URL = "https://cdn.example.com/course-content";

      // Act
      const source = await firstContentVideoSource();

      // Assert
      expect(source.startsWith("https://cdn.example.com/course-content/")).toBe(true);
      expect(source).toMatch(/\.mp4$/);
    });

    test("WHEN it has a trailing slash THEN the resolved URL has no double slash", async () => {
      // Arrange — LocalFilesystemBlobStore normalizes this; assert the
      // composition root does not defeat that by pre-joining.
      process.env.USE_COURSE_CONTENT_SEED = "1";
      process.env.CONTENT_BASE_URL = "https://cdn.example.com/course-content/";

      // Act
      const source = await firstContentVideoSource();

      // Assert
      expect(source.startsWith("https://cdn.example.com/course-content/")).toBe(true);
      expect(source).not.toContain("course-content//");
    });
  });
});
