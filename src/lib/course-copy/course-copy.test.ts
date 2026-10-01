import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { courseCopy } from "./course-copy";

const sentences = (count: number) =>
  faker.helpers.multiple(() => faker.lorem.sentence(), { count });

const points = (count: number) => faker.helpers.multiple(() => faker.lorem.words(3), { count });

const course = {
  description: faker.lorem.sentence(),
  outcomes: sentences(3),
  audience: faker.lorem.sentence(),
  highlights: points(3),
  translations: {
    es: {
      description: faker.lorem.sentence(),
      outcomes: sentences(3),
      audience: faker.lorem.sentence(),
      highlights: points(3),
    },
    pt: { description: faker.lorem.sentence() },
  },
};

describe("courseCopy", () => {
  describe("GIVEN a course translated into the locale", () => {
    test("WHEN read THEN the description, outcomes, audience AND highlights are the translation's", () => {
      // Arrange
      const locale = "es";

      // Act
      const copy = courseCopy(course, locale);

      // Assert
      expect(copy).toEqual(course.translations.es);
    });
  });

  describe("GIVEN a translation that covers only the description", () => {
    test("WHEN read THEN the other fields fall back to the course's own", () => {
      // Arrange
      const locale = "pt";

      // Act
      const copy = courseCopy(course, locale);

      // Assert
      expect(copy).toEqual({
        description: course.translations.pt.description,
        outcomes: course.outcomes,
        audience: course.audience,
        highlights: course.highlights,
      });
    });
  });

  describe("GIVEN a locale the course has no translation for", () => {
    test("WHEN read THEN the course's own copy is returned", () => {
      // Arrange
      const locale = "en";

      // Act
      const copy = courseCopy(course, locale);

      // Assert
      expect(copy).toEqual({
        description: course.description,
        outcomes: course.outcomes,
        audience: course.audience,
        highlights: course.highlights,
      });
    });
  });

  describe("GIVEN a course that declares only a description", () => {
    test("WHEN read THEN there are no outcomes, no audience AND no highlights", () => {
      // Arrange
      const bare = { description: faker.lorem.sentence() };

      // Act
      const copy = courseCopy(bare, "es");

      // Assert
      expect(copy).toEqual({ description: bare.description, outcomes: [], highlights: [] });
      expect(copy.audience).toBeUndefined();
    });
  });
});
