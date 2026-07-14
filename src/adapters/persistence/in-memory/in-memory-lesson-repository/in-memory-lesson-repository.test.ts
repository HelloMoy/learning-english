import { CourseId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { InMemoryLessonRepository } from "./in-memory-lesson-repository";

const courseId = CourseId.parse(faker.string.uuid());
const moduleId = faker.string.uuid();

const lesson1 = Lesson.parse({
  kind: "reading",
  id: faker.string.uuid(),
  courseId: courseId,
  moduleId: moduleId,
  sequence: 1,
  title: faker.lorem.sentence(),
  body: faker.lorem.paragraph(),
});

const lesson3 = Lesson.parse({
  kind: "reading",
  id: faker.string.uuid(),
  courseId: courseId,
  moduleId: moduleId,
  sequence: 3,
  title: faker.lorem.sentence(),
  body: faker.lorem.paragraph(),
});

const lesson2 = Lesson.parse({
  kind: "reading",
  id: faker.string.uuid(),
  courseId: courseId,
  moduleId: moduleId,
  sequence: 2,
  title: faker.lorem.sentence(),
  body: faker.lorem.paragraph(),
});

describe("InMemoryLessonRepository", () => {
  describe("GIVEN three seeded lessons for one course, inserted out of order", () => {
    test("WHEN `listByCourse` is called THEN lessons come back in sequence order", async () => {
      // Arrange — insertion order is intentionally non-sorted.
      const repo = new InMemoryLessonRepository([lesson1, lesson3, lesson2]);

      // Act
      const result = await repo.listByCourse(courseId);

      // Assert — assert on insertion identity (form-specific), not titles.
      expect(result.map((l) => l.sequence)).toEqual([1, 2, 3]);
      expect(result[0]?.id).toBe(lesson1.id);
      expect(result[1]?.id).toBe(lesson2.id);
      expect(result[2]?.id).toBe(lesson3.id);
    });

    test("WHEN `byId` is called with a known lesson id THEN it returns that lesson", async () => {
      // Arrange
      const repo = new InMemoryLessonRepository([lesson1, lesson2, lesson3]);

      // Act
      const result = await repo.byId(lesson2.id);

      // Assert
      expect(result).toEqual(lesson2);
    });

    test("WHEN `byId` is called with an unknown id THEN it returns `null`", async () => {
      // Arrange
      const repo = new InMemoryLessonRepository([lesson1]);
      const missing = faker.string.uuid() as ReturnType<typeof Lesson.parse>["id"];

      // Act
      const result = await repo.byId(missing);

      // Assert
      expect(result).toBeNull();
    });

    test("WHEN `listByCourse` is called for a course with no lessons THEN it returns `[]`", async () => {
      // Arrange
      const otherCourseId = CourseId.parse(faker.string.uuid());
      const repo = new InMemoryLessonRepository([lesson1]);

      // Act
      const result = await repo.listByCourse(otherCourseId);

      // Assert
      expect(result).toEqual([]);
    });

    test("WHEN lessons across multiple modules are seeded THEN `listByCourse` returns them all sorted by `sequence` (cross-module ordering is the consumer's responsibility)", async () => {
      // Arrange — task 4.5 calls for cross-module ordering. The current
      // adapter sorts by `sequence` only; module-aware ordering is the
      // consumer's job (the use case filters by `moduleId` and consults
      // `moduleRepository.listByCourse`). Two modules with one lesson
      // each, sequences 1 and 2; the second module's lesson has sequence
      // 1 but its moduleId is different.
      const moduleB = faker.string.uuid();
      const lessonB1 = Lesson.parse({
        kind: "reading",
        id: faker.string.uuid(),
        courseId,
        moduleId: moduleB,
        sequence: 1,
        title: faker.lorem.sentence(),
        body: faker.lorem.paragraph(),
      });
      const repo = new InMemoryLessonRepository([lesson1, lessonB1, lesson2, lesson3]);

      // Act
      const result = await repo.listByCourse(courseId);

      // Assert — every seeded lesson is returned, ordered by `sequence`.
      expect(result).toHaveLength(4);
      expect(result.map((l) => l.id)).toEqual([lesson1.id, lessonB1.id, lesson2.id, lesson3.id]);
      expect(result.map((l) => l.sequence)).toEqual([1, 1, 2, 3]);
    });
  });
});
