import { CourseId, LessonId, ModuleId, ResourceId } from "@/domain/entities/ids/ids";
import { Resource } from "@/domain/entities/resource/resource";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { LocalFilesystemResourceRepository } from "./local-filesystem-resource-repository";

const lessonAId = LessonId.parse(faker.string.uuid());
const lessonBId = LessonId.parse(faker.string.uuid());

const resourceA = Resource.parse({
  id: ResourceId.parse(faker.string.uuid()),
  lessonId: lessonAId,
  title: "Vowel chart",
  url: "/local-filesystem-lesson/advanced-intermediate-course/1-advanced-pronunciation-course/01-intro/vowel-chart.pdf",
  kind: "pdf",
});

const resourceB = Resource.parse({
  id: ResourceId.parse(faker.string.uuid()),
  lessonId: lessonBId,
  title: "Intonation examples",
  url: "/local-filesystem-lesson/advanced-intermediate-course/5-sound-natural/03-falling-intonation/falling-intonation-examples.pdf",
  kind: "slides",
});

const resourceC = Resource.parse({
  id: ResourceId.parse(faker.string.uuid()),
  lessonId: lessonAId,
  title: "Drill script",
  url: "/local-filesystem-lesson/advanced-intermediate-course/1-advanced-pronunciation-course/02-drills/drill-script.zip",
  kind: "code",
});

describe("LocalFilesystemResourceRepository", () => {
  const repo = new LocalFilesystemResourceRepository([resourceA, resourceB, resourceC]);

  test("WHEN `byId` is called with a known id THEN it returns the resource", async () => {
    // Act
    const result = await repo.byId(resourceB.id);

    // Assert
    expect(result).toEqual(resourceB);
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
    expect(result.map((r) => r.id).sort()).toEqual([resourceA.id, resourceC.id].sort());
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

  test("WHEN a Resource carries a pre-resolved URL from the seed generator THEN the adapter serves it unchanged (no path concatenation in the adapter itself)", async () => {
    // Arrange — the seed generator (scripts/generate-course-content-seed.ts)
    // bakes blobStore.url(key) into the resource's `url`. The adapter must
    // NOT mutate or re-resolve it.
    const handCraftedResource = Resource.parse({
      id: ResourceId.parse(faker.string.uuid()),
      lessonId: lessonAId,
      title: "Test resource",
      url: "/local-filesystem-lesson/advanced-intermediate-course/5-sound-natural/03-falling-intonation/test.pdf",
      kind: "pdf",
    });
    const isolatedRepo = new LocalFilesystemResourceRepository([handCraftedResource]);

    // Act
    const result = await isolatedRepo.byId(handCraftedResource.id);

    // Assert — the URL is preserved byte-for-byte.
    expect(result?.url).toBe(handCraftedResource.url);
  });
});
