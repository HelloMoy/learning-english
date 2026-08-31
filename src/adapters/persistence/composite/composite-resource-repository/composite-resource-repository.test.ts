import { CourseId, LessonId, ModuleId, ResourceId } from "@/domain/entities/ids/ids";
import { Resource } from "@/domain/entities/resource/resource";
import type { ResourceRepository } from "@/domain/ports/resource-repository/resource-repository";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { CompositeResourceRepository } from "./composite-resource-repository";

const lessonA = LessonId.parse(faker.string.uuid());
const lessonB = LessonId.parse(faker.string.uuid());
const moduleId = ModuleId.parse(faker.string.uuid());
const courseId = CourseId.parse(faker.string.uuid());

const buildResource = (lessonId: LessonId): Resource =>
  Resource.parse({
    id: ResourceId.parse(faker.string.uuid()),
    lessonId,
    title: faker.lorem.sentence(),
    url: "/handouts/sheet.pdf",
    kind: "pdf",
  });

/**
 * A minimal `ResourceRepository` over a fixed list. The shared stub in
 * `test-setup` answers `listByModule` / `listByCourse` with everything it
 * holds, which cannot show that the composite merges two delegates.
 */
const makeDelegate = (resources: Resource[]): ResourceRepository => ({
  byId: async (id: ResourceId) => resources.find((r) => r.id === id) ?? null,
  listByLesson: async (lessonId: LessonId) => resources.filter((r) => r.lessonId === lessonId),
  listByModule: async () => resources,
  listByCourse: async () => resources,
});

describe("CompositeResourceRepository", () => {
  const ownedByFirst = buildResource(lessonA);
  const ownedBySecond = buildResource(lessonB);
  const build = () =>
    new CompositeResourceRepository([makeDelegate([ownedByFirst]), makeDelegate([ownedBySecond])]);

  describe("GIVEN two delegates that own different lessons", () => {
    test("WHEN `byId` asks for either delegate's resource THEN it is returned", async () => {
      // Arrange
      const repo = build();

      // Act
      const fromFirst = await repo.byId(ownedByFirst.id);
      const fromSecond = await repo.byId(ownedBySecond.id);

      // Assert
      expect(fromFirst?.id).toBe(ownedByFirst.id);
      expect(fromSecond?.id).toBe(ownedBySecond.id);
    });

    test("WHEN `byId` asks for an unknown id THEN it returns `null`", async () => {
      // Arrange
      const repo = build();

      // Act
      const result = await repo.byId(ResourceId.parse(faker.string.uuid()));

      // Assert
      expect(result).toBeNull();
    });

    test("WHEN `listByLesson` asks for a lesson only one delegate owns THEN only its resources come back", async () => {
      // Arrange
      const repo = build();

      // Act
      const result = await repo.listByLesson(lessonA);

      // Assert
      expect(result.map((resource) => resource.id)).toEqual([ownedByFirst.id]);
    });

    test("WHEN `listByModule` is called THEN both delegates contribute", async () => {
      // Arrange
      const repo = build();

      // Act
      const result = await repo.listByModule(moduleId);

      // Assert
      expect(result.map((resource) => resource.id)).toEqual([ownedByFirst.id, ownedBySecond.id]);
    });

    test("WHEN `listByCourse` is called THEN both delegates contribute", async () => {
      // Arrange
      const repo = build();

      // Act
      const result = await repo.listByCourse(courseId);

      // Assert
      expect(result).toHaveLength(2);
    });
  });

  describe("GIVEN no delegates at all", () => {
    test("WHEN queried THEN it answers empty rather than throwing", async () => {
      // Arrange
      const repo = new CompositeResourceRepository([]);

      // Act
      const byId = await repo.byId(ResourceId.parse(faker.string.uuid()));
      const byLesson = await repo.listByLesson(lessonA);

      // Assert
      expect(byId).toBeNull();
      expect(byLesson).toEqual([]);
    });
  });
});
