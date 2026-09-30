import type { ContinueWatchingRecord } from "@/domain/entities/continue-watching-record/continue-watching-record";
import {
  findFirstLevel,
  type CourseStanding,
} from "@/domain/entities/course-standing/course-standing";
import type { Course } from "@/domain/entities/course/course";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import {
  courseOverviewEntries,
  courseOverviewProgress,
  type ContinueTarget,
  type CourseOverviewProgress,
  type ProgressTally,
} from "@/lib/course-overview-progress/course-overview-progress";
import { prizeForModule, type PrizeId } from "@/lib/module-prizes/module-prizes";

/**
 * What {@link courseShelf} reads: the catalog's course views and the
 * learner's enrollments, places, completion marks and playback positions.
 *
 * @category Course shelf
 */
export type CourseShelfInput = {
  courses: ReadonlyArray<CourseForView>;
  enrolledSlugs: ReadonlySet<string>;
  /** One record per course, the most recently watched first. */
  records: ReadonlyArray<ContinueWatchingRecord>;
  completedIds: ReadonlySet<string>;
  positions: ReadonlyMap<string, number>;
};

/**
 * An enrolled course with its progress read from the learner's own place in
 * it.
 *
 * @category Course shelf
 */
export type ShelfCourse = {
  view: CourseForView;
  progress: CourseOverviewProgress;
  /** Where the learner was in this course, or `null` when they never opened it. */
  record: ContinueWatchingRecord | null;
  /** Every video of the course counts as complete. */
  isCompleted: boolean;
};

/**
 * The catalog sorted for one learner.
 *
 * @category Course shelf
 */
export type CourseShelf = {
  /** The enrolled course watched most recently, or the first enrolled one; `null` with no enrollment. */
  featured: ShelfCourse | null;
  /** Every other enrolled course, in catalog order. */
  otherEnrolled: ShelfCourse[];
  /** With no enrollment, the first level course, read as if joined; otherwise `null`. */
  recommended: ShelfCourse | null;
  /** Every course the learner has not enrolled in, in catalog order, less the recommended one. */
  available: CourseForView[];
};

/**
 * Sorts the catalog into the course to lead with, the learner's other courses
 * and the courses still available to them. A learner enrolled in nothing is
 * led by the first level course, as a recommendation — never a reference course.
 *
 * @remarks
 * Each enrolled course's progress comes from {@link courseOverviewProgress}
 * with that course's own record as the last opened video — the same reading
 * the course overview makes — so every screen names the same next video.
 * Records of courses the learner is not enrolled in are ignored.
 *
 * @param input - The catalog and the learner's state
 * @returns The featured course, the other enrolled courses and the available ones
 *
 * @category Course shelf
 */
export function courseShelf(input: CourseShelfInput): CourseShelf {
  const inCatalogOrder = [...input.courses].sort((a, b) => a.course.sequence - b.course.sequence);
  const enrolled = inCatalogOrder
    .filter((view) => input.enrolledSlugs.has(view.course.slug))
    .map((view) => shelfCourseOf(view, input));
  const featured = mostRecentlyWatched(enrolled, input.records) ?? enrolled[0] ?? null;
  const notEnrolled = inCatalogOrder.filter((view) => !input.enrolledSlugs.has(view.course.slug));
  const firstLevel = featured === null ? findFirstLevel(notEnrolled) : undefined;

  return {
    featured,
    otherEnrolled: enrolled.filter((course) => course !== featured),
    recommended: firstLevel ? shelfCourseOf(firstLevel, input) : null,
    available: notEnrolled.filter((view) => view !== firstLevel),
  };
}

function shelfCourseOf(view: CourseForView, input: CourseShelfInput): ShelfCourse {
  const record =
    input.records.find(({ location }) => location.courseSlug === view.course.slug) ?? null;
  const progress = courseOverviewProgress({
    course: view.course,
    entries: courseOverviewEntries(view.modules, view.moduleSummaries),
    location: record?.location ?? null,
    completedIds: input.completedIds,
    positions: input.positions,
  });
  const { completedCount, lessonCount } = progress.course;
  return { view, progress, record, isCompleted: lessonCount > 0 && completedCount === lessonCount };
}

function mostRecentlyWatched(
  enrolled: ReadonlyArray<ShelfCourse>,
  records: ReadonlyArray<ContinueWatchingRecord>,
): ShelfCourse | undefined {
  for (const { location } of records) {
    const course = enrolled.find(({ view }) => view.course.slug === location.courseSlug);
    if (course) return course;
  }
  return undefined;
}

/**
 * How big a course is: its modules, its videos and their total runtime.
 *
 * @category Course shelf
 */
export type CourseFacts = { moduleCount: number; videoCount: number; runtimeSeconds: number };

/**
 * Counts a course's modules, videos and total runtime from its view.
 *
 * @param view - The course as the course overview sees it
 * @returns The course's size
 *
 * @category Course shelf
 */
export function courseFacts({ modules, moduleSummaries }: CourseForView): CourseFacts {
  return {
    moduleCount: modules.length,
    videoCount: moduleSummaries.reduce((total, summary) => total + summary.lessons.length, 0),
    runtimeSeconds: moduleSummaries.reduce(
      (total, summary) => total + summary.totalDurationSeconds,
      0,
    ),
  };
}

/** A continue target that names a video. */
export type TargetVideo = Exclude<ContinueTarget, { kind: "none" }>;

/** One of a course's prizes, and whether the learner has claimed it. */
export type CardPrize = { prize: PrizeId; isClaimed: boolean };

/**
 * Everything a course card draws about an enrolled course, already read.
 *
 * @category Course shelf
 */
export type CourseCardModel = {
  course: Course;
  /** A numbered level, or reference material. */
  standing: CourseStanding;
  facts: CourseFacts;
  tally: ProgressTally;
  /** The video to open next, or `null` for a course with no videos. */
  target: TargetVideo | null;
  /** How many videos the target's module holds, for "Video n of m". */
  targetVideoCount: number;
  /** The saved position in the target video, or `null` when none is saved. */
  targetPositionSeconds: number | null;
  /** When the learner was last in this course (epoch ms), or `null` if never. */
  watchedAt: number | null;
  /** The prizes of the course's modules that hold videos, in module order. */
  prizes: CardPrize[];
  isCompleted: boolean;
};

/**
 * Reads what a course card shows about one enrolled course.
 *
 * @param shelfCourse - The course as {@link courseShelf} sorted it
 * @param learner - The learner's playback positions and claimed prizes
 * @returns The card's model
 *
 * @category Course shelf
 */
export function courseCardModel(
  { view, progress, record, isCompleted }: ShelfCourse,
  learner: { positions: ReadonlyMap<string, number>; claimedPrizes: ReadonlySet<string> },
): CourseCardModel {
  const target = progress.continueTarget.kind === "none" ? null : progress.continueTarget;
  return {
    course: view.course,
    standing: view.standing,
    facts: courseFacts(view),
    tally: progress.course,
    target,
    targetVideoCount: target ? videoCountOf(view, target) : 0,
    targetPositionSeconds: target ? (learner.positions.get(target.lesson.id) ?? null) : null,
    watchedAt: record?.watchedAt ?? null,
    prizes: prizesOf(view, learner.claimedPrizes),
    isCompleted,
  };
}

function videoCountOf({ moduleSummaries }: CourseForView, target: TargetVideo): number {
  return (
    moduleSummaries.find((summary) => summary.moduleId === target.module.id)?.lessons.length ?? 0
  );
}

// A module with no videos has nothing to redeem, so it is no prize — the rule
// the course overview and the prize counter count by.
function prizesOf(view: CourseForView, claimedPrizes: ReadonlySet<string>): CardPrize[] {
  return courseOverviewEntries(view.modules, view.moduleSummaries)
    .filter((entry) => entry.summary.lessons.length > 0)
    .map(({ module }) => ({
      prize: prizeForModule(module.slug),
      isClaimed: claimedPrizes.has(module.slug),
    }));
}
