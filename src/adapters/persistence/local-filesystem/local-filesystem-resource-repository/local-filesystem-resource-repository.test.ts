import type { BlobStore } from "@/adapters/persistence/blob-store/blob-store";
import type { ResourceRow } from "@/adapters/persistence/local-filesystem/resolve-content-row/resolve-content-row";
import { CourseId, LessonId, ModuleId, ResourceId } from "@/domain/entities/ids/ids";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { LocalFilesystemResourceRepository } from "./local-filesystem-resource-repository";

const lessonAId = LessonId.parse(faker.string.uuid());
const lessonBId = LessonId.parse(faker.string.uuid());

/** Hand-written fake: the prefix is what the assertions look for. */
const blobStore: BlobStore = {
  url: (key) => `https://test.example/${key}`,
  exists: () => Promise.resolve(true),
  readText: () => Promise.resolve(""),
};

const rowA: ResourceRow = {
  id: ResourceId.parse(faker.string.uuid()),
  lessonId: lessonAId,
  title: "Vowel chart",
  url: "advanced-intermediate-course/1-advanced-pronunciation-course/01-intro/vowel-chart.pdf",
  kind: "pdf",
};

const rowB: ResourceRow = {
  id: ResourceId.parse(faker.string.uuid()),
  lessonId: lessonBId,
  title: "Intonation examples",
  url: "advanced-intermediate-course/5-sound-natural/03-falling-intonation/examples.pdf",
  kind: "slides",
};

const rowC: ResourceRow = {
  id: ResourceId.parse(faker.string.uuid()),
  lessonId: lessonAId,
  title: "Drill script",
  url: "advanced-intermediate-course/1-advanced-pronunciation-course/02-drills/drill-script.zip",
  kind: "code",
};

describe("LocalFilesystemResourceRepository", () => {
  const repo = new LocalFilesystemResourceRepository({ rows: [rowA, rowB, rowC], blobStore });

  test("WHEN `byId` is called with a known id THEN it returns the resource", async () => {
    // Act
    const result = await repo.byId(ResourceId.parse(rowB.id));

    // Assert
    expect(result?.id).toBe(rowB.id);
    expect(result?.title).toBe(rowB.title);
  });

  test("WHEN `byId` is called with an unknown id THEN it returns `null`", async () => {
    // Arrange
    const missing = ResourceId.parse(faker.string.uuid());

    // Act
    const result = await repo.byId(missing);

    // Assert
    expect(result).toBeNull();
  });

  test("WHEN `listByLesson` is called THEN it returns only that lesson's resources", async () => {
    // Act
    const result = await repo.listByLesson(lessonAId);

    // Assert
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id).sort()).toEqual([rowA.id, rowC.id].sort());
  });

  test("WHEN `listByLesson` is called for a lesson with no resources THEN it returns `[]`", async () => {
    // Arrange
    const orphanLesson = LessonId.parse(faker.string.uuid());

    // Act
    const result = await repo.listByLesson(orphanLesson);

    // Assert
    expect(result).toEqual([]);
  });

  test("WHEN `listByModule` is called THEN it returns the full resource set (Resource has no moduleId field)", async () => {
    // Arrange
    const moduleId = ModuleId.parse(faker.string.uuid());

    // Act
    const result = await repo.listByModule(moduleId);

    // Assert — see the comment in the adapter: module-level filtering is
    // the consumer's responsibility, joined via `ModuleRepository`.
    expect(result).toHaveLength(3);
  });

  test("WHEN `listByCourse` is called THEN it returns the full resource set (Resource has no courseId field)", async () => {
    // Arrange
    const courseId = CourseId.parse(faker.string.uuid());

    // Act
    const result = await repo.listByCourse(courseId);

    // Assert
    expect(result).toHaveLength(3);
  });

  test("WHEN a resource row is read THEN `url` is exactly what the BlobStore returns", async () => {
    // Act
    const result = await repo.byId(ResourceId.parse(rowA.id));

    // Assert — no path concatenation in the adapter itself.
    expect(result?.url).toBe(
      "https://test.example/advanced-intermediate-course/1-advanced-pronunciation-course/01-intro/vowel-chart.pdf",
    );
  });

  test("WHEN a different BlobStore is supplied THEN the same rows yield different URLs", async () => {
    // Arrange — repointing storage without touching the seed.
    const cdn: BlobStore = {
      url: (key) => `https://cdn.example.com/course-content/${key}`,
      exists: () => Promise.resolve(true),
      readText: () => Promise.resolve(""),
    };
    const cdnRepo = new LocalFilesystemResourceRepository({ rows: [rowA], blobStore: cdn });

    // Act
    const result = await cdnRepo.byId(ResourceId.parse(rowA.id));

    // Assert
    expect(result?.url).toBe(
      "https://cdn.example.com/course-content/advanced-intermediate-course/1-advanced-pronunciation-course/01-intro/vowel-chart.pdf",
    );
  });
});
