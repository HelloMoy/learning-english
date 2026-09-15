import { LessonId, ModuleId } from "@/domain/entities/ids/ids";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { countModuleLessons } from "./module-lesson-count";

const moduleId = ModuleId.parse(faker.string.uuid());
const otherModuleId = ModuleId.parse(faker.string.uuid());

const runtime = (inModule: ModuleId) => ({
  id: LessonId.parse(faker.string.uuid()),
  moduleId: inModule,
  durationSeconds: faker.number.int({ min: 0, max: 900 }),
});

describe("countModuleLessons", () => {
  test("WHEN a course's lessons span several modules THEN only the named module's lessons are counted", () => {
    const lessonRuntimes = [runtime(moduleId), runtime(otherModuleId), runtime(moduleId)];

    expect(countModuleLessons(lessonRuntimes, moduleId)).toBe(2);
  });

  test("WHEN the module holds no lessons THEN the count is zero", () => {
    expect(countModuleLessons([runtime(otherModuleId)], moduleId)).toBe(0);
  });
});
