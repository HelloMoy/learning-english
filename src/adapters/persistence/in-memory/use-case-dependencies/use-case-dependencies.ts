import type { BlobStore } from "@/adapters/persistence/blob-store/blob-store";
import { contentBlobStoreFromEnv } from "@/adapters/persistence/blob-store/create-content-blob-store/create-content-blob-store";
import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";
import { InMemoryCourseRepository } from "@/adapters/persistence/in-memory/in-memory-course-repository/in-memory-course-repository";
import { InMemoryModuleRepository } from "@/adapters/persistence/in-memory/in-memory-module-repository/in-memory-module-repository";
import { InMemoryPlaybackPositionRepository } from "@/adapters/persistence/in-memory/in-memory-playback-position-repository/in-memory-playback-position-repository";
import { InMemoryProgressTracker } from "@/adapters/persistence/in-memory/in-memory-progress-tracker/in-memory-progress-tracker";
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
import { makeFindContinueWatching } from "@/domain/use-cases/find-continue-watching/find-continue-watching";
import { makeFindCourseCatalog } from "@/domain/use-cases/find-course-catalog/find-course-catalog";
import { makeFindCourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { makeFindLessonForView } from "@/domain/use-cases/find-lesson-for-view/find-lesson-for-view";
import { makeFindLessonNotes } from "@/domain/use-cases/find-lesson-notes/find-lesson-notes";
import { makeFindModuleForView } from "@/domain/use-cases/find-module-for-view/find-module-for-view";
import { makeFindNextLesson } from "@/domain/use-cases/find-next-lesson/find-next-lesson";
import { makeGetPlaybackPosition } from "@/domain/use-cases/get-playback-position/get-playback-position";
import { makeMarkLessonComplete } from "@/domain/use-cases/mark-lesson-complete/mark-lesson-complete";
import { makeRecordPlaybackPosition } from "@/domain/use-cases/record-playback-position/record-playback-position";
import { makeUnmarkLessonComplete } from "@/domain/use-cases/unmark-lesson-complete/unmark-lesson-complete";

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
    unmarkLessonComplete: ReturnType<typeof makeUnmarkLessonComplete>;
    findCourseCatalog: ReturnType<typeof makeFindCourseCatalog>;
    findContinueWatching: ReturnType<typeof makeFindContinueWatching>;
    findCourseForView: ReturnType<typeof makeFindCourseForView>;
    findModuleForView: ReturnType<typeof makeFindModuleForView>;
    findLessonNotes: ReturnType<typeof makeFindLessonNotes>;
    recordPlaybackPosition: ReturnType<typeof makeRecordPlaybackPosition>;
    getPlaybackPosition: ReturnType<typeof makeGetPlaybackPosition>;
  };
};

/**
 * Builds a `CoursePlatformDeps` from the generated content seed.
 *
 * @remarks
 * The page calls this; Storybook can call it too. When persistence arrives,
 * this factory is replaced by a request-scoped one (e.g. a hook named
 * `useCoursePlatformDeps`); the seed itself stays.
 *
 * The courses `courses.manifest.json` declares are the courses the catalog
 * holds — there is no configuration that selects between seed sources, and no
 * hand-written course to fall back to. A machine without the content root
 * therefore boots the real catalog with unresolvable media, which names the
 * actual problem rather than hiding it behind placeholder courses.
 *
 * The `positions` adapter is a fresh ephemeral in-memory store — adequate
 * for SSR, Storybook and tests, and the only implementation this factory
 * builds. Browser persistence deliberately lives outside it: client
 * components reach `BrowserLocalStoragePlaybackPositionRepository` through
 * the `usePlaybackPosition` hook, because this factory is server-only.
 */
export function getCoursePlatformDeps(): CoursePlatformDeps {
  return assembleCatalog();
}

/**
 * Builds the `BlobStore` from the location manifest.
 *
 * Delegates to {@link contentBlobStoreFromEnv} so the signing endpoint at
 * `/api/content` resolves keys through exactly the same configuration this
 * graph does.
 */
function buildBlobStore(): BlobStore {
  return contentBlobStoreFromEnv();
}

/**
 * Assembles the catalog from the tracked course manifests.
 *
 * @remarks
 * Courses and modules are plain arrays the in-memory adapters filter by
 * `courseId`. Lessons and resources go through the local-filesystem adapters,
 * bound directly: one source needs no composite fanning a read out over a
 * single delegate.
 *
 * One `BlobStore` instance is shared by the lesson, resource and notes
 * adapters so the three can never disagree about where content lives.
 */
function assembleCatalog(): CoursePlatformDeps {
  const blobStore = buildBlobStore();
  const { courses, modules, lessonRows, resourceRows, notesKeys } = contentCatalog;

  return assemble({
    coursesRepo: new InMemoryCourseRepository([...courses]),
    modulesRepo: new InMemoryModuleRepository([...modules]),
    lessonsRepo: new LocalFilesystemLessonRepository({ rows: lessonRows, blobStore }),
    resourcesRepo: new LocalFilesystemResourceRepository({ rows: resourceRows, blobStore }),
    notesRepo: new LocalFilesystemLessonNotesRepository({
      notesKeys,
      resourceRows,
      blobStore,
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
  const unmarkLessonComplete = makeUnmarkLessonComplete({
    lessons: lessonsRepo,
    progress,
  });
  const findCourseCatalog = makeFindCourseCatalog({
    courses: coursesRepo,
    modules: modulesRepo,
    lessons: lessonsRepo,
  });
  const findContinueWatching = makeFindContinueWatching({
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
      unmarkLessonComplete,
      findCourseCatalog,
      findContinueWatching,
      findCourseForView,
      findModuleForView,
      findLessonNotes,
      recordPlaybackPosition,
      getPlaybackPosition,
    },
  };
}
