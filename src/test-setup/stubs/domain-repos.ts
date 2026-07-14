import type { Course } from "@/domain/entities/course/course";
import type { CourseId, LessonId, ModuleId, ResourceId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import type { Resource } from "@/domain/entities/resource/resource";
import type { Slug } from "@/domain/entities/slug/slug";
import type { CourseRepository } from "@/domain/ports/course-repository/course-repository";
import type { LessonRepository } from "@/domain/ports/lesson-repository/lesson-repository";
import type { ModuleRepository } from "@/domain/ports/module-repository/module-repository";
import type { ProgressTracker } from "@/domain/ports/progress-tracker/progress-tracker";
import type { ResourceRepository } from "@/domain/ports/resource-repository/resource-repository";

/**
 * Test double: an in-memory `CourseRepository` whose behavior is fully
 * controlled by the caller. Used only in unit tests; production uses
 * `InMemoryCourseRepository` in `src/adapters/persistence/in-memory/**`.
 */
export function makeStubCourseRepository(seed?: {
  courses?: Course[];
  byIdRejects?: boolean;
}): CourseRepository {
  const courses = seed?.courses ?? [];
  return {
    byId: async (id: CourseId) => {
      if (seed?.byIdRejects) throw new Error("simulated course-repo failure");
      return courses.find((c) => c.id === id) ?? null;
    },
    bySlug: async (slug: Slug) => courses.find((c) => c.slug === slug) ?? null,
    listAvailable: async () => courses,
  };
}

/**
 * Test double: an in-memory `LessonRepository` whose behavior is fully
 * controlled by the caller. Used only in unit tests; production uses
 * `InMemoryLessonRepository` in `src/adapters/persistence/in-memory/**`.
 */
export function makeStubLessonRepository(seed?: {
  lessons?: Lesson[];
  listByCourseRejects?: boolean;
}): LessonRepository {
  const lessons = seed?.lessons ?? [];
  return {
    byId: async (id: LessonId) => lessons.find((l) => l.id === id) ?? null,
    listByCourse: async (courseId: CourseId) => {
      if (seed?.listByCourseRejects) {
        throw new Error("simulated lesson-repo failure");
      }
      return lessons
        .filter((l) => l.courseId === courseId)
        .slice()
        .sort((a, b) => a.sequence - b.sequence);
    },
  };
}

/**
 * Test double: an in-memory `ModuleRepository`. Returns modules in
 * ascending `sequence` order from `listByCourse`. Used only in unit tests.
 */
export function makeStubModuleRepository(seed?: {
  modules?: Module[];
  listByCourseRejects?: boolean;
}): ModuleRepository {
  const modules = seed?.modules ?? [];
  return {
    byId: async (id: ModuleId) => modules.find((m) => m.id === id) ?? null,
    byCourseAndSlug: async (courseId: CourseId, slug: Slug) =>
      modules.find((m) => m.courseId === courseId && m.slug === slug) ?? null,
    listByCourse: async (courseId: CourseId) => {
      if (seed?.listByCourseRejects) {
        throw new Error("simulated module-repo failure");
      }
      return modules
        .filter((m) => m.courseId === courseId)
        .slice()
        .sort((a, b) => a.sequence - b.sequence);
    },
  };
}

/**
 * Test double: an in-memory `ResourceRepository`. Used only in unit tests;
 * production uses the in-memory adapter in `src/adapters/persistence/`.
 */
export function makeStubResourceRepository(seed?: { resources?: Resource[] }): ResourceRepository {
  const resources = seed?.resources ?? [];
  return {
    byId: async (id: ResourceId) => resources.find((r) => r.id === id) ?? null,
    listByLesson: async (lessonId: LessonId) => resources.filter((r) => r.lessonId === lessonId),
    listByModule: async () => resources,
    listByCourse: async () => resources,
  };
}

/**
 * Test double: an in-memory `ProgressTracker`. Stores completed lesson ids
 * in a `Set`. Used only in unit tests.
 */
export function makeStubProgressTracker(): ProgressTracker {
  const completed = new Set<LessonId>();
  return {
    markComplete: async (lessonId: LessonId) => {
      completed.add(lessonId);
    },
    isComplete: async (lessonId: LessonId) => completed.has(lessonId),
  };
}
