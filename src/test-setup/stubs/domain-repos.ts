import type { Course } from "@/domain/entities/course/course";
import type { CourseId, LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Slug } from "@/domain/entities/slug/slug";
import type { CourseRepository } from "@/domain/ports/course-repository/course-repository";
import type { LessonRepository } from "@/domain/ports/lesson-repository/lesson-repository";

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
