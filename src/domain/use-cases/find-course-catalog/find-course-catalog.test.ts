import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { makeFindCourseCatalog } from "@/domain/use-cases/find-course-catalog/find-course-catalog";
import {
  makeStubCourseRepository,
  makeStubLessonRepository,
  makeStubModuleRepository,
} from "@/test-setup/stubs/domain-repos";

const course = Course.parse({
  id: CourseId.parse("11111111-1111-4111-8111-111111111111"),
  slug: "course-1",
  title: "Course 1",
  description: "Desc",
  language: "en",
  lessonCount: 2,
  moduleCount: 1,
});

const module_ = Module.parse({
  id: ModuleId.parse("22222222-2222-4222-8222-222222222222"),
  courseId: course.id,
  slug: "mod-1",
  title: "Module 1",
  sequence: 1,
});

const lesson1 = Lesson.parse({
  kind: "video",
  id: LessonId.parse("33333333-3333-4333-8333-333333333333"),
  courseId: course.id,
  moduleId: module_.id,
  sequence: 1,
  title: "Lesson 1",
  description: "Lesson 1",
  source: "/local-filesystem-lesson/lesson-1.mp4",
  durationSeconds: 10,
});
const lesson2 = Lesson.parse({
  kind: "video",
  id: LessonId.parse("44444444-4444-4444-8444-444444444444"),
  courseId: course.id,
  moduleId: module_.id,
  sequence: 2,
  title: "Lesson 2",
  description: "Lesson 2",
  source: "/local-filesystem-lesson/lesson-2.mp4",
  durationSeconds: 10,
});

describe("findCourseCatalog", () => {
  it("returns an empty catalog when no courses are available", async () => {
    const useCase = makeFindCourseCatalog({
      courses: makeStubCourseRepository({ available: [] }),
      modules: makeStubModuleRepository(),
      lessons: makeStubLessonRepository(),
    });
    const result = await useCase();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.entries).toEqual([]);
    }
  });

  it("returns each course with its deterministic first lesson", async () => {
    const useCase = makeFindCourseCatalog({
      courses: makeStubCourseRepository({ available: [course] }),
      modules: makeStubModuleRepository({
        listByCourse: { [course.id]: [module_] },
      }),
      lessons: makeStubLessonRepository({
        lessons: [lesson1, lesson2],
        listByCourse: { [course.id]: [lesson1, lesson2] },
      }),
    });
    const result = await useCase();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.entries).toHaveLength(1);
      expect(result.value.entries[0]?.firstLesson?.id).toBe(lesson1.id);
    }
  });

  it("returns null first lesson when the course has no modules", async () => {
    const useCase = makeFindCourseCatalog({
      courses: makeStubCourseRepository({ available: [course] }),
      modules: makeStubModuleRepository({ listByCourse: { [course.id]: [] } }),
      lessons: makeStubLessonRepository({ listByCourse: { [course.id]: [] } }),
    });
    const result = await useCase();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.entries[0]?.firstLesson).toBeNull();
    }
  });

  it("wraps adapter rejections as internal-error", async () => {
    const useCase = makeFindCourseCatalog({
      courses: makeStubCourseRepository({ listAvailableRejects: new Error("boom") }),
      modules: makeStubModuleRepository(),
      lessons: makeStubLessonRepository(),
    });
    const result = await useCase();
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.kind).toBe("internal-error");
    }
  });
});
