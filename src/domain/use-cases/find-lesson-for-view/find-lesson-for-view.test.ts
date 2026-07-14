import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { Resource } from "@/domain/entities/resource/resource";
import { Slug } from "@/domain/entities/slug/slug";
import { makeFindLessonForView } from "@/domain/use-cases/find-lesson-for-view/find-lesson-for-view";
import {
  makeStubCourseRepository,
  makeStubLessonRepository,
  makeStubModuleRepository,
  makeStubResourceRepository,
} from "@/test-setup/stubs/domain-repos";

import { faker } from "@faker-js/faker";
import { describe, expect, test, vi } from "vitest";

function buildFixture() {
  const courseId = faker.string.uuid() as ReturnType<typeof CourseId.parse>;
  const courseSlug = Slug.parse(faker.lorem.slug());
  const moduleId = faker.string.uuid() as ReturnType<typeof CourseId.parse>;
  const moduleSlug = Slug.parse(faker.lorem.slug());
  const lessonId = faker.string.uuid() as ReturnType<typeof LessonId.parse>;
  const course = Course.parse({
    id: courseId,
    slug: courseSlug,
    title: faker.commerce.productName(),
    description: faker.lorem.paragraph(),
    language: "en",
    lessonCount: 1,
    moduleCount: 1,
  });
  const courseModule = Module.parse({
    id: moduleId,
    courseId,
    slug: moduleSlug,
    title: faker.commerce.productName(),
    sequence: 1,
  });
  const lesson = Lesson.parse({
    kind: "reading",
    id: lessonId,
    courseId,
    moduleId,
    sequence: 1,
    title: faker.lorem.sentence(),
    body: faker.lorem.paragraph(),
  });
  const resource = Resource.parse({
    id: faker.string.uuid(),
    lessonId,
    title: faker.commerce.productName(),
    url: faker.internet.url(),
    kind: "pdf",
  });
  return { course, courseSlug, courseModule, moduleSlug, lesson, resources: [resource] };
}

describe("findLessonForView", () => {
  describe("GIVEN a course, module, and lesson that all exist", () => {
    test("WHEN the use case runs THEN it resolves with the composed view", async () => {
      // Arrange
      const fx = buildFixture();
      const findNextLesson = vi.fn().mockResolvedValue({ isOk: () => true, value: null });
      const useCase = makeFindLessonForView({
        courses: makeStubCourseRepository({ courses: [fx.course] }),
        modules: makeStubModuleRepository({ modules: [fx.courseModule] }),
        lessons: makeStubLessonRepository({ lessons: [fx.lesson] }),
        resources: makeStubResourceRepository({ resources: fx.resources }),
        findNextLesson: findNextLesson as never,
      });

      // Act
      const result = await useCase({
        courseSlug: fx.courseSlug,
        moduleSlug: fx.moduleSlug,
        lessonId: fx.lesson.id,
      });

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.course).toEqual(fx.course);
        expect(result.value.module).toEqual(fx.courseModule);
        expect(result.value.lesson).toEqual(fx.lesson);
        expect(result.value.resources).toEqual(fx.resources);
        expect(result.value.nextLesson).toBeNull();
        // Outline arrays — the page renders these into the sidebar.
        expect(result.value.modules).toEqual([fx.courseModule]);
        expect(result.value.lessons).toEqual([fx.lesson]);
      }
    });
  });

  describe("GIVEN an unknown courseSlug", () => {
    test("WHEN the use case runs THEN it resolves with course-not-found", async () => {
      // Arrange
      const fx = buildFixture();
      const findNextLesson = vi.fn();
      const useCase = makeFindLessonForView({
        courses: makeStubCourseRepository({ courses: [] }),
        modules: makeStubModuleRepository({ modules: [fx.courseModule] }),
        lessons: makeStubLessonRepository({ lessons: [fx.lesson] }),
        resources: makeStubResourceRepository({ resources: [] }),
        findNextLesson: findNextLesson as never,
      });

      // Act
      const result = await useCase({
        courseSlug: Slug.parse("no-such-course"),
        moduleSlug: fx.moduleSlug,
        lessonId: fx.lesson.id,
      });

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toEqual({ kind: "course-not-found" });
      }
    });
  });

  describe("GIVEN a moduleSlug that does not match any module in the course", () => {
    test("WHEN the use case runs THEN it resolves with module-not-in-course", async () => {
      // Arrange
      const fx = buildFixture();
      const useCase = makeFindLessonForView({
        courses: makeStubCourseRepository({ courses: [fx.course] }),
        modules: makeStubModuleRepository({ modules: [] }),
        lessons: makeStubLessonRepository({ lessons: [fx.lesson] }),
        resources: makeStubResourceRepository({ resources: [] }),
        findNextLesson: vi.fn() as never,
      });

      // Act
      const result = await useCase({
        courseSlug: fx.courseSlug,
        moduleSlug: Slug.parse("no-such-module"),
        lessonId: fx.lesson.id,
      });

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toEqual({ kind: "module-not-in-course" });
      }
    });
  });

  describe("GIVEN a lessonId that does not match any lesson in the module", () => {
    test("WHEN the use case runs THEN it resolves with lesson-not-in-module", async () => {
      // Arrange
      const fx = buildFixture();
      const foreignLesson = LessonId.parse(faker.string.uuid());
      const useCase = makeFindLessonForView({
        courses: makeStubCourseRepository({ courses: [fx.course] }),
        modules: makeStubModuleRepository({ modules: [fx.courseModule] }),
        lessons: makeStubLessonRepository({ lessons: [] }),
        resources: makeStubResourceRepository({ resources: [] }),
        findNextLesson: vi.fn() as never,
      });

      // Act
      const result = await useCase({
        courseSlug: fx.courseSlug,
        moduleSlug: fx.moduleSlug,
        lessonId: foreignLesson,
      });

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toEqual({ kind: "lesson-not-in-module" });
      }
    });
  });
});
