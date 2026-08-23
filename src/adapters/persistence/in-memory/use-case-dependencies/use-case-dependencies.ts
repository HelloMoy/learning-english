import path from "node:path";

import { LocalFilesystemBlobStore } from "@/adapters/persistence/blob-store/local-filesystem-blob-store/local-filesystem-blob-store";
import { InMemoryCourseRepository } from "@/adapters/persistence/in-memory/in-memory-course-repository/in-memory-course-repository";
import { InMemoryLessonRepository } from "@/adapters/persistence/in-memory/in-memory-lesson-repository/in-memory-lesson-repository";
import { InMemoryModuleRepository } from "@/adapters/persistence/in-memory/in-memory-module-repository/in-memory-module-repository";
import { InMemoryPlaybackPositionRepository } from "@/adapters/persistence/in-memory/in-memory-playback-position-repository/in-memory-playback-position-repository";
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
  seedContentNotesKeys,
  seedContentResources,
} from "@/adapters/persistence/in-memory/seed/seed-content";
import { LocalFilesystemLessonNotesRepository } from "@/adapters/persistence/local-filesystem/local-filesystem-lesson-notes-repository/local-filesystem-lesson-notes-repository";
import type { Course } from "@/domain/entities/course/course";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import type { Resource } from "@/domain/entities/resource/resource";
import type { CourseRepository } from "@/domain/ports/course-repository/course-repository";
import type { LessonNotesRepository } from "@/domain/ports/lesson-notes-repository/lesson-notes-repository";
import type { LessonRepository } from "@/domain/ports/lesson-repository/lesson-repository";
import type { ModuleRepository } from "@/domain/ports/module-repository/module-repository";
import type { PlaybackPositionRepository } from "@/domain/ports/playback-position-repository/playback-position-repository";
import type { ProgressTracker } from "@/domain/ports/progress-tracker/progress-tracker";
import type { ResourceRepository } from "@/domain/ports/resource-repository/resource-repository";
import { makeFindCourseCatalog } from "@/domain/use-cases/find-course-catalog/find-course-catalog";
import { makeFindCourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { makeFindLessonForView } from "@/domain/use-cases/find-lesson-for-view/find-lesson-for-view";
import { makeFindLessonNotes } from "@/domain/use-cases/find-lesson-notes/find-lesson-notes";
import { makeFindModuleForView } from "@/domain/use-cases/find-module-for-view/find-module-for-view";
import { makeFindNextLesson } from "@/domain/use-cases/find-next-lesson/find-next-lesson";
import { makeGetPlaybackPosition } from "@/domain/use-cases/get-playback-position/get-playback-position";
import { makeMarkLessonComplete } from "@/domain/use-cases/mark-lesson-complete/mark-lesson-complete";
import { makeRecordPlaybackPosition } from "@/domain/use-cases/record-playback-position/record-playback-position";

/**
 * The shape every driving adapter (Next.js page, Storybook) uses to consume
 * the domain. Bundles the in-memory ports and the use case factories so the
 * caller never imports adapters or use cases directly.
 *
 * `positions` is the playback-position port, backed here by the in-memory
 * adapter for SSR and tests. A client component gets the localStorage-backed
 * implementation from `usePlaybackPosition` instead — same contract, only
 * the storage differs.
 */
export type CoursePlatformDeps = {
  courses: CourseRepository;
  lessons: LessonRepository;
  modules: ModuleRepository;
  resources: ResourceRepository;
  notes: LessonNotesRepository;
  progress: ProgressTracker;
  positions: PlaybackPositionRepository;
  useCases: {
    findNextLesson: ReturnType<typeof makeFindNextLesson>;
    findLessonForView: ReturnType<typeof makeFindLessonForView>;
    markLessonComplete: ReturnType<typeof makeMarkLessonComplete>;
    findCourseCatalog: ReturnType<typeof makeFindCourseCatalog>;
    findCourseForView: ReturnType<typeof makeFindCourseForView>;
    findModuleForView: ReturnType<typeof makeFindModuleForView>;
    findLessonNotes: ReturnType<typeof makeFindLessonNotes>;
    recordPlaybackPosition: ReturnType<typeof makeRecordPlaybackPosition>;
    getPlaybackPosition: ReturnType<typeof makeGetPlaybackPosition>;
  };
};

/**
 * Reads the `USE_COURSE_CONTENT_SEED` environment variable on each call
 * (not at module load). When set to `"1"`, `getCoursePlatformDeps` builds
 * the dependency graph from `seed-content.ts` (the generator's output
 * for the filesystem-backed course). Otherwise the A1 hardcoded seed is
 * used.
 *
 * Reading on every call lets developers flip the env var in dev without
 * restarting the Node process. The default is the A1 seed so existing
 * tests, Storybook and local dev boot continue to work without any
 * env-var change.
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
 *
 * The `positions` adapter is a fresh ephemeral in-memory store — adequate
 * for SSR, Storybook and tests, and the only implementation this factory
 * builds. Browser persistence deliberately lives outside it: client
 * components reach `BrowserLocalStoragePlaybackPositionRepository` through
 * the `usePlaybackPosition` hook, because this factory is server-only.
 */
export function getCoursePlatformDeps(): CoursePlatformDeps {
  if (isCourseContentSeedEnabled()) {
    return buildDeps(
      [seedContentCourse],
      seedContentModules,
      seedContentLessons,
      seedContentResources,
      seedContentNotesKeys,
    );
  }
  return buildDeps([seedCourse], seedModules, seedLessons, seedResources);
}

function buildDeps(
  courses: ReadonlyArray<Course>,
  modules: ReadonlyArray<Module>,
  lessons: ReadonlyArray<Lesson>,
  resources: ReadonlyArray<Resource>,
  notesKeys: Readonly<Record<string, string>> = {},
): CoursePlatformDeps {
  const coursesRepo = new InMemoryCourseRepository(courses);
  const modulesRepo = new InMemoryModuleRepository(modules);
  const lessonsRepo = new InMemoryLessonRepository(lessons);
  const resourcesRepo = new InMemoryResourceRepository(resources);
  const progress = new InMemoryProgressTracker();
  const positions = new InMemoryPlaybackPositionRepository();
  const blobStore = new LocalFilesystemBlobStore({
    baseUrl: "/local-filesystem-lesson",
    localRoot: path.resolve("public/local-filesystem-lesson"),
  });
  const notesRepo = new LocalFilesystemLessonNotesRepository({
    notesKeys,
    resources,
    blobStore,
  });

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
  const findCourseCatalog = makeFindCourseCatalog({
    courses: coursesRepo,
    modules: modulesRepo,
    lessons: lessonsRepo,
  });
  const findCourseForView = makeFindCourseForView({
    courses: coursesRepo,
    modules: modulesRepo,
    lessons: lessonsRepo,
  });
  const findModuleForView = makeFindModuleForView({
    courses: coursesRepo,
    modules: modulesRepo,
    lessons: lessonsRepo,
  });
  const findLessonNotes = makeFindLessonNotes({ notes: notesRepo });
  const recordPlaybackPosition = makeRecordPlaybackPosition({
    lessons: lessonsRepo,
    positions,
  });
  const getPlaybackPosition = makeGetPlaybackPosition({ positions });

  return {
    courses: coursesRepo,
    lessons: lessonsRepo,
    modules: modulesRepo,
    resources: resourcesRepo,
    notes: notesRepo,
    progress,
    positions,
    useCases: {
      findNextLesson,
      findLessonForView,
      markLessonComplete,
      findCourseCatalog,
      findCourseForView,
      findModuleForView,
      findLessonNotes,
      recordPlaybackPosition,
      getPlaybackPosition,
    },
  };
}
