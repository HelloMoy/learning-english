import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { lessonPositionInModule } from "./lesson-position";

const courseId = CourseId.parse(faker.string.uuid());

const makeModuleId = (): ModuleId => ModuleId.parse(faker.string.uuid());

const makeLesson = (moduleId: ModuleId, sequence: number): Lesson =>
  Lesson.parse({
    kind: "reading",
    id: LessonId.parse(faker.string.uuid()),
    courseId,
    moduleId,
    sequence,
    title: faker.lorem.words(3),
    body: faker.lorem.sentence(),
  });

/** A module's lessons, built in `sequence` order. */
const makeModuleLessons = (moduleId: ModuleId, lessonCount: number): Lesson[] =>
  Array.from({ length: lessonCount }, (_, index) => makeLesson(moduleId, index + 1));

describe("lessonPositionInModule", () => {
  describe("GIVEN a lesson in the middle of its module", () => {
    test("WHEN the position is read THEN it counts from one within that module", () => {
      const moduleId = makeModuleId();
      const lessons = makeModuleLessons(moduleId, 27);

      expect(lessonPositionInModule(lessons, lessons[12]!.id)).toEqual({
        position: 13,
        total: 27,
      });
    });
  });

  describe("GIVEN a course of several modules", () => {
    test("WHEN the current lesson's module is read THEN the sibling modules are not counted", () => {
      // The reading is about the module named beside it, not about the course.
      const earlier = makeModuleLessons(makeModuleId(), 40);
      const current = makeModuleLessons(makeModuleId(), 27);
      const later = makeModuleLessons(makeModuleId(), 40);

      const position = lessonPositionInModule([...earlier, ...current, ...later], current[12]!.id);

      expect(position).toEqual({ position: 13, total: 27 });
    });
  });

  describe("GIVEN lessons handed over out of order", () => {
    test("WHEN the position is read THEN it follows sequence, not array order", () => {
      const moduleId = makeModuleId();
      const inOrder = makeModuleLessons(moduleId, 5);
      const shuffled = [inOrder[3]!, inOrder[0]!, inOrder[4]!, inOrder[1]!, inOrder[2]!];

      expect(lessonPositionInModule(shuffled, inOrder[3]!.id)).toEqual({
        position: 4,
        total: 5,
      });
    });
  });

  describe("GIVEN a lesson at an edge of its module", () => {
    test("WHEN it is the first THEN the position is one", () => {
      const lessons = makeModuleLessons(makeModuleId(), 9);

      expect(lessonPositionInModule(lessons, lessons[0]!.id)).toEqual({ position: 1, total: 9 });
    });

    test("WHEN it is the last THEN the position equals the total", () => {
      const lessons = makeModuleLessons(makeModuleId(), 9);

      expect(lessonPositionInModule(lessons, lessons[8]!.id)).toEqual({ position: 9, total: 9 });
    });
  });

  describe("GIVEN a module holding a single lesson", () => {
    test("WHEN the position is read THEN it is one of one", () => {
      const lessons = makeModuleLessons(makeModuleId(), 1);

      expect(lessonPositionInModule(lessons, lessons[0]!.id)).toEqual({ position: 1, total: 1 });
    });
  });

  describe("GIVEN a lesson id the course does not hold", () => {
    test("WHEN the position is read THEN nothing is claimed", () => {
      // The caller renders no reading rather than an invented "0 of 27".
      const lessons = makeModuleLessons(makeModuleId(), 27);

      expect(lessonPositionInModule(lessons, LessonId.parse(faker.string.uuid()))).toBeUndefined();
    });
  });

  describe("GIVEN no lessons at all", () => {
    test("WHEN the position is read THEN nothing is claimed", () => {
      expect(lessonPositionInModule([], LessonId.parse(faker.string.uuid()))).toBeUndefined();
    });
  });
});
