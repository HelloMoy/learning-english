import { InMemoryCourseRepository } from "@/adapters/persistence/in-memory/in-memory-course-repository/in-memory-course-repository";
import { InMemoryLessonRepository } from "@/adapters/persistence/in-memory/in-memory-lesson-repository/in-memory-lesson-repository";
import { InMemoryModuleRepository } from "@/adapters/persistence/in-memory/in-memory-module-repository/in-memory-module-repository";
import { InMemoryProgressTracker } from "@/adapters/persistence/in-memory/in-memory-progress-tracker/in-memory-progress-tracker";
import { InMemoryResourceRepository } from "@/adapters/persistence/in-memory/in-memory-resource-repository/in-memory-resource-repository";
import {
  seedCourse,
  seedLessons,
  seedModules,
  seedResources,
} from "@/adapters/persistence/in-memory/seed/seed";
import {
  seedContentCourse,
  seedContentLessons,
  seedContentModules,
  seedContentResources,
} from "@/adapters/persistence/in-memory/seed/seed-content";
import type { Course } from "@/domain/entities/course/course";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import type { Resource } from "@/domain/entities/resource/resource";
import type { CourseRepository } from "@/domain/ports/course-repository/course-repository";
import type { LessonRepository } from "@/domain/ports/lesson-repository/lesson-repository";
import type { ModuleRepository } from "@/domain/ports/module-repository/module-repository";
import type { ProgressTracker } from "@/domain/ports/progress-tracker/progress-tracker";
import type { ResourceRepository } from "@/domain/ports/resource-repository/resource-repository";
import { makeFindLessonForView } from "@/domain/use-cases/find-lesson-for-view/find-lesson-for-view";
import { makeFindNextLesson } from "@/domain/use-cases/find-next-lesson/find-next-lesson";
import { makeMarkLessonComplete } from "@/domain/use-cases/mark-lesson-complete/mark-lesson-complete";

/**
 * The shape every driving adapter (Next.js page, Storybook) uses to consume
 * the domain. Bundles the in-memory ports and the use case factories so the
 * caller never imports adapters or use cases directly.
 */
export type CoursePlatformDeps = {
  courses: CourseRepository;
  lessons: LessonRepository;
  modules: ModuleRepository;
  resources: ResourceRepository;
  progress: ProgressTracker;
  useCases: {
    findNextLesson: ReturnType<typeof makeFindNextLesson>;
    findLessonForView: ReturnType<typeof makeFindLessonForView>;
    markLessonComplete: ReturnType<typeof makeMarkLessonComplete>;
  };
};

/**
 * Reads the `USE_COURSE_CONTENT_SEED` environment variable at module load
 * time. When set to `"1"`, `getCoursePlatformDeps` builds the dependency
 * graph from `seed-content.ts` (the generator's output for the
 * filesystem-backed course). Otherwise the A1 hardcoded seed is used.
 *
 * Default is the A1 seed — existing tests, Storybook, and local dev boot
 * continue to work without any env-var change. Set the variable to opt
 * into the new content once the seed generator has run.
 */
export const isCourseContentSeedEnabled = (): boolean =>
  process.env.USE_COURSE_CONTENT_SEED === "1";

/**
 * Build a `CoursePlatformDeps` backed by the production in-memory seed.
 * The page calls this; Storybook can call it too. When persistence arrives,
 * this factory is replaced by a request-scoped one (e.g. a hook named
 * `useCoursePlatformDeps`); the seed itself stays.
 *
 * Seed source is chosen at call time from `USE_COURSE_CONTENT_SEED` so the
 * env var can be flipped in dev without restarting the Node process.
 */
export function getCoursePlatformDeps(): CoursePlatformDeps {
  if (isCourseContentSeedEnabled()) {
    return buildDeps(
      [seedContentCourse],
      seedContentModules,
      seedContentLessons,
      seedContentResources,
    );
  }
  return buildDeps([seedCourse], seedModules, seedLessons, seedResources);
}

function buildDeps(
  courses: ReadonlyArray<Course>,
  modules: ReadonlyArray<Module>,
  lessons: ReadonlyArray<Lesson>,
  resources: ReadonlyArray<Resource>,
): CoursePlatformDeps {
  const coursesRepo = new InMemoryCourseRepository(courses);
  const modulesRepo = new InMemoryModuleRepository(modules);
  const lessonsRepo = new InMemoryLessonRepository(lessons);
  const resourcesRepo = new InMemoryResourceRepository(resources);
  const progress = new InMemoryProgressTracker();

  const findNextLesson = makeFindNextLesson({
    courses: coursesRepo,
    lessons: lessonsRepo,
    modules: modulesRepo,
  });
  const findLessonForView = makeFindLessonForView({
    courses: coursesRepo,
    modules: modulesRepo,
    lessons: lessonsRepo,
    resources: resourcesRepo,
    findNextLesson,
  });
  const markLessonComplete = makeMarkLessonComplete({
    lessons: lessonsRepo,
    progress,
  });

  return {
    courses: coursesRepo,
    lessons: lessonsRepo,
    modules: modulesRepo,
    resources: resourcesRepo,
    progress,
    useCases: {
      findNextLesson,
      findLessonForView,
      markLessonComplete,
    },
  };
}
