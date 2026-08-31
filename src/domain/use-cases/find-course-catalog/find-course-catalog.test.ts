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
  sequence: 1,
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

  it("previews the course's leading modules in sequence order", async () => {
    const laterModule = Module.parse({
      id: ModuleId.parse("22222222-2222-4222-8222-222222222223"),
      courseId: course.id,
      slug: "mod-2",
      title: "Module 2",
      sequence: 2,
    });
    const useCase = makeFindCourseCatalog({
      courses: makeStubCourseRepository({ available: [course] }),
      modules: makeStubModuleRepository({
        listByCourse: { [course.id]: [laterModule, module_] },
      }),
      lessons: makeStubLessonRepository({
        lessons: [lesson1, lesson2],
        listByCourse: { [course.id]: [lesson1, lesson2] },
      }),
    });

    const result = await useCase();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.entries[0]?.leadingModules.map((m) => m.id)).toEqual([
        module_.id,
        laterModule.id,
      ]);
    }
  });

  it("caps the module preview so a ten-module course does not list them all", async () => {
    const modules = Array.from({ length: 10 }, (_, index) =>
      Module.parse({
        id: ModuleId.parse(`22222222-2222-4222-8222-22222222220${index}`),
        courseId: course.id,
        slug: `mod-${index + 1}`,
        title: `Module ${index + 1}`,
        sequence: index + 1,
      }),
    );
    const useCase = makeFindCourseCatalog({
      courses: makeStubCourseRepository({ available: [course] }),
      modules: makeStubModuleRepository({ listByCourse: { [course.id]: modules } }),
      lessons: makeStubLessonRepository({ listByCourse: { [course.id]: [] } }),
    });

    const result = await useCase();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const leading = result.value.entries[0]?.leadingModules ?? [];
      expect(leading.length).toBeLessThan(modules.length);
      expect(leading.map((m) => m.sequence)).toEqual([1, 2, 3]);
    }
  });

  it("returns an empty module preview when the course has no modules", async () => {
    const useCase = makeFindCourseCatalog({
      courses: makeStubCourseRepository({ available: [course] }),
      modules: makeStubModuleRepository({ listByCourse: { [course.id]: [] } }),
      lessons: makeStubLessonRepository({ listByCourse: { [course.id]: [] } }),
    });

    const result = await useCase();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.entries).toHaveLength(1);
      expect(result.value.entries[0]?.leadingModules).toEqual([]);
    }
  });

  it("derives the preview from the modules it already loads, without a second call", async () => {
    let listByCourseCalls = 0;
    const modules = makeStubModuleRepository({ listByCourse: { [course.id]: [module_] } });
    const countingModules = {
      ...modules,
      listByCourse: async (courseId: CourseId) => {
        listByCourseCalls += 1;
        return modules.listByCourse(courseId);
      },
    };
    const useCase = makeFindCourseCatalog({
      courses: makeStubCourseRepository({ available: [course] }),
      modules: countingModules,
      lessons: makeStubLessonRepository({
        lessons: [lesson1],
        listByCourse: { [course.id]: [lesson1] },
      }),
    });

    await useCase();

    expect(listByCourseCalls).toBe(1);
  });

  it("preserves the order the course repository returns", async () => {
    // Ordering is the repository's guarantee (`listAvailable` sorts by
    // `Course.sequence`); the use case must not shuffle it back.
    const secondCourse = Course.parse({
      id: CourseId.parse("11111111-1111-4111-8111-111111111112"),
      slug: "course-2",
      title: "Course 2",
      description: "Desc",
      language: "en",
      lessonCount: 0,
      moduleCount: 0,
      sequence: 2,
    });
    const useCase = makeFindCourseCatalog({
      courses: makeStubCourseRepository({ available: [course, secondCourse] }),
      modules: makeStubModuleRepository({
        listByCourse: { [course.id]: [module_], [secondCourse.id]: [] },
      }),
      lessons: makeStubLessonRepository({
        listByCourse: { [course.id]: [lesson1], [secondCourse.id]: [] },
      }),
    });

    const result = await useCase();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.entries.map((entry) => entry.course.id)).toEqual([
        course.id,
        secondCourse.id,
      ]);
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
