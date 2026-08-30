import type { BlobStore } from "@/adapters/persistence/blob-store/blob-store";
import { CourseId } from "@/domain/entities/ids/ids";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import {
  resolveLessonRow,
  resolveResourceRow,
  type LessonRow,
  type ResourceRow,
} from "./resolve-content-row";

const courseId = CourseId.parse(faker.string.uuid());
const moduleId = faker.string.uuid();
const lessonId = faker.string.uuid();

/**
 * A hand-written fake rather than a mock: assertions then read as "the
 * prefix arrived" instead of "the spy was called with". `keysAsked` exists
 * only for the two cases that must prove `url` was NOT consulted.
 */
function fakeBlobStore(prefix = "https://test.example"): BlobStore & { keysAsked: string[] } {
  const keysAsked: string[] = [];
  return {
    keysAsked,
    url(key: string): string {
      keysAsked.push(key);
      return `${prefix}/${key}`;
    },
    exists(): Promise<boolean> {
      return Promise.resolve(true);
    },
    readText(): Promise<string> {
      return Promise.resolve("");
    },
  };
}

const videoRow = (overrides: Partial<LessonRow> = {}): LessonRow =>
  ({
    kind: "video",
    id: lessonId,
    courseId,
    moduleId,
    sequence: 1,
    title: faker.lorem.sentence(),
    description: faker.lorem.sentence(),
    source: "course/module/lesson/video.mp4",
    durationSeconds: 120,
    ...overrides,
  }) as LessonRow;

describe("resolveLessonRow", () => {
  test("resolves a video row's source key through the BlobStore", () => {
    const store = fakeBlobStore();

    const lesson = resolveLessonRow(videoRow(), store);

    expect(lesson.kind).toBe("video");
    if (lesson.kind !== "video") throw new Error("unreachable");
    expect(lesson.source).toBe("https://test.example/course/module/lesson/video.mp4");
  });

  test("resolves a video row's poster key when one is present", () => {
    const store = fakeBlobStore();

    const lesson = resolveLessonRow(
      videoRow({ poster: "course/module/lesson/thumb.jpeg" } as Partial<LessonRow>),
      store,
    );

    if (lesson.kind !== "video") throw new Error("unreachable");
    expect(lesson.poster).toBe("https://test.example/course/module/lesson/thumb.jpeg");
  });

  test("leaves an absent poster absent and never asks the store for it", () => {
    const store = fakeBlobStore();

    const lesson = resolveLessonRow(videoRow(), store);

    if (lesson.kind !== "video") throw new Error("unreachable");
    expect(lesson.poster).toBeUndefined();
    // The bug this guards: `url(undefined)` yields ".../undefined", which
    // passes urlOrRelativePath() and then 404s at runtime.
    expect(store.keysAsked).toEqual(["course/module/lesson/video.mp4"]);
  });

  test("passes a reading row through without consulting the store", () => {
    const store = fakeBlobStore();
    const body = faker.lorem.paragraph();

    const lesson = resolveLessonRow(
      {
        kind: "reading",
        id: lessonId,
        courseId,
        moduleId,
        sequence: 2,
        title: faker.lorem.sentence(),
        body,
      },
      store,
    );

    expect(lesson.kind).toBe("reading");
    if (lesson.kind !== "reading") throw new Error("unreachable");
    expect(lesson.body).toBe(body);
    expect(store.keysAsked).toEqual([]);
  });

  test("throws when the resolved value is not a URL or site-relative path", () => {
    // A misconfigured store returning a bare relative string.
    const broken: BlobStore = {
      url: (key) => key,
      exists: () => Promise.resolve(true),
      readText: () => Promise.resolve(""),
    };

    expect(() => resolveLessonRow(videoRow(), broken)).toThrow();
  });
});

describe("resolveResourceRow", () => {
  const resourceRow = (): ResourceRow => ({
    id: faker.string.uuid(),
    lessonId,
    title: faker.lorem.words(2),
    url: "course/module/lesson/handout.pdf",
    kind: "pdf",
  });

  test("resolves the url key through the BlobStore", () => {
    const store = fakeBlobStore();

    const resource = resolveResourceRow(resourceRow(), store);

    expect(resource.url).toBe("https://test.example/course/module/lesson/handout.pdf");
    expect(resource.kind).toBe("pdf");
  });

  test("throws when the resolved value is not a URL or site-relative path", () => {
    const broken: BlobStore = {
      url: (key) => key,
      exists: () => Promise.resolve(true),
      readText: () => Promise.resolve(""),
    };

    expect(() => resolveResourceRow(resourceRow(), broken)).toThrow();
  });
});
