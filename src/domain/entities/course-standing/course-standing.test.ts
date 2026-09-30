import { Course, type CourseTrack } from "@/domain/entities/course/course";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { courseStandings, findFirstLevel, standingInCatalog } from "./course-standing";

function aCourse(sequence: number, track: CourseTrack): Course {
  return Course.parse({
    id: faker.string.uuid(),
    slug: faker.lorem.slug(),
    title: faker.commerce.productName(),
    description: faker.lorem.sentence(),
    language: "en",
    lessonCount: faker.number.int({ min: 1, max: 60 }),
    moduleCount: faker.number.int({ min: 1, max: 12 }),
    sequence,
    track,
  });
}

describe("courseStandings", () => {
  test("WHEN a reference course sits between two levels THEN the levels still number consecutively", () => {
    // Arrange
    const first = aCourse(1, "level");
    const reference = aCourse(2, "reference");
    const second = aCourse(3, "level");

    // Act
    const standings = courseStandings([first, reference, second]);

    // Assert
    expect(standings.get(first.id)).toEqual({ kind: "level", number: 1 });
    expect(standings.get(reference.id)).toEqual({ kind: "reference" });
    expect(standings.get(second.id)).toEqual({ kind: "level", number: 2 });
  });

  test("WHEN today's catalog is read THEN Basic is level 1, Advanced level 2 and the Atlas a reference", () => {
    // Arrange
    const basic = aCourse(1, "level");
    const advanced = aCourse(2, "level");
    const atlas = aCourse(3, "reference");

    // Act
    const standings = courseStandings([basic, advanced, atlas]);

    // Assert
    expect([...standings.values()]).toEqual([
      { kind: "level", number: 1 },
      { kind: "level", number: 2 },
      { kind: "reference" },
    ]);
  });

  test("WHEN courses arrive out of sequence order THEN levels are numbered by sequence, not arrival", () => {
    // Arrange
    const later = aCourse(7, "level");
    const earlier = aCourse(4, "level");

    // Act
    const standings = courseStandings([later, earlier]);

    // Assert
    expect(standings.get(earlier.id)).toEqual({ kind: "level", number: 1 });
    expect(standings.get(later.id)).toEqual({ kind: "level", number: 2 });
  });
});

describe("findFirstLevel", () => {
  test("WHEN a reference course comes first THEN the level-1 item is returned", () => {
    // Arrange
    const reference = { name: faker.lorem.word(), standing: { kind: "reference" } as const };
    const firstLevel = {
      name: faker.lorem.word(),
      standing: { kind: "level", number: 1 } as const,
    };
    const secondLevel = {
      name: faker.lorem.word(),
      standing: { kind: "level", number: 2 } as const,
    };

    // Act
    const found = findFirstLevel([reference, secondLevel, firstLevel]);

    // Assert
    expect(found).toBe(firstLevel);
  });

  test("WHEN no item is a level THEN nothing is found", () => {
    // Arrange
    const reference = { standing: { kind: "reference" } as const };

    // Act + Assert
    expect(findFirstLevel([reference])).toBeUndefined();
  });
});

describe("standingInCatalog", () => {
  test("WHEN the course is in the catalog THEN its derived standing is returned", () => {
    // Arrange
    const reference = aCourse(1, "reference");
    const level = aCourse(2, "level");

    // Act + Assert
    expect(standingInCatalog([reference, level], level)).toEqual({ kind: "level", number: 1 });
  });

  test("WHEN the catalog omits the course THEN it is placed among the catalog by its sequence", () => {
    // Arrange
    const first = aCourse(1, "level");
    const missing = aCourse(2, "level");

    // Act + Assert
    expect(standingInCatalog([first], missing)).toEqual({ kind: "level", number: 2 });
  });
});
