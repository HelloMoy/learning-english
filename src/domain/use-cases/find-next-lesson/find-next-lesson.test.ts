import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { makeFindNextLesson } from "@/domain/use-cases/find-next-lesson/find-next-lesson";
import {
  makeStubCourseRepository,
  makeStubLessonRepository,
  makeStubModuleRepository,
} from "@/test-setup/stubs/domain-repos";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

/**
 * Build a fresh course + 3 reading lessons in ONE module per call so each
 * test gets independent faker-generated content. Returns the fixtures needed
 * by the `findNextLessonToRecommend` use case.
 */
function buildCourseFixture() {
  const courseId = faker.string.uuid();
  const moduleId = faker.string.uuid();
  const course = Course.parse({
    id: courseId,
    slug: faker.lorem.slug(),
    title: faker.commerce.productName(),
    description: faker.lorem.paragraph(),
    language: "en",
    lessonCount: 3,
    moduleCount: 1,
  });
  const courseModule = Module.parse({
    id: moduleId,
    courseId,
    slug: faker.lorem.slug(),
    title: faker.commerce.productName(),
    sequence: 1,
  });
  const lessons = [1, 2, 3].map((sequence) =>
    Lesson.parse({
      kind: "reading",
      id: faker.string.uuid(),
      courseId,
      moduleId,
      sequence,
      title: faker.lorem.sentence(),
      body: faker.lorem.paragraph(),
    }),
  );
  return { course, modules: [courseModule], lessons };
}

/**
 * Build a course with TWO modules: module 1 has 2 lessons, module 2 has 1
 * lesson. The use case must return the first lesson of module 2 when the
 * current is the last lesson of module 1, and `null` when the current is the
 * only lesson of module 2.
 */
function buildTwoModuleCourseFixture() {
  const courseId = faker.string.uuid();
  const module1Id = faker.string.uuid();
  const module2Id = faker.string.uuid();
  const course = Course.parse({
    id: courseId,
    slug: faker.lorem.slug(),
    title: faker.commerce.productName(),
    description: faker.lorem.paragraph(),
    language: "en",
    lessonCount: 3,
    moduleCount: 2,
  });
  const courseModule1 = Module.parse({
    id: module1Id,
    courseId,
    slug: "module-one",
    title: "Module One",
    sequence: 1,
  });
  const courseModule2 = Module.parse({
    id: module2Id,
    courseId,
    slug: "module-two",
    title: "Module Two",
    sequence: 2,
  });
  const lesson11 = Lesson.parse({
    kind: "reading",
    id: faker.string.uuid(),
    courseId,
    moduleId: module1Id,
    sequence: 1,
    title: "M1-L1",
    body: "Body",
  });
  const lesson12 = Lesson.parse({
    kind: "reading",
    id: faker.string.uuid(),
    courseId,
    moduleId: module1Id,
    sequence: 2,
    title: "M1-L2",
    body: "Body",
  });
  const lesson21 = Lesson.parse({
    kind: "reading",
    id: faker.string.uuid(),
    courseId,
    moduleId: module2Id,
    sequence: 1,
    title: "M2-L1",
    body: "Body",
  });
  return {
    course,
    modules: [courseModule1, courseModule2],
    lessons: [lesson11, lesson12, lesson21],
  };
}

describe("findNextLessonToRecommend", () => {
  describe("GIVEN a course with three lessons and currentLesson = first", () => {
    test("WHEN the use case runs THEN it resolves with the second lesson", async () => {
      // Arrange
      const { course, modules, lessons } = buildCourseFixture();
      const [lesson1, lesson2] = lessons;
      const findNext = makeFindNextLesson({
        courses: makeStubCourseRepository({ courses: [course] }),
        lessons: makeStubLessonRepository({ lessons }),
        modules: makeStubModuleRepository({ modules }),
      });
      const input = { courseId: course.id, currentLessonId: lesson1!.id };

      // Act
      const result = await findNext(input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(lesson2);
      }
    });
  });

  describe("GIVEN currentLesson is the last lesson in the course", () => {
    test("WHEN the use case runs THEN it resolves with `null`", async () => {
      // Arrange
      const { course, modules, lessons } = buildCourseFixture();
      const findNext = makeFindNextLesson({
        courses: makeStubCourseRepository({ courses: [course] }),
        lessons: makeStubLessonRepository({ lessons }),
        modules: makeStubModuleRepository({ modules }),
      });
      const input = { courseId: course.id, currentLessonId: lessons[2]!.id };

      // Act
      const result = await findNext(input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe("GIVEN a courseId that does not exist", () => {
    test("WHEN the use case runs THEN it resolves with course-not-found", async () => {
      // Arrange
      const { modules, lessons } = buildCourseFixture();
      const missing = CourseId.parse(faker.string.uuid());
      const findNext = makeFindNextLesson({
        courses: makeStubCourseRepository({ courses: [] }),
        lessons: makeStubLessonRepository({ lessons }),
        modules: makeStubModuleRepository({ modules }),
      });
      const input = { courseId: missing, currentLessonId: lessons[0]!.id };

      // Act
      const result = await findNext(input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toEqual({ kind: "course-not-found" });
      }
    });
  });

  describe("GIVEN a currentLessonId that is not in the course", () => {
    test("WHEN the use case runs THEN it resolves with lesson-not-in-course", async () => {
      // Arrange
      const { course, modules, lessons } = buildCourseFixture();
      const foreignLesson = LessonId.parse(faker.string.uuid());
      const findNext = makeFindNextLesson({
        courses: makeStubCourseRepository({ courses: [course] }),
        lessons: makeStubLessonRepository({ lessons }),
        modules: makeStubModuleRepository({ modules }),
      });
      const input = { courseId: course.id, currentLessonId: foreignLesson };

      // Act
      const result = await findNext(input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toEqual({ kind: "lesson-not-in-course" });
      }
    });
  });

  describe("GIVEN a course repository that throws during byId", () => {
    test("WHEN the use case runs THEN it does NOT throw — it returns Err", async () => {
      // Arrange
      const { course, modules, lessons } = buildCourseFixture();
      const findNext = makeFindNextLesson({
        courses: makeStubCourseRepository({
          courses: [course],
          byIdRejects: true,
        }),
        lessons: makeStubLessonRepository({ lessons }),
        modules: makeStubModuleRepository({ modules }),
      });
      const input = { courseId: course.id, currentLessonId: lessons[0]!.id };

      // Act — `findNext` itself must not throw; if the rejection escaped,
      // the await would re-throw and the test would fail with that error.
      const result = await findNext(input);

      // Assert
      expect(result.isErr()).toBe(true);
    });
  });

  describe("GIVEN a lesson repository that throws during listByCourse", () => {
    test("WHEN the use case runs THEN it does NOT throw — it returns Err", async () => {
      // Arrange
      const { course, modules, lessons } = buildCourseFixture();
      const findNext = makeFindNextLesson({
        courses: makeStubCourseRepository({ courses: [course] }),
        lessons: makeStubLessonRepository({
          lessons,
          listByCourseRejects: true,
        }),
        modules: makeStubModuleRepository({ modules }),
      });
      const input = { courseId: course.id, currentLessonId: lessons[0]!.id };

      // Act
      const result = await findNext(input);

      // Assert
      expect(result.isErr()).toBe(true);
    });
  });

  describe("GIVEN two modules, current is the last lesson of module 1", () => {
    test("WHEN the use case runs THEN it resolves with the first lesson of module 2", async () => {
      // Arrange
      const { course, modules, lessons } = buildTwoModuleCourseFixture();
      // lessons are [m1l1, m1l2, m2l1] — m1l2 is the last of module 1.
      const lastOfModule1 = lessons[1]!;
      const firstOfModule2 = lessons[2]!;
      const findNext = makeFindNextLesson({
        courses: makeStubCourseRepository({ courses: [course] }),
        lessons: makeStubLessonRepository({ lessons }),
        modules: makeStubModuleRepository({ modules }),
      });
      const input = { courseId: course.id, currentLessonId: lastOfModule1.id };

      // Act
      const result = await findNext(input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(firstOfModule2);
      }
    });
  });

  describe("GIVEN two modules, current is the only lesson of the last module", () => {
    test("WHEN the use case runs THEN it resolves with `null` (course completed)", async () => {
      // Arrange
      const { course, modules, lessons } = buildTwoModuleCourseFixture();
      const lastLesson = lessons[2]!;
      const findNext = makeFindNextLesson({
        courses: makeStubCourseRepository({ courses: [course] }),
        lessons: makeStubLessonRepository({ lessons }),
        modules: makeStubModuleRepository({ modules }),
      });
      const input = { courseId: course.id, currentLessonId: lastLesson.id };

      // Act
      const result = await findNext(input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });
  });
});
