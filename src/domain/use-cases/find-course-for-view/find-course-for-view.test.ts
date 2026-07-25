import { Course } from "@/domain/entities/course/course";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { Slug } from "@/domain/entities/slug/slug";
import { makeFindCourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
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
  lessonCount: 2,
  moduleCount: 2,
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

describe("findCourseForView", () => {
  it("returns course-not-found when slug has no match", async () => {
    const useCase = makeFindCourseForView({
      courses: makeStubCourseRepository({ bySlugMap: {} }),
      modules: makeStubModuleRepository(),
      lessons: makeStubLessonRepository(),
    });
    const result = await useCase({ courseSlug: Slug.parse("missing-course") });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error.kind).toBe("course-not-found");
  });

  it("returns ordered modules and deterministic first lesson", async () => {
    const useCase = makeFindCourseForView({
      courses: makeStubCourseRepository({ bySlugMap: { "course-1": course } }),
      modules: makeStubModuleRepository({
        listByCourse: { [course.id]: [mod2, mod1] },
      }),
      lessons: makeStubLessonRepository({
        listByCourse: { [course.id]: [lessonB, lessonA] },
      }),
    });
    const result = await useCase({ courseSlug: Slug.parse("course-1") });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.modules.map((m) => m.id)).toEqual([mod1.id, mod2.id]);
      expect(result.value.firstLesson?.id).toBe(lessonA.id);
    }
  });

  it("returns null first lesson when course has no modules", async () => {
    const useCase = makeFindCourseForView({
      courses: makeStubCourseRepository({ bySlugMap: { "course-1": course } }),
      modules: makeStubModuleRepository({ listByCourse: { [course.id]: [] } }),
      lessons: makeStubLessonRepository({ listByCourse: { [course.id]: [] } }),
    });
    const result = await useCase({ courseSlug: Slug.parse("course-1") });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) expect(result.value.firstLesson).toBeNull();
  });
});
