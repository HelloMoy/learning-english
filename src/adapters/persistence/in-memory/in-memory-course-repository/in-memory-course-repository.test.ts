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
  });
});
