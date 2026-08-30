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
  seedContentLessonRows,
  seedContentModules,
  seedContentNotesKeys,
  seedContentResourceRows,
} from "@/adapters/persistence/in-memory/seed/seed-content";
import { LocalFilesystemLessonNotesRepository } from "@/adapters/persistence/local-filesystem/local-filesystem-lesson-notes-repository/local-filesystem-lesson-notes-repository";
import { LocalFilesystemLessonRepository } from "@/adapters/persistence/local-filesystem/local-filesystem-lesson-repository/local-filesystem-lesson-repository";
import { LocalFilesystemResourceRepository } from "@/adapters/persistence/local-filesystem/local-filesystem-resource-repository/local-filesystem-resource-repository";
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
    return buildContentSeedDeps();
  }
  return buildA1SeedDeps();
}

/**
 * Default public URL prefix for course content. Chosen to preserve the
 * pre-configuration behaviour exactly: before `CONTENT_BASE_URL` existed
 * this literal was hardcoded here and in the seed generator.
 */
const DEFAULT_CONTENT_BASE_URL = "/local-filesystem-lesson";

/** Default filesystem root the local driver reads bytes from. */
const DEFAULT_CONTENT_LOCAL_ROOT = "public/local-filesystem-lesson";

/**
 * Builds the `BlobStore` from configuration.
 *
 * Read per call rather than at module load, mirroring
 * `isCourseContentSeedEnabled()` — a developer can repoint content in dev
 * without restarting the Node process. `CONTENT_BASE_URL` is deliberately
 * NOT `NEXT_PUBLIC_`: resolution happens in Server Components and the
 * resolved URLs reach the client as plain props. A client that needs a
 * fresh (or signed) URL should ask the server rather than rebuild one.
 */
function buildBlobStore(): LocalFilesystemBlobStore {
  return new LocalFilesystemBlobStore({
    baseUrl: process.env.CONTENT_BASE_URL ?? DEFAULT_CONTENT_BASE_URL,
    localRoot: path.resolve(process.env.CONTENT_LOCAL_ROOT ?? DEFAULT_CONTENT_LOCAL_ROOT),
  });
}

/**
 * The generated content seed. Lessons and resources are ROWS holding content
 * keys, so they get the local-filesystem adapters, which resolve those keys
 * through the shared `BlobStore` on every read.
 *
 * One `BlobStore` instance is shared by the lesson, resource and notes
 * adapters so the three can never disagree about where content lives.
 */
function buildContentSeedDeps(): CoursePlatformDeps {
  const blobStore = buildBlobStore();
  return assemble({
    coursesRepo: new InMemoryCourseRepository([seedContentCourse]),
    modulesRepo: new InMemoryModuleRepository(seedContentModules),
    lessonsRepo: new LocalFilesystemLessonRepository({
      rows: seedContentLessonRows,
      blobStore,
    }),
    resourcesRepo: new LocalFilesystemResourceRepository({
      rows: seedContentResourceRows,
      blobStore,
    }),
    notesRepo: new LocalFilesystemLessonNotesRepository({
      notesKeys: seedContentNotesKeys,
      resourceRows: seedContentResourceRows,
      blobStore,
    }),
  });
}

/**
 * The A1 hardcoded seed. It carries no content keys — its URLs are literals
 * written by hand — so it keeps the pass-through in-memory adapters. Giving
 * it key-aware adapters would mean a branch that is always false on every
 * read.
 */
function buildA1SeedDeps(): CoursePlatformDeps {
  return assemble({
    coursesRepo: new InMemoryCourseRepository([seedCourse]),
    modulesRepo: new InMemoryModuleRepository(seedModules),
    lessonsRepo: new InMemoryLessonRepository(seedLessons),
    resourcesRepo: new InMemoryResourceRepository(seedResources),
    // The A1 seed has no Markdown notes. With an empty key map `byLesson`
    // returns null before it ever consults the rows, so passing none is
    // equivalent to passing all of them — and honest about the absence.
    notesRepo: new LocalFilesystemLessonNotesRepository({
      notesKeys: {},
      resourceRows: [],
      blobStore: buildBlobStore(),
    }),
  });
}

function assemble({
  coursesRepo,
  modulesRepo,
  lessonsRepo,
  resourcesRepo,
  notesRepo,
}: {
  coursesRepo: CourseRepository;
  modulesRepo: ModuleRepository;
  lessonsRepo: LessonRepository;
  resourcesRepo: ResourceRepository;
  notesRepo: LessonNotesRepository;
}): CoursePlatformDeps {
  const progress = new InMemoryProgressTracker();
  const positions = new InMemoryPlaybackPositionRepository();

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
