import { Course } from "@/domain/entities/course/course";
import { CourseId } from "@/domain/entities/ids/ids";
import { Slug } from "@/domain/entities/slug/slug";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { InMemoryCourseRepository } from "./in-memory-course-repository";

const seedId = faker.string.uuid();
const seedSlug = faker.lorem.slug();

const seed = Course.parse({
  id: seedId,
  slug: seedSlug,
  title: faker.commerce.productName(),
  description: faker.lorem.paragraph(),
  language: "en",
  lessonCount: 3,
  moduleCount: 1,
  sequence: 1,
});

describe("InMemoryCourseRepository", () => {
  describe("GIVEN the seed course", () => {
    test("WHEN `byId` is called with the seed id THEN it returns the course", async () => {
      // Arrange
      const repo = new InMemoryCourseRepository([seed]);

      // Act
      const result = await repo.byId(seed.id);

      // Assert
      expect(result).toEqual(seed);
    });

    test("WHEN `byId` is called with an unknown id THEN it returns `null`", async () => {
      // Arrange
      const repo = new InMemoryCourseRepository([seed]);
      const missing = CourseId.parse(faker.string.uuid());

      // Act
      const result = await repo.byId(missing);

      // Assert
      expect(result).toBeNull();
    });

    test("WHEN `bySlug` is called with the seed slug THEN it returns the course", async () => {
      // Arrange
      const repo = new InMemoryCourseRepository([seed]);

      // Act
      const result = await repo.bySlug(seed.slug);

      // Assert
      expect(result).toEqual(seed);
    });

    test("WHEN `bySlug` is called with an unknown slug THEN it returns `null`", async () => {
      // Arrange
      const repo = new InMemoryCourseRepository([seed]);
      const missing = Slug.parse(faker.lorem.slug());

      // Act
      const result = await repo.bySlug(missing);

      // Assert
      expect(result).toBeNull();
    });

    test("WHEN `listAvailable` is called THEN it returns all seeded courses", async () => {
      // Arrange
      const repo = new InMemoryCourseRepository([seed]);

      // Act
      const result = await repo.listAvailable();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(seed);
    });

    test("WHEN `byId` returns the course THEN `moduleCount` is preserved as seeded", async () => {
      // Arrange — task 4.4 mandates that the adapter preserves the seed's
      // moduleCount so the page can render it without re-deriving it.
      const repo = new InMemoryCourseRepository([seed]);

      // Act
      const result = await repo.byId(seed.id);

      // Assert
      expect(result?.moduleCount).toBe(seed.moduleCount);
    });

    test("WHEN `bySlug` returns the course THEN `moduleCount` is preserved as seeded", async () => {
      // Arrange
      const repo = new InMemoryCourseRepository([seed]);

      // Act
      const result = await repo.bySlug(seed.slug);

      // Assert
      expect(result?.moduleCount).toBe(seed.moduleCount);
    });

    test("WHEN two courses with different moduleCounts are seeded THEN both are returned with their own counts", async () => {
      // Arrange
      const other = Course.parse({
        id: faker.string.uuid(),
        slug: faker.lorem.slug(),
        title: faker.commerce.productName(),
        description: faker.lorem.paragraph(),
        language: "en",
        lessonCount: 0,
        moduleCount: 4,
        sequence: 1,
      });
      const repo = new InMemoryCourseRepository([seed, other]);

      // Act
      const list = await repo.listAvailable();

      // Assert
      expect(list).toHaveLength(2);
      const found = list.find((c) => c.id === other.id);
      expect(found?.moduleCount).toBe(4);
    });
  });

  describe("GIVEN courses stored out of ladder order", () => {
    const buildCourseAtSequence = (sequence: number) =>
      Course.parse({
        id: faker.string.uuid(),
        slug: faker.lorem.slug(),
        title: faker.commerce.productName(),
        description: faker.lorem.paragraph(),
        language: "en",
        lessonCount: 1,
        moduleCount: 1,
        sequence,
      });

    test("WHEN `listAvailable` is called THEN it returns them in ascending sequence order", async () => {
      // Arrange
      const third = buildCourseAtSequence(3);
      const first = buildCourseAtSequence(1);
      const second = buildCourseAtSequence(2);
      const repo = new InMemoryCourseRepository([third, first, second]);

      // Act
      const list = await repo.listAvailable();

      // Assert
      expect(list.map((course) => course.sequence)).toEqual([1, 2, 3]);
      expect(list.map((course) => course.id)).toEqual([first.id, second.id, third.id]);
    });

    test("WHEN `listAvailable` is called twice THEN the constructor array is never mutated", async () => {
      // Arrange
      // Sorting in place would reorder the caller's seed array as a side
      // effect — invisible here, but not in the seeds this is constructed from.
      const third = buildCourseAtSequence(3);
      const first = buildCourseAtSequence(1);
      const seeded = [third, first];
      const repo = new InMemoryCourseRepository(seeded);

      // Act
      await repo.listAvailable();

      // Assert
      expect(seeded.map((course) => course.id)).toEqual([third.id, first.id]);
    });
  });
});
