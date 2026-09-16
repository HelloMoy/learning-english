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

describe("findModuleForView — the next module", () => {
  const mod3 = Module.parse({
    ...mod1,
    id: "77777777-7777-4777-8777-777777777777",
    slug: "mod-3",
    sequence: 3,
  });
  const lessonD = Lesson.parse({
    ...lessonA,
    id: "88888888-8888-4888-8888-888888888888",
    moduleId: mod3.id,
    sequence: 1,
    title: "Lesson D",
  });

  const findModule = (
    moduleSlug: string,
    { modules, lessons }: { modules: Module[]; lessons: Lesson[] },
  ) => {
    const lessonRepository = makeStubLessonRepository({ listByCourse: { [course.id]: lessons } });
    const listByCourse = vi.spyOn(lessonRepository, "listByCourse");
    const findModuleForView = makeFindModuleForView({
      courses: makeStubCourseRepository({ bySlugMap: { "course-1": course } }),
      modules: makeStubModuleRepository({ modules, listByCourse: { [course.id]: modules } }),
      lessons: lessonRepository,
    });
    const result = findModuleForView({
      courseSlug: Slug.parse("course-1"),
      moduleSlug: Slug.parse(moduleSlug),
    });
    return { result, listByCourse };
  };

  it("names the next module in sequence with its lessons", async () => {
    const { result } = findModule("mod-1", {
      modules: [mod1, mod2],
      lessons: [lessonA, lessonB, lessonC],
    });

    const value = (await result)._unsafeUnwrap();
    expect(value.nextModule?.module.id).toBe(mod2.id);
    expect(value.nextModule?.lessons.map((lesson) => lesson.id)).toEqual([lessonC.id]);
  });

  it("skips a later module that holds no lessons", async () => {
    const { result } = findModule("mod-1", {
      modules: [mod1, mod2, mod3],
      lessons: [lessonA, lessonB, lessonD],
    });

    expect((await result)._unsafeUnwrap().nextModule?.module.id).toBe(mod3.id);
  });

  it("names no next module for the last module holding lessons", async () => {
    const { result } = findModule("mod-2", {
      modules: [mod1, mod2],
      lessons: [lessonA, lessonB, lessonC],
    });

    expect((await result)._unsafeUnwrap()).not.toHaveProperty("nextModule");
  });

  it("still lists the course's lessons once", async () => {
    const { result, listByCourse } = findModule("mod-1", {
      modules: [mod1, mod2],
      lessons: [lessonA, lessonB, lessonC],
    });

    await result;
    expect(listByCourse).toHaveBeenCalledTimes(1);
  });
});
