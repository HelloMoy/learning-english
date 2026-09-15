import type { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import type { Course } from "@/domain/entities/course/course";
import type { LessonId } from "@/domain/entities/ids/ids";
import type { Module } from "@/domain/entities/module/module";
import type {
  ModuleLesson,
  ModuleSummary,
} from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { findContinueTarget } from "@/lib/continue-target/continue-target";
import { moduleProgress, type ModuleProgress } from "@/lib/module-progress/module-progress";

/** One lesson (module) of the course with the summary of its videos, in `sequence` order. */
export type CourseOverviewEntry = { module: Module; summary: ModuleSummary };

/** The course and the learner's progress on this device. */
export type CourseOverviewProgressInput = {
  course: Pick<Course, "slug">;
  entries: ReadonlyArray<CourseOverviewEntry>;
  /** The single stored continue-watching location, or `null` when none is stored. */
  location: ContinueWatchingLocation | null;
  completedIds: ReadonlySet<string>;
  positions: ReadonlyMap<string, number>;
};

/** How much of a set of videos is watched, and how long the rest runs. */
export type ProgressTally = {
  completedCount: number;
  lessonCount: number;
  /** The completed share, in the unit range; `0` when there are no videos. */
  completedFraction: number;
  /** Runtime minus saved position, summed over every video not yet complete. */
  secondsLeft: number;
};

/** Where the learner stands in one lesson (module). */
export type ModuleStatus = "completed" | "in-progress" | "not-started";

/** One lesson's tile state. */
export type ModuleOverviewProgress = CourseOverviewEntry &
  ProgressTally & {
    status: ModuleStatus;
    /** Whether this lesson holds the video the learner continues with. */
    isCurrent: boolean;
  };

/**
 * The video the course overview's continue action opens, and why.
 *
 * - `start` — nothing is watched; the course's first video.
 * - `continue` — the course is partly watched.
 * - `rewatch` — everything is watched; the course's first video again.
 * - `none` — the course holds no videos.
 */
export type ContinueTarget =
  | {
      kind: "start" | "continue" | "rewatch";
      module: Module;
      lesson: ModuleLesson;
      lessonNumber: number;
    }
  | { kind: "none" };

/** Everything the course overview's tiles show about progress. */
export type CourseOverviewProgress = {
  course: ProgressTally;
  modules: ModuleOverviewProgress[];
  continueTarget: ContinueTarget;
};

/** One video of the course, laid out in learning order with where it sits. */
type CourseVideo = { module: Module; lesson: ModuleLesson; lessonNumber: number };

/**
 * Decides the course overview's progress: the course tally, each lesson's tile
 * state, and the video the learner continues with.
 *
 * @remarks
 * Every figure comes from `moduleProgress`, which applies `countsAsComplete`,
 * so the tiles can never disagree with each other or with the module overview.
 *
 * The video to continue is picked by {@link findContinueTarget}, the single
 * rule every continue surface shares (the `continue-target` capability), over
 * the whole course laid out lesson after lesson. The continue-watching record
 * anchors it only when it names a video of this course in the lesson it
 * records; a record for another course, or a stale one, is ignored and the
 * furthest progress anchors instead. A finished recorded video is never offered
 * again: the rule moves on to the next unfinished video, crossing into the next
 * lesson when needed.
 *
 * @see findContinueTarget
 *
 * @example
 * ```ts
 * const { course, modules, continueTarget } = courseOverviewProgress({
 *   course, entries, location, completedIds, positions,
 * });
 * ```
 *
 * @param input - The course, its lessons in order, and this device's progress
 * @returns The course tally, one tile state per lesson, and the continue target
 */
export function courseOverviewProgress(input: CourseOverviewProgressInput): CourseOverviewProgress {
  const progresses = input.entries.map(({ summary }) =>
    moduleProgress({
      lessons: summary.lessons,
      completedIds: input.completedIds,
      positions: input.positions,
    }),
  );
  const tallies = input.entries.map((entry, index) => tallyOf(entry, progresses[index]!));
  const continueTarget = continueTargetOf(input);
  const currentModuleId = continueTarget.kind === "continue" ? continueTarget.module.id : null;

  return {
    course: sumTallies(tallies),
    modules: input.entries.map((entry, index) => ({
      ...entry,
      ...tallies[index]!,
      status: statusOf(progresses[index]!),
      isCurrent: entry.module.id === currentModuleId,
    })),
    continueTarget,
  };
}

function tallyOf({ summary }: CourseOverviewEntry, progress: ModuleProgress): ProgressTally {
  const lessonCount = summary.lessons.length;
  const completedCount = completedCountOf(progress);
  return {
    completedCount,
    lessonCount,
    completedFraction: lessonCount > 0 ? completedCount / lessonCount : 0,
    secondsLeft: secondsLeftOf(summary, progress),
  };
}

function completedCountOf(progress: ModuleProgress): number {
  if (progress.kind === "completed") return progress.lessonCount;
  if (progress.kind === "in-progress") return progress.completedCount;
  return 0;
}

function secondsLeftOf(summary: ModuleSummary, progress: ModuleProgress): number {
  if (progress.kind === "in-progress") return progress.secondsLeftInModule;
  if (progress.kind === "not-started") return totalSeconds(summary.lessons);
  return 0;
}

function totalSeconds(lessons: ReadonlyArray<ModuleLesson>): number {
  return lessons.reduce((total, lesson) => total + lesson.durationSeconds, 0);
}

function sumTallies(tallies: ReadonlyArray<ProgressTally>): ProgressTally {
  const completedCount = tallies.reduce((total, tally) => total + tally.completedCount, 0);
  const lessonCount = tallies.reduce((total, tally) => total + tally.lessonCount, 0);
  return {
    completedCount,
    lessonCount,
    completedFraction: lessonCount > 0 ? completedCount / lessonCount : 0,
    secondsLeft: tallies.reduce((total, tally) => total + tally.secondsLeft, 0),
  };
}

function statusOf(progress: ModuleProgress): ModuleStatus {
  if (progress.kind === "completed") return "completed";
  if (progress.kind === "in-progress") return "in-progress";
  return "not-started";
}

function continueTargetOf(input: CourseOverviewProgressInput): ContinueTarget {
  const videos = courseVideos(input.entries);
  const lastOpenedLessonId = recordedLessonId(input);
  const target = findContinueTarget(
    videos.map(({ lesson }) => lesson),
    {
      completedLessonIds: input.completedIds,
      positions: input.positions,
      ...(lastOpenedLessonId ? { lastOpenedLessonId } : {}),
    },
  );
  if (target.kind === "none") return target;
  return { kind: target.kind, ...videos[target.index]! };
}

function courseVideos(entries: ReadonlyArray<CourseOverviewEntry>): CourseVideo[] {
  return entries.flatMap(({ module, summary }) =>
    summary.lessons.map((lesson, index) => ({ module, lesson, lessonNumber: index + 1 })),
  );
}

/** The recorded video's id, only when the record names this course and the lesson it records. */
function recordedLessonId({
  course,
  entries,
  location,
}: CourseOverviewProgressInput): LessonId | undefined {
  if (location?.courseSlug !== course.slug) return undefined;
  const entry = entries.find(({ module }) => module.slug === location.moduleSlug);
  return entry?.summary.lessons.some(({ id }) => id === location.lessonId)
    ? location.lessonId
    : undefined;
}
