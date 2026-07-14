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
 * Build a `CoursePlatformDeps` backed by the production in-memory seed.
 * The page calls this; Storybook can call it too. When persistence arrives,
 * this factory is replaced by a request-scoped one (e.g. a hook named
 * `useCoursePlatformDeps`); the seed itself stays.
 */
export function getCoursePlatformDeps(): CoursePlatformDeps {
  const courses = new InMemoryCourseRepository([seedCourse]);
  const modules = new InMemoryModuleRepository(seedModules);
  const lessons = new InMemoryLessonRepository(seedLessons);
  const resources = new InMemoryResourceRepository(seedResources);
  const progress = new InMemoryProgressTracker();

  const findNextLesson = makeFindNextLesson({ courses, lessons, modules });
  const findLessonForView = makeFindLessonForView({
    courses,
    modules,
    lessons,
    resources,
    findNextLesson,
  });
  const markLessonComplete = makeMarkLessonComplete({ lessons, progress });

  return {
    courses,
    lessons,
    modules,
    resources,
    progress,
    useCases: {
      findNextLesson,
      findLessonForView,
      markLessonComplete,
    },
  };
}
