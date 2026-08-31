import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { Slug } from "@/domain/entities/slug/slug";
import { makeFindContinueWatching } from "@/domain/use-cases/find-continue-watching/find-continue-watching";
import {
  makeStubCourseRepository,
  makeStubLessonRepository,
  makeStubModuleRepository,
} from "@/test-setup/stubs/domain-repos";

import { describe, expect, it } from "vitest";

const course = Course.parse({
  id: CourseId.parse("11111111-1111-4111-8111-111111111111"),
  slug: "course-1",
  title: "Course 1",
  description: "Desc",
  language: "en",
  lessonCount: 2,
  moduleCount: 1,
  sequence: 1,
});

const module_ = Module.parse({
  id: ModuleId.parse("22222222-2222-4222-8222-222222222222"),
  courseId: course.id,
  slug: "mod-1",
  title: "Module 1",
  sequence: 1,
});

const lesson = Lesson.parse({
  kind: "video",
  id: LessonId.parse("33333333-3333-4333-8333-333333333333"),
  courseId: course.id,
  moduleId: module_.id,
  sequence: 1,
  title: "Lesson 1",
  description: "Lesson 1",
  source: "/local-filesystem-lesson/lesson-1.mp4",
  durationSeconds: 600,
});

const location = {
  courseSlug: course.slug,
  moduleSlug: module_.slug,
  lessonId: lesson.id,
};

function makeDeps(overrides?: {
  courses?: ReturnType<typeof makeStubCourseRepository>;
  modules?: ReturnType<typeof makeStubModuleRepository>;
  lessons?: ReturnType<typeof makeStubLessonRepository>;
}) {
  return {
    courses:
      overrides?.courses ??
      makeStubCourseRepository({ courses: [course], bySlugMap: { [course.slug]: course } }),
    modules: overrides?.modules ?? makeStubModuleRepository({ modules: [module_] }),
    lessons: overrides?.lessons ?? makeStubLessonRepository({ lessons: [lesson] }),
  };
}

describe("findContinueWatching", () => {
  it("resolves a live location into its course, module and lesson", async () => {
    const useCase = makeFindContinueWatching(makeDeps());

    const result = await useCase(location);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.course.id).toBe(course.id);
      expect(result.value.module.id).toBe(module_.id);
      expect(result.value.lesson.id).toBe(lesson.id);
    }
  });

  it("resolves to course-not-found when the course slug no longer exists", async () => {
    const useCase = makeFindContinueWatching(
      makeDeps({ courses: makeStubCourseRepository({ courses: [], bySlugMap: {} }) }),
    );

    const result = await useCase(location);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.kind).toBe("course-not-found");
    }
  });

  it("resolves to module-not-in-course when the module slug no longer exists", async () => {
    const useCase = makeFindContinueWatching(
      makeDeps({ modules: makeStubModuleRepository({ modules: [] }) }),
    );

    const result = await useCase(location);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.kind).toBe("module-not-in-course");
    }
  });

  it("resolves to lesson-not-in-module when the lesson no longer exists", async () => {
    const useCase = makeFindContinueWatching(
      makeDeps({ lessons: makeStubLessonRepository({ lessons: [] }) }),
    );

    const result = await useCase(location);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.kind).toBe("lesson-not-in-module");
    }
  });

  it("resolves to lesson-not-in-module when the lesson belongs to another module", async () => {
    // A stale record can point at a lesson that still exists but has been
    // moved. Returning it would render a breadcrumb that lies.
    const otherModuleLesson = Lesson.parse({
      ...lesson,
      moduleId: ModuleId.parse("22222222-2222-4222-8222-222222222299"),
    });
    const useCase = makeFindContinueWatching(
      makeDeps({ lessons: makeStubLessonRepository({ lessons: [otherModuleLesson] }) }),
    );

    const result = await useCase(location);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.kind).toBe("lesson-not-in-module");
    }
  });

  it("does not enumerate the course's other lessons", async () => {
    // The panel shows three strings; loading 107 lessons to fill it is the
    // reason this use case exists instead of `findLessonForView`.
    const lessons = makeStubLessonRepository({ lessons: [lesson] });
    let listByCourseCalls = 0;
    const useCase = makeFindContinueWatching(
      makeDeps({
        lessons: {
          ...lessons,
          listByCourse: async (courseId) => {
            listByCourseCalls += 1;
            return lessons.listByCourse(courseId);
          },
        },
      }),
    );

    await useCase(location);

    expect(listByCourseCalls).toBe(0);
  });

  it("does not throw when an adapter rejects", async () => {
    const useCase = makeFindContinueWatching(
      makeDeps({
        courses: makeStubCourseRepository({
          bySlugMap: undefined,
          courses: [course],
          listAvailableRejects: undefined,
        }),
        modules: {
          ...makeStubModuleRepository({ modules: [module_] }),
          byCourseAndSlug: async () => {
            throw new Error("boom");
          },
        },
      }),
    );

    const result = await useCase({ ...location, courseSlug: Slug.parse(course.slug) });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.kind).toBe("internal-error");
    }
  });
});
