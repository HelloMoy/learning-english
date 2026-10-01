import type { CourseStanding } from "@/domain/entities/course-standing/course-standing";
import { Course } from "@/domain/entities/course/course";
import { LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type { CourseCatalogEntry } from "@/domain/use-cases/find-course-catalog/find-course-catalog";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { catalogLevels, firstLearnerLevel } from "./catalog-levels";

const buildEntry = (
  sequence: number,
  title: string,
  videoCount: number,
  standing: CourseStanding = { kind: "level", number: sequence },
): CourseCatalogEntry => {
  const course = Course.parse({
    id: faker.string.uuid(),
    slug: faker.helpers.slugify(title).toLowerCase(),
    title,
    description: faker.lorem.sentence(),
    language: "en",
    sequence,
    lessonCount: videoCount,
    moduleCount: 1,
    track: standing.kind,
  });
  const module_ = Module.parse({
    id: ModuleId.parse(faker.string.uuid()),
    courseId: course.id,
    slug: "module-1",
    title: "Introduction",
    sequence: 1,
  });
  return {
    course,
    standing,
    firstLesson: null,
    modules: [module_],
    lessonRuntimes: Array.from({ length: videoCount }, () => ({
      id: LessonId.parse(faker.string.uuid()),
      moduleId: module_.id,
      durationSeconds: 300,
    })),
  } as unknown as CourseCatalogEntry;
};

const basic = buildEntry(1, "Basic Course", 3);
const advanced = buildEntry(2, "Advanced Intermediate Course", 5);
const atlas = buildEntry(3, "Atlas of American Sounds", 63, { kind: "reference" });

describe("catalogLevels", () => {
  test("WHEN mapped THEN each entry keeps its course, standing, modules and lesson slices, in order", () => {
    const levels = catalogLevels([basic, atlas]);

    expect(levels).toEqual([
      {
        course: basic.course,
        standing: basic.standing,
        modules: basic.modules,
        lessonRuntimes: basic.lessonRuntimes,
      },
      {
        course: atlas.course,
        standing: { kind: "reference" },
        modules: atlas.modules,
        lessonRuntimes: atlas.lessonRuntimes,
      },
    ]);
  });
});

describe("firstLearnerLevel", () => {
  test("WHEN the catalog has courses THEN the learner card names the first level and its lessons", () => {
    const first = firstLearnerLevel([basic, advanced]);

    expect(first).toEqual({
      level: { number: 1, courseTitle: "Basic Course" },
      lessonRuntimes: basic.lessonRuntimes,
    });
  });

  test("WHEN a reference course comes first THEN the card still names level 1", () => {
    const referenceFirst = buildEntry(1, "Atlas of American Sounds", 63, { kind: "reference" });
    const levelOne = buildEntry(2, "Basic Course", 3, { kind: "level", number: 1 });

    const first = firstLearnerLevel([referenceFirst, levelOne]);

    expect(first).toEqual({
      level: { number: 1, courseTitle: "Basic Course" },
      lessonRuntimes: levelOne.lessonRuntimes,
    });
  });

  test("WHEN the catalog holds only reference courses THEN there is no level to name", () => {
    expect(firstLearnerLevel([atlas])).toBeNull();
  });

  test("WHEN the catalog is empty THEN there is no level to name", () => {
    expect(firstLearnerLevel([])).toBeNull();
  });
});
