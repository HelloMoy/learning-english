import type { BlobStore } from "@/adapters/persistence/blob-store/blob-store";
import type { LessonRow } from "@/adapters/persistence/local-filesystem/resolve-content-row/resolve-content-row";
import { CourseId, LessonId } from "@/domain/entities/ids/ids";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { LocalFilesystemLessonRepository } from "./local-filesystem-lesson-repository";

const courseId = CourseId.parse(faker.string.uuid());
const moduleId = faker.string.uuid();

/** Hand-written fake: the prefix is what the assertions look for. */
const blobStore: BlobStore = {
  url: (key) => `https://test.example/${key}`,
  exists: () => Promise.resolve(true),
  readText: () => Promise.resolve(""),
};

const readingRow = (sequence: number): LessonRow => ({
  kind: "reading",
  id: faker.string.uuid(),
  courseId,
  moduleId,
  sequence,
  title: faker.lorem.sentence(),
  body: faker.lorem.paragraph(),
});

const row1 = readingRow(1);
const row3 = readingRow(3);
const row2 = readingRow(2);

const repoOf = (rows: ReadonlyArray<LessonRow>) =>
  new LocalFilesystemLessonRepository({ rows, blobStore });

describe("LocalFilesystemLessonRepository", () => {
  describe("GIVEN three seeded lessons for one course, inserted out of order", () => {
    test("WHEN `listByCourse` is called THEN lessons come back in sequence order", async () => {
      // Arrange — insertion order is intentionally non-sorted.
      const repo = repoOf([row1, row3, row2]);

      // Act
      const result = await repo.listByCourse(courseId);

      // Assert — assert on insertion identity (form-specific), not titles.
      expect(result.map((l) => l.sequence)).toEqual([1, 2, 3]);
      expect(result[0]?.id).toBe(row1.id);
      expect(result[1]?.id).toBe(row2.id);
      expect(result[2]?.id).toBe(row3.id);
    });

    test("WHEN `byId` is called with a known lesson id THEN it returns that lesson", async () => {
      // Arrange
      const repo = repoOf([row1, row2, row3]);

      // Act
      const result = await repo.byId(LessonId.parse(row2.id));

      // Assert
      expect(result?.id).toBe(row2.id);
      expect(result?.title).toBe(row2.title);
    });

    test("WHEN `byId` is called with an unknown id THEN it returns `null`", async () => {
      // Arrange
      const repo = repoOf([row1]);
      const missing = LessonId.parse(faker.string.uuid());

      // Act
      const result = await repo.byId(missing);

      // Assert
      expect(result).toBeNull();
    });

    test("WHEN `listByCourse` is called for a course with no lessons THEN it returns `[]`", async () => {
      // Arrange
      const otherCourseId = CourseId.parse(faker.string.uuid());
      const repo = repoOf([row1]);

      // Act
      const result = await repo.listByCourse(otherCourseId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("GIVEN a video lesson row holding content keys", () => {
    const videoRow: LessonRow = {
      kind: "video",
      id: faker.string.uuid(),
      courseId,
      moduleId,
      sequence: 1,
      title: "Falling intonation",
      description: "When pitch goes down at the end of a statement.",
      source: "advanced-intermediate-course/5-sound-natural/03-falling-intonation.mp4",
      durationSeconds: 600,
      poster: "advanced-intermediate-course/5-sound-natural/03-falling-intonation.jpeg",
    };

    test("WHEN the lesson is read THEN `source` and `poster` are exactly what the BlobStore returns", async () => {
      // Arrange
      const repo = repoOf([videoRow]);

      // Act
      const result = await repo.byId(LessonId.parse(videoRow.id));

      // Assert — no path concatenation in the adapter itself.
      expect(result?.kind).toBe("video");
      if (result?.kind !== "video") throw new Error("unreachable");
      expect(result.source).toBe(
        "https://test.example/advanced-intermediate-course/5-sound-natural/03-falling-intonation.mp4",
      );
      expect(result.poster).toBe(
        "https://test.example/advanced-intermediate-course/5-sound-natural/03-falling-intonation.jpeg",
      );
    });

    test("WHEN a different BlobStore is supplied THEN the same row yields different URLs", async () => {
      // Arrange — the payoff of the whole change: repointing storage without
      // touching the seed.
      const cdn: BlobStore = {
        url: (key) => `https://cdn.example.com/course-content/${key}`,
        exists: () => Promise.resolve(true),
        readText: () => Promise.resolve(""),
      };
      const repo = new LocalFilesystemLessonRepository({ rows: [videoRow], blobStore: cdn });

      // Act
      const result = await repo.byId(LessonId.parse(videoRow.id));

      // Assert
      if (result?.kind !== "video") throw new Error("unreachable");
      expect(result.source).toBe(
        "https://cdn.example.com/course-content/advanced-intermediate-course/5-sound-natural/03-falling-intonation.mp4",
      );
    });
  });
});
