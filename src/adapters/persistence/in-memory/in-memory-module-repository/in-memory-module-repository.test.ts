import { CourseId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import { Slug } from "@/domain/entities/slug/slug";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { InMemoryModuleRepository } from "./in-memory-module-repository";

const courseId = CourseId.parse(faker.string.uuid());

const moduleA = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId,
  slug: "module-a",
  title: "Module A",
  sequence: 1,
});
const moduleB = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId,
  slug: "module-b",
  title: "Module B",
  sequence: 2,
});
const moduleC = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId,
  slug: "module-c",
  title: "Module C",
  sequence: 3,
});

describe("InMemoryModuleRepository", () => {
  describe("GIVEN three seeded modules in insertion order C, A, B", () => {
    const repo = new InMemoryModuleRepository([moduleC, moduleA, moduleB]);

    test("WHEN `listByCourse` is called THEN modules come back in sequence order", async () => {
      // Act
      const result = await repo.listByCourse(courseId);

      // Assert
      expect(result.map((m) => m.slug)).toEqual(["module-a", "module-b", "module-c"]);
    });

    test("WHEN `byId` is called with a known id THEN it returns the module", async () => {
      // Act
      const result = await repo.byId(moduleB.id);

      // Assert
      expect(result).toEqual(moduleB);
    });

    test("WHEN `byId` is called with an unknown id THEN it returns `null`", async () => {
      // Arrange
      const missing = ModuleId.parse(faker.string.uuid());

      // Act
      const result = await repo.byId(missing);

      // Assert
      expect(result).toBeNull();
    });

    test("WHEN `byCourseAndSlug` is called with the seed's slug THEN it returns the module", async () => {
      // Act
      const result = await repo.byCourseAndSlug(courseId, moduleA.slug);

      // Assert
      expect(result).toEqual(moduleA);
    });

    test("WHEN `byCourseAndSlug` is called with an unknown slug THEN it returns `null`", async () => {
      // Arrange
      const missing = Slug.parse("no-such-slug");

      // Act
      const result = await repo.byCourseAndSlug(courseId, missing);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("GIVEN a different course's modules", () => {
    test("WHEN `listByCourse` is called for a course with no modules THEN it returns `[]`", async () => {
      // Arrange
      const otherCourse = CourseId.parse(faker.string.uuid());
      const repo = new InMemoryModuleRepository([moduleA]);

      // Act
      const result = await repo.listByCourse(otherCourse);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
