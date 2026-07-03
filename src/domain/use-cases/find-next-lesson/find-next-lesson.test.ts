import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { makeFindNextLesson } from "@/domain/use-cases/find-next-lesson/find-next-lesson";
import {
  makeStubCourseRepository,
  makeStubLessonRepository,
} from "@/test-setup/stubs/domain-repos";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

/**
 * Build a fresh course + 3 reading lessons per call so each test gets
 * independent faker-generated content. Returns the fixtures needed by the
 * `findNextLessonToRecommend` use case.
 */
function buildCourseFixture() {
  const courseId = faker.string.uuid();
  const course = Course.parse({
    id: courseId,
    slug: faker.lorem.slug(),
    title: faker.commerce.productName(),
    description: faker.lorem.paragraph(),
    language: "en",
    lessonCount: 3,
  });
  const lessons = [1, 2, 3].map((sequence) =>
    Lesson.parse({
      kind: "reading",
      id: faker.string.uuid(),
      courseId,
      sequence,
      title: faker.lorem.sentence(),
      body: faker.lorem.paragraph(),
    }),
  );
  return { course, lessons };
}

describe("findNextLessonToRecommend", () => {
  describe("GIVEN a course with three lessons and currentLesson = first", () => {
    test("WHEN the use case runs THEN it resolves with the second lesson", async () => {
      // Arrange
      const { course, lessons } = buildCourseFixture();
      const [lesson1, lesson2] = lessons;
      const findNext = makeFindNextLesson({
        courses: makeStubCourseRepository({ courses: [course] }),
        lessons: makeStubLessonRepository({ lessons }),
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
      const { course, lessons } = buildCourseFixture();
      const findNext = makeFindNextLesson({
        courses: makeStubCourseRepository({ courses: [course] }),
        lessons: makeStubLessonRepository({ lessons }),
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
      const { lessons } = buildCourseFixture();
      const missing = CourseId.parse(faker.string.uuid());
      const findNext = makeFindNextLesson({
        courses: makeStubCourseRepository({ courses: [] }),
        lessons: makeStubLessonRepository({ lessons }),
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
      const { course, lessons } = buildCourseFixture();
      const foreignLesson = LessonId.parse(faker.string.uuid());
      const findNext = makeFindNextLesson({
        courses: makeStubCourseRepository({ courses: [course] }),
        lessons: makeStubLessonRepository({ lessons }),
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
      const { course, lessons } = buildCourseFixture();
      const findNext = makeFindNextLesson({
        courses: makeStubCourseRepository({
          courses: [course],
          byIdRejects: true,
        }),
        lessons: makeStubLessonRepository({ lessons }),
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
      const { course, lessons } = buildCourseFixture();
      const findNext = makeFindNextLesson({
        courses: makeStubCourseRepository({ courses: [course] }),
        lessons: makeStubLessonRepository({
          lessons,
          listByCourseRejects: true,
        }),
      });
      const input = { courseId: course.id, currentLessonId: lessons[0]!.id };

      // Act
      const result = await findNext(input);

      // Assert
      expect(result.isErr()).toBe(true);
    });
  });
});
