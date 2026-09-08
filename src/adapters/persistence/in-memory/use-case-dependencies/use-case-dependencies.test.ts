import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  seedContentCourses,
  seedContentLessonRows,
} from "@/adapters/persistence/in-memory/seed/seed-content";
import { LessonId } from "@/domain/entities/ids/ids";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { getCoursePlatformDeps } from "./use-case-dependencies";

/**
 * The first declared course. The manifest may declare several; assertions
 * that need one course use this, and the catalog assertions cover the list.
 */
const contentCourse = seedContentCourses[0]!;

const ORIGINAL_LOCATIONS_PATH = process.env.CONTENT_LOCATIONS_PATH;
const ORIGINAL_SEED_FLAG = process.env.USE_COURSE_CONTENT_SEED;

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

/**
 * A seed video lesson whose `source` is still a content key, and its course.
 *
 * @remarks
 * Found in the seed rather than assumed to be the first course's first lesson.
 * A lesson served by YouTube bypasses the BlobStore by design, so it can
 * demonstrate nothing about key→URL resolution — which is the whole subject of
 * the content-locations suite below.
 */
const keyedVideo = seedContentLessonRows.find(
  (row): row is Extract<typeof row, { kind: "video" }> =>
    row.kind === "video" && !/^https?:/.test(row.source),
)!;
const keyedVideoCourse = seedContentCourses.find((course) => course.id === keyedVideo.courseId)!;

/** That lesson's source, resolved through the real deps graph. */
const firstContentVideoSource = async (): Promise<string> => {
  const deps = getCoursePlatformDeps();
  const lessons = await deps.lessons.listByCourse(keyedVideoCourse.id);
  const video = lessons.find((lesson) => lesson.id === keyedVideo.id);
  if (video?.kind !== "video") throw new Error("content seed has no key-sourced video lesson");
  return video.source;
};

describe("getCoursePlatformDeps", () => {
  beforeEach(() => {
    delete process.env.CONTENT_LOCATIONS_PATH;
    delete process.env.USE_COURSE_CONTENT_SEED;
  });

  afterEach(() => {
    restore("CONTENT_LOCATIONS_PATH", ORIGINAL_LOCATIONS_PATH);
    restore("USE_COURSE_CONTENT_SEED", ORIGINAL_SEED_FLAG);
  });

  describe("the catalog", () => {
    test("WHEN the graph is built THEN the catalog holds exactly the declared courses", async () => {
      // Arrange — no configuration: the generated seed IS the catalog.
      // Act
      const deps = getCoursePlatformDeps();
      const courses = await deps.courses.listAvailable();

      // Assert
      expect(courses.map((course) => course.id)).toEqual(
        seedContentCourses.map((course) => course.id),
      );
      expect(courses.map((course) => course.title)).toEqual(
        seedContentCourses.map((course) => course.title),
      );
    });

    test("WHEN the catalog is listed THEN the courses come back in ladder order", async () => {
      // Act
      const deps = getCoursePlatformDeps();
      const courses = await deps.courses.listAvailable();

      // Assert — derived, not literal: the ladder grows as courses are
      // declared in the manifest, and the invariant is the ordering.
      const sequences = courses.map((course) => course.sequence);
      expect(sequences).toEqual([...sequences].sort((a, b) => a - b));
    });

    test("WHEN the seed flag is set to any value THEN the catalog is unchanged", async () => {
      // Arrange — the variable is no longer read; setting it must be inert
      // rather than selecting a different, now-nonexistent seed.
      const withoutFlag = await getCoursePlatformDeps().courses.listAvailable();
      process.env.USE_COURSE_CONTENT_SEED = "0";

      // Act
      const withFlag = await getCoursePlatformDeps().courses.listAvailable();

      // Assert
      expect(withFlag.map((course) => course.id)).toEqual(withoutFlag.map((course) => course.id));
    });

    test("WHEN a course's lessons are listed THEN it gets exactly the ones it owns", async () => {
      // Act
      const deps = getCoursePlatformDeps();
      const lessons = await deps.lessons.listByCourse(contentCourse.id);

      // Assert
      expect(lessons).toHaveLength(contentCourse.lessonCount);
      expect(lessons.every((lesson) => lesson.courseId === contentCourse.id)).toBe(true);
    });

    test("WHEN a lesson id is looked up THEN the adapter resolves it, and an unknown id is null", async () => {
      // Arrange
      const deps = getCoursePlatformDeps();
      const [first] = await deps.lessons.listByCourse(contentCourse.id);

      // Act
      const found = await deps.lessons.byId(first!.id);
      const missing = await deps.lessons.byId(
        LessonId.parse("00000000-0000-4000-8000-000000000000"),
      );

      // Assert
      expect(found?.id).toBe(first!.id);
      expect(missing).toBeNull();
    });

    test("WHEN the graph is assembled THEN it exposes the continue-watching use case", async () => {
      // Arrange
      const deps = getCoursePlatformDeps();
      const [module_] = await deps.modules.listByCourse(contentCourse.id);
      // A course's lessons are ordered by sequence across every module, so
      // the first of the list need not belong to the first module.
      const lessons = await deps.lessons.listByCourse(contentCourse.id);
      const lesson = lessons.find((candidate) => candidate.moduleId === module_!.id);

      // Act
      const result = await deps.useCases.findContinueWatching({
        courseSlug: contentCourse.slug,
        moduleSlug: module_!.slug,
        lessonId: lesson!.id,
      });

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.course.id).toBe(contentCourse.id);
        expect(result.value.lesson.id).toBe(lesson!.id);
      }
    });
  });

  describe("content-locations.json", () => {
    test("WHEN no manifest exists THEN content URLs keep the pre-change local prefix", async () => {
      // Arrange — the default must be byte-identical to the old baked-in
      // behaviour, or every existing page silently 404s.
      // Act
      const source = await firstContentVideoSource();

      // Assert
      expect(source.startsWith("/local-filesystem-lesson/")).toBe(true);
    });

    test("WHEN the manifest points the local store at a CDN THEN URLs carry that prefix", async () => {
      // Arrange — the payoff: repointing storage is configuration, not a
      // regeneration of seed-content.ts.
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
      const other = seedContentCourses.find((course) => course.id !== keyedVideoCourse.id)!;
      useLocationManifest({
        stores: {
          local: { driver: "local" },
          cdn: { driver: "local", baseUrl: "https://cdn.example.com/migrated" },
        },
        default: "local",
        routes: [{ prefix: keyedVideoCourse.slug, store: "cdn" }],
      });

      // Act
      const source = await firstContentVideoSource();
      const deps = getCoursePlatformDeps();
      const otherLessons = await deps.lessons.listByCourse(other.id);
      const otherVideo = otherLessons.find((lesson) => lesson.kind === "video");

      // Assert
      expect(source.startsWith("https://cdn.example.com/migrated/")).toBe(true);
      // Asserted on the poster, not the source: the other course's videos are
      // served by YouTube and never reach a store at all, while their posters
      // are still content keys and must stay on the default one.
      expect(otherVideo?.kind === "video" && otherVideo.poster).toMatch(
        /^\/local-filesystem-lesson\//,
      );
    });

    test("WHEN the manifest is invalid THEN building the graph throws rather than falling back", () => {
      // Arrange
      useLocationManifest({ stores: { local: { driver: "local" } }, default: "missing-store" });

      // Act + Assert
      expect(() => getCoursePlatformDeps()).toThrow(/missing-store/);
    });
  });
});
