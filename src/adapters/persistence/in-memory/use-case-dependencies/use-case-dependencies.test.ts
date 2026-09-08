import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { SEED_COURSE_ID, seedCourse } from "@/adapters/persistence/in-memory/seed/seed";
import { seedContentCourses } from "@/adapters/persistence/in-memory/seed/seed-content";
import { CourseId } from "@/domain/entities/ids/ids";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { getCoursePlatformDeps, isCourseContentSeedEnabled } from "./use-case-dependencies";

/**
 * The filesystem-backed course under test. The manifest may declare several;
 * these assertions only need one, and the catalog assertions below cover the
 * whole list.
 */
const contentCourse = seedContentCourses[0]!;

/**
 * The env-var switch is read at function-call time (not module-load), so
 * tests can flip it freely without re-importing the module. We capture
 * the original value and restore it in `afterEach` so tests don't leak
 * state into each other or into the rest of the suite.
 */
const ORIGINAL_ENV = process.env.USE_COURSE_CONTENT_SEED;
const ORIGINAL_LOCATIONS_PATH = process.env.CONTENT_LOCATIONS_PATH;

const manifestRoot = mkdtempSync(path.join(tmpdir(), "deps-locations-"));

/** Writes a location manifest to a temp file and points the env var at it. */
function useLocationManifest(doc: Record<string, unknown>): void {
  const file = path.join(mkdtempSync(path.join(manifestRoot, "dir-")), "content-locations.json");
  writeFileSync(file, JSON.stringify({ version: 1, ...doc }));
  process.env.CONTENT_LOCATIONS_PATH = file;
}

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
  const lessons = await deps.lessons.listByCourse(contentCourse.id);
  const video = lessons.find((l) => l.kind === "video");
  if (video?.kind !== "video") throw new Error("content seed has no video lesson");
  return video.source;
};

describe("getCoursePlatformDeps env-var switch", () => {
  beforeEach(() => {
    delete process.env.USE_COURSE_CONTENT_SEED;
    delete process.env.CONTENT_LOCATIONS_PATH;
  });

  afterEach(() => {
    restore("USE_COURSE_CONTENT_SEED", ORIGINAL_ENV);
    restore("CONTENT_LOCATIONS_PATH", ORIGINAL_LOCATIONS_PATH);
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

    test("WHEN `USE_COURSE_CONTENT_SEED=1` THEN the content course JOINS the A1 course in one catalog", async () => {
      // Arrange — the flag is additive: it decides whether content that
      // needs a large local content root is present, never whether the A1
      // course is removed.
      process.env.USE_COURSE_CONTENT_SEED = "1";

      // Act
      const deps = getCoursePlatformDeps();
      const courses = await deps.courses.listAvailable();

      // Assert
      expect(courses).toHaveLength(1 + seedContentCourses.length);
      expect(courses.map((course) => course.id)).toEqual([
        SEED_COURSE_ID,
        ...seedContentCourses.map((course) => course.id),
      ]);
      expect(courses.map((course) => course.title)).toEqual([
        seedCourse.title,
        ...seedContentCourses.map((course) => course.title),
      ]);
    });

    test("WHEN both courses are served THEN they come back in ladder order", async () => {
      // Arrange
      process.env.USE_COURSE_CONTENT_SEED = "1";

      // Act
      const deps = getCoursePlatformDeps();
      const courses = await deps.courses.listAvailable();

      // Assert — derived, not literal: the catalog grows as courses are
      // declared in the content manifest, and the invariant is the ordering.
      const sequences = courses.map((course) => course.sequence);
      expect(sequences).toEqual([...sequences].sort((a, b) => a - b));
      expect(sequences).toEqual(
        [seedCourse, ...seedContentCourses].map((course) => course.sequence).sort((a, b) => a - b),
      );
    });

    test("WHEN both courses are served THEN each one's lessons resolve through the adapter that owns them", async () => {
      // Arrange — the A1 seed's URLs are literals under `public/`; the
      // content seed's are keys the BlobStore resolves. Merging the two
      // must not put either through the other's resolution.
      process.env.USE_COURSE_CONTENT_SEED = "1";

      // Act
      const deps = getCoursePlatformDeps();
      const a1Lessons = await deps.lessons.listByCourse(CourseId.parse(SEED_COURSE_ID));
      const contentLessons = await deps.lessons.listByCourse(contentCourse.id);

      // Assert
      expect(a1Lessons).toHaveLength(seedCourse.lessonCount);
      expect(contentLessons).toHaveLength(contentCourse.lessonCount);
      const a1Video = a1Lessons.find((lesson) => lesson.kind === "video");
      expect(a1Video?.kind === "video" && a1Video.source).toBe("/videos/vowels-short-vs-long.mp4");
    });

    test("WHEN a lesson id from either seed is looked up THEN the composite finds it", async () => {
      // Arrange
      process.env.USE_COURSE_CONTENT_SEED = "1";
      const deps = getCoursePlatformDeps();
      const [a1First] = await deps.lessons.listByCourse(CourseId.parse(SEED_COURSE_ID));
      const [contentFirst] = await deps.lessons.listByCourse(contentCourse.id);

      // Act
      const foundA1 = await deps.lessons.byId(a1First!.id);
      const foundContent = await deps.lessons.byId(contentFirst!.id);

      // Assert
      expect(foundA1?.id).toBe(a1First!.id);
      expect(foundContent?.id).toBe(contentFirst!.id);
    });

    test("WHEN the graph is assembled THEN it exposes the continue-watching use case", async () => {
      // Arrange
      process.env.USE_COURSE_CONTENT_SEED = "1";
      const deps = getCoursePlatformDeps();
      const [module_] = await deps.modules.listByCourse(CourseId.parse(SEED_COURSE_ID));
      const [lesson] = await deps.lessons.listByCourse(CourseId.parse(SEED_COURSE_ID));

      // Act
      const result = await deps.useCases.findContinueWatching({
        courseSlug: seedCourse.slug,
        moduleSlug: module_!.slug,
        lessonId: lesson!.id,
      });

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.course.id).toBe(SEED_COURSE_ID);
        expect(result.value.lesson.id).toBe(lesson!.id);
      }
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

  describe("content-locations.json", () => {
    test("WHEN no manifest exists THEN content URLs keep the pre-change local prefix", async () => {
      // Arrange — the default must be byte-identical to the old baked-in
      // behaviour, or every existing page silently 404s.
      process.env.USE_COURSE_CONTENT_SEED = "1";

      // Act
      const source = await firstContentVideoSource();

      // Assert
      expect(source.startsWith("/local-filesystem-lesson/")).toBe(true);
    });

    test("WHEN the manifest points the local store at a CDN THEN URLs carry that prefix", async () => {
      // Arrange — the payoff: repointing storage is configuration, not a
      // regeneration of seed-content.ts.
      process.env.USE_COURSE_CONTENT_SEED = "1";
      useLocationManifest({
        stores: { local: { driver: "local", baseUrl: "https://cdn.example.com/course-content" } },
        default: "local",
      });

      // Act
      const source = await firstContentVideoSource();

      // Assert
      expect(source.startsWith("https://cdn.example.com/course-content/")).toBe(true);
      expect(source).toMatch(/\.mp4$/);
    });

    test("WHEN a baseUrl has a trailing slash THEN the resolved URL has no double slash", async () => {
      // Arrange — LocalFilesystemBlobStore normalizes this; assert the
      // composition root does not defeat that by pre-joining.
      process.env.USE_COURSE_CONTENT_SEED = "1";
      useLocationManifest({
        stores: { local: { driver: "local", baseUrl: "https://cdn.example.com/course-content/" } },
        default: "local",
      });

      // Act
      const source = await firstContentVideoSource();

      // Assert
      expect(source.startsWith("https://cdn.example.com/course-content/")).toBe(true);
      expect(source).not.toContain("course-content//");
    });

    test("WHEN a route covers one prefix THEN only its keys move and the rest stay local", async () => {
      // Arrange — a partial migration: one course's assets served elsewhere
      // while everything outside that prefix is untouched.
      process.env.USE_COURSE_CONTENT_SEED = "1";
      useLocationManifest({
        stores: {
          local: { driver: "local" },
          cdn: { driver: "local", baseUrl: "https://cdn.example.com/migrated" },
        },
        default: "local",
        routes: [{ prefix: contentCourse.slug, store: "cdn" }],
      });

      // Act
      const source = await firstContentVideoSource();
      const deps = getCoursePlatformDeps();
      const [a1Lesson] = await deps.lessons.listByCourse(CourseId.parse(SEED_COURSE_ID));

      // Assert
      expect(source.startsWith("https://cdn.example.com/migrated/")).toBe(true);
      expect(a1Lesson?.kind === "video" && a1Lesson.source).toBe(
        "/videos/vowels-short-vs-long.mp4",
      );
    });

    test("WHEN the manifest is invalid THEN building the graph throws rather than falling back", () => {
      // Arrange
      process.env.USE_COURSE_CONTENT_SEED = "1";
      useLocationManifest({ stores: { local: { driver: "local" } }, default: "missing-store" });

      // Act + Assert
      expect(() => getCoursePlatformDeps()).toThrow(/missing-store/);
    });
  });
});
