import { Course } from "@/domain/entities/course/course";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { Slug } from "@/domain/entities/slug/slug";
import { makeFindModuleForView } from "@/domain/use-cases/find-module-for-view/find-module-for-view";
import {
  makeStubCourseRepository,
  makeStubLessonRepository,
  makeStubModuleRepository,
} from "@/test-setup/stubs/domain-repos";

const course = Course.parse({
  id: "11111111-1111-4111-8111-111111111111",
  slug: "course-1",
  title: "Course 1",
  description: "Desc",
  language: "en",
  lessonCount: 3,
  moduleCount: 2,
  sequence: 1,
});

const mod1 = Module.parse({
  id: "22222222-2222-4222-8222-222222222222",
  courseId: course.id,
  slug: "mod-1",
  title: "Module 1",
  sequence: 1,
});
const mod2 = Module.parse({
  ...mod1,
  id: "33333333-3333-4333-8333-333333333333",
  slug: "mod-2",
  sequence: 2,
});

const lessonA = Lesson.parse({
  kind: "video",
  id: "44444444-4444-4444-8444-444444444444",
  courseId: course.id,
  moduleId: mod1.id,
  sequence: 1,
  title: "Lesson A",
  description: "A",
  source: "/local-filesystem-lesson/a.mp4",
  durationSeconds: 5,
});
const lessonB = Lesson.parse({
  ...lessonA,
  id: "55555555-5555-4555-8555-555555555555",
  moduleId: mod1.id,
  sequence: 2,
  title: "Lesson B",
});
const lessonC = Lesson.parse({
  ...lessonA,
  id: "66666666-6666-4666-8666-666666666666",
  moduleId: mod2.id,
  sequence: 1,
  title: "Lesson C",
});

describe("findModuleForView", () => {
  it("returns course-not-found when slug is unknown", async () => {
    const useCase = makeFindModuleForView({
      courses: makeStubCourseRepository({ bySlugMap: {} }),
      modules: makeStubModuleRepository(),
      lessons: makeStubLessonRepository(),
    });
    const result = await useCase({
      courseSlug: Slug.parse("missing"),
      moduleSlug: Slug.parse("mod-1"),
    });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error.kind).toBe("course-not-found");
  });

  it("returns module-not-in-course when the module belongs to another course", async () => {
    const useCase = makeFindModuleForView({
      courses: makeStubCourseRepository({ bySlugMap: { "course-1": course } }),
      modules: makeStubModuleRepository({
        modules: [],
        listByCourse: { [course.id]: [] },
      }),
      lessons: makeStubLessonRepository(),
    });
    const result = await useCase({
      courseSlug: Slug.parse("course-1"),
      moduleSlug: Slug.parse("mod-1"),
    });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error.kind).toBe("module-not-in-course");
  });

  it("returns only the lessons for the requested module, ordered by sequence", async () => {
    const useCase = makeFindModuleForView({
      courses: makeStubCourseRepository({ bySlugMap: { "course-1": course } }),
      modules: makeStubModuleRepository({
        modules: [mod1],
        listByCourse: { [course.id]: [mod1] },
      }),
      lessons: makeStubLessonRepository({
        listByCourse: { [course.id]: [lessonB, lessonC, lessonA] },
      }),
    });
    const result = await useCase({
      courseSlug: Slug.parse("course-1"),
      moduleSlug: Slug.parse("mod-1"),
    });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.module.id).toBe(mod1.id);
      expect(result.value.lessons.map((l) => l.id)).toEqual([lessonA.id, lessonB.id]);
    }
  });
});
