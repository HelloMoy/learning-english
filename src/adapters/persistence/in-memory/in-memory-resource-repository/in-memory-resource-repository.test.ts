import { CourseId, LessonId, ModuleId, ResourceId } from "@/domain/entities/ids/ids";
import { Resource } from "@/domain/entities/resource/resource";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { InMemoryResourceRepository } from "./in-memory-resource-repository";

const lessonAId = LessonId.parse(faker.string.uuid());
const lessonBId = LessonId.parse(faker.string.uuid());

const resourceA = Resource.parse({
  id: ResourceId.parse(faker.string.uuid()),
  lessonId: lessonAId,
  title: "Resource A",
  url: faker.internet.url(),
  kind: "pdf",
});
const resourceB = Resource.parse({
  id: ResourceId.parse(faker.string.uuid()),
  lessonId: lessonBId,
  title: "Resource B",
  url: faker.internet.url(),
  kind: "slides",
});
const resourceC = Resource.parse({
  id: ResourceId.parse(faker.string.uuid()),
  lessonId: lessonAId,
  title: "Resource C",
  url: faker.internet.url(),
  kind: "code",
});

describe("InMemoryResourceRepository", () => {
  const repo = new InMemoryResourceRepository([resourceA, resourceB, resourceC]);

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
    const empty = LessonId.parse(faker.string.uuid());

    // Act
    const result = await repo.listByLesson(empty);

    // Assert
    expect(result).toEqual([]);
  });

  test("WHEN `listByModule` is called THEN the v1 adapter returns every seeded resource (filtering by moduleId is a known limitation)", async () => {
    // Arrange — the Resource entity does not carry `moduleId`. v1
    // `listByModule` returns the full seed; the consumer is responsible
    // for the lesson→module join. Documenting the v1 contract here so
    // the test does not enshrine the limitation as a feature.
    const moduleId = ModuleId.parse(faker.string.uuid());

    // Act
    const result = await repo.listByModule(moduleId);

    // Assert
    expect(result).toHaveLength(3);
  });

  test("WHEN `listByCourse` is called THEN the v1 adapter returns every seeded resource (filtering by courseId is a known limitation)", async () => {
    // Arrange — same limitation as `listByModule`. See comment there.
    const courseId = CourseId.parse(faker.string.uuid());

    // Act
    const result = await repo.listByCourse(courseId);

    // Assert
    expect(result).toHaveLength(3);
  });
});
