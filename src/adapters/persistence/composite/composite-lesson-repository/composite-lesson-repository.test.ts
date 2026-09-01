import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import type { LessonRepository } from "@/domain/ports/lesson-repository/lesson-repository";
import { makeStubLessonRepository } from "@/test-setup/stubs/domain-repos";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { CompositeLessonRepository } from "./composite-lesson-repository";

const courseA = CourseId.parse(faker.string.uuid());
const courseB = CourseId.parse(faker.string.uuid());
const moduleId = ModuleId.parse(faker.string.uuid());

const buildLesson = (courseId: CourseId, sequence: number): Lesson =>
  Lesson.parse({
    kind: "reading",
    id: LessonId.parse(faker.string.uuid()),
    courseId,
    moduleId,
    sequence,
    title: faker.lorem.sentence(),
    body: faker.lorem.paragraph(),
  });

describe("CompositeLessonRepository", () => {
  describe("GIVEN two delegates that own different courses", () => {
    const ownedByFirst = buildLesson(courseA, 1);
    const ownedBySecond = buildLesson(courseB, 1);
    const build = () =>
      new CompositeLessonRepository([
        makeStubLessonRepository({ lessons: [ownedByFirst] }),
        makeStubLessonRepository({ lessons: [ownedBySecond] }),
      ]);

    test("WHEN `byId` asks for the first delegate's lesson THEN it is returned", async () => {
      // Arrange
      const repo = build();

      // Act
      const result = await repo.byId(ownedByFirst.id);

      // Assert
      expect(result?.id).toBe(ownedByFirst.id);
    });

    test("WHEN `byId` asks for the second delegate's lesson THEN it is returned", async () => {
      // Arrange
      const repo = build();

      // Act
      const result = await repo.byId(ownedBySecond.id);

      // Assert
      expect(result?.id).toBe(ownedBySecond.id);
    });

    test("WHEN `byId` asks for an id no delegate owns THEN it returns `null`", async () => {
      // Arrange
      const repo = build();
      const unknown = LessonId.parse(faker.string.uuid());

      // Act
      const result = await repo.byId(unknown);

      // Assert
      expect(result).toBeNull();
    });

    test("WHEN `listByCourse` asks for a course only one delegate owns THEN only its lessons come back", async () => {
      // Arrange
      const repo = build();

      // Act
      const result = await repo.listByCourse(courseA);

      // Assert
      expect(result.map((lesson) => lesson.id)).toEqual([ownedByFirst.id]);
    });

    test("WHEN `listByCourse` asks for a course no delegate owns THEN it returns an empty list", async () => {
      // Arrange
      const repo = build();
      const unknown = CourseId.parse(faker.string.uuid());

      // Act
      const result = await repo.listByCourse(unknown);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("GIVEN two delegates holding the same id", () => {
    test("WHEN `byId` is called THEN the first delegate wins", async () => {
      // Arrange
      // Ids are UUIDs from disjoint namespaces, so this cannot happen with
      // the shipped seeds — but "first hit wins" has to be a decision, not
      // an accident of iteration order.
      const shared = buildLesson(courseA, 1);
      const shadowed = Lesson.parse({ ...shared, title: "shadowed" });
      const repo = new CompositeLessonRepository([
        makeStubLessonRepository({ lessons: [shared] }),
        makeStubLessonRepository({ lessons: [shadowed] }),
      ]);

      // Act
      const result = await repo.byId(shared.id);

      // Assert
      expect(result?.title).toBe(shared.title);
    });
  });

  describe("GIVEN delegates that both hold lessons of one course", () => {
    test("WHEN `listByCourse` is called THEN the merged list is in sequence order", async () => {
      // Arrange
      // The port promises canonical `sequence` order. Concatenating two
      // already-sorted lists does not preserve that, so the composite sorts.
      const second = buildLesson(courseA, 2);
      const first = buildLesson(courseA, 1);
      const repo = new CompositeLessonRepository([
        makeStubLessonRepository({ lessons: [second] }),
        makeStubLessonRepository({ lessons: [first] }),
      ]);

      // Act
      const result = await repo.listByCourse(courseA);

      // Assert
      expect(result.map((lesson) => lesson.sequence)).toEqual([1, 2]);
    });
  });

  describe("GIVEN no delegates at all", () => {
    test("WHEN queried THEN it answers empty rather than throwing", async () => {
      // Arrange
      const repo = new CompositeLessonRepository([] as ReadonlyArray<LessonRepository>);

      // Act
      const byId = await repo.byId(LessonId.parse(faker.string.uuid()));
      const list = await repo.listByCourse(courseA);

      // Assert
      expect(byId).toBeNull();
      expect(list).toEqual([]);
    });
  });
});
