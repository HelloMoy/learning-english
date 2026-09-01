import { Course } from "@/domain/entities/course/course";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { Slug } from "@/domain/entities/slug/slug";
import {
  LEADING_LESSONS_CAP,
  makeFindCourseForView,
} from "@/domain/use-cases/find-course-for-view/find-course-for-view";
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

/** `Lesson.parse` returns the union, so narrow before reading a video field. */
const durationOf = (lesson: Lesson): number =>
  lesson.kind === "video" ? lesson.durationSeconds : 0;

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

  describe("module summaries", () => {
    it("counts each module's lessons and sums their video durations", async () => {
      const inMod2 = Lesson.parse({
        ...lessonA,
        id: "66666666-6666-4666-8666-666666666666",
        moduleId: mod2.id,
        sequence: 1,
        title: "Lesson C",
        durationSeconds: 30,
      });
      const useCase = makeFindCourseForView({
        courses: makeStubCourseRepository({ bySlugMap: { "course-1": course } }),
        modules: makeStubModuleRepository({ listByCourse: { [course.id]: [mod2, mod1] } }),
        lessons: makeStubLessonRepository({
          listByCourse: { [course.id]: [inMod2, lessonB, lessonA] },
        }),
      });
      const result = await useCase({ courseSlug: Slug.parse("course-1") });
      expect(result.isOk()).toBe(true);
      if (!result.isOk()) return;
      expect(result.value.moduleSummaries).toEqual([
        expect.objectContaining({
          moduleId: mod1.id,
          lessonCount: 2,
          totalDurationSeconds: durationOf(lessonA) + durationOf(lessonB),
        }),
        expect.objectContaining({
          moduleId: mod2.id,
          lessonCount: 1,
          totalDurationSeconds: 30,
        }),
      ]);
    });

    it("summarizes a module holding no lessons instead of omitting it", async () => {
      const useCase = makeFindCourseForView({
        courses: makeStubCourseRepository({ bySlugMap: { "course-1": course } }),
        modules: makeStubModuleRepository({ listByCourse: { [course.id]: [mod1, mod2] } }),
        lessons: makeStubLessonRepository({ listByCourse: { [course.id]: [lessonA] } }),
      });
      const result = await useCase({ courseSlug: Slug.parse("course-1") });
      expect(result.isOk()).toBe(true);
      if (!result.isOk()) return;
      expect(result.value.moduleSummaries).toHaveLength(2);
      expect(result.value.moduleSummaries[1]).toEqual({
        moduleId: mod2.id,
        lessonCount: 0,
        totalDurationSeconds: 0,
        leadingLessons: [],
      });
    });

    it("excludes reading lessons from the duration but not from the count", async () => {
      const reading = Lesson.parse({
        kind: "reading",
        id: "77777777-7777-4777-8777-777777777777",
        courseId: course.id,
        moduleId: mod1.id,
        sequence: 3,
        title: "Reading lesson",
        body: "Body",
      });
      const useCase = makeFindCourseForView({
        courses: makeStubCourseRepository({ bySlugMap: { "course-1": course } }),
        modules: makeStubModuleRepository({ listByCourse: { [course.id]: [mod1] } }),
        lessons: makeStubLessonRepository({
          listByCourse: { [course.id]: [lessonA, lessonB, reading] },
        }),
      });
      const result = await useCase({ courseSlug: Slug.parse("course-1") });
      expect(result.isOk()).toBe(true);
      if (!result.isOk()) return;
      const [summary] = result.value.moduleSummaries;
      expect(summary?.lessonCount).toBe(3);
      expect(summary?.totalDurationSeconds).toBe(durationOf(lessonA) + durationOf(lessonB));
      expect(summary?.leadingLessons[2]).toEqual({
        id: reading.id,
        sequence: 3,
        title: "Reading lesson",
      });
      expect(summary?.leadingLessons[2]).not.toHaveProperty("poster");
    });

    it("caps leading lessons and keeps them in sequence order with their poster", async () => {
      const many = Array.from({ length: LEADING_LESSONS_CAP + 4 }, (_, index) =>
        Lesson.parse({
          ...lessonA,
          id: `88888888-8888-4888-8888-${String(index).padStart(12, "0")}`,
          moduleId: mod1.id,
          sequence: index + 1,
          title: `Lesson ${index + 1}`,
          poster: `/local-filesystem-lesson/poster-${index + 1}.jpeg`,
        }),
      );
      const useCase = makeFindCourseForView({
        courses: makeStubCourseRepository({ bySlugMap: { "course-1": course } }),
        modules: makeStubModuleRepository({ listByCourse: { [course.id]: [mod1] } }),
        lessons: makeStubLessonRepository({ listByCourse: { [course.id]: [...many].reverse() } }),
      });
      const result = await useCase({ courseSlug: Slug.parse("course-1") });
      expect(result.isOk()).toBe(true);
      if (!result.isOk()) return;
      const [summary] = result.value.moduleSummaries;
      expect(summary?.lessonCount).toBe(LEADING_LESSONS_CAP + 4);
      expect(summary?.leadingLessons).toHaveLength(LEADING_LESSONS_CAP);
      expect(summary?.leadingLessons.map((lesson) => lesson.sequence)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(summary?.leadingLessons[0]).toEqual({
        id: many[0]?.id,
        sequence: 1,
        title: "Lesson 1",
        poster: "/local-filesystem-lesson/poster-1.jpeg",
      });
    });

    it("derives every summary from a single lessons fetch", async () => {
      const lessons = makeStubLessonRepository({
        listByCourse: { [course.id]: [lessonA, lessonB] },
      });
      const listByCourse = vi.spyOn(lessons, "listByCourse");
      const useCase = makeFindCourseForView({
        courses: makeStubCourseRepository({ bySlugMap: { "course-1": course } }),
        modules: makeStubModuleRepository({ listByCourse: { [course.id]: [mod1, mod2] } }),
        lessons,
      });
      const result = await useCase({ courseSlug: Slug.parse("course-1") });
      expect(result.isOk()).toBe(true);
      expect(listByCourse).toHaveBeenCalledTimes(1);
      if (result.isOk()) expect(result.value.firstLesson?.id).toBe(lessonA.id);
    });
  });
});
