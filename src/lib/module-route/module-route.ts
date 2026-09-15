import type { LessonId } from "@/domain/entities/ids/ids";
import { countsAsComplete, watchedFraction } from "@/lib/watch-progress/watch-progress";

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const FULLY_WATCHED = 1;
const NOT_FOUND = -1;

/** A runtime broken into the whole hours and minutes a label reads out. */
export type RuntimeParts = {
  hours: number;
  minutes: number;
};

/**
 * The part of a lesson the route needs. A reading lesson passes a
 * `durationSeconds` of 0.
 */
export type RouteLesson = {
  id: LessonId;
  sequence: number;
  durationSeconds: number;
};

/** What the browser holds about the learner: marked lessons, playback positions, and where they were last. */
export type LearnerProgress = {
  completedLessonIds: ReadonlySet<string>;
  positions: ReadonlyMap<string, number>;
  /**
   * The lesson the learner opened last, from the continue-watching record.
   * It may belong to another module or course; only a lesson of this module
   * anchors the route.
   */
  lastOpenedLessonId?: LessonId;
};

/** Where a lesson sits on the route relative to the learner. */
export type RouteStepState = "finished" | "current" | "upcoming";

/** One lesson's place on the route. */
export type RouteStep = {
  lessonId: LessonId;
  state: RouteStepState;
  /** 0 to 1; a finished lesson is always 1. */
  watchedFraction: number;
};

/** A module's route: one step per lesson, in sequence order, plus the module's totals. */
export type ModuleRoute = {
  steps: RouteStep[];
  finishedCount: number;
  lessonCount: number;
  /** Unwatched runtime across the module's lessons; finished lessons add nothing. */
  secondsLeft: number;
};

/**
 * Splits a runtime into hours and minutes, rounded to the nearest minute.
 *
 * @remarks
 * Rounding happens before the split, so 59 min 45 s reads as `1 h 0 min`
 * rather than `0 h 60 min`. The parts feed an ICU message, which is what
 * decides how a locale spells them.
 *
 * @example
 * ```ts
 * splitRuntime(9525); // { hours: 2, minutes: 39 }
 * ```
 *
 * @param seconds - The runtime in seconds
 * @returns The whole hours and the minutes left over
 */
export function splitRuntime(seconds: number): RuntimeParts {
  const totalMinutes = Math.round(seconds / SECONDS_PER_MINUTE);
  return {
    hours: Math.floor(totalMinutes / MINUTES_PER_HOUR),
    minutes: totalMinutes % MINUTES_PER_HOUR,
  };
}

/**
 * Derives a module's route from its lessons and the learner's progress.
 *
 * @remarks
 * The current lesson follows where the learner was last. It is found from an
 * anchor: the last opened lesson when it belongs to this module, otherwise the
 * furthest lesson with any progress. An unfinished anchor is current; a
 * finished one hands over to the first unfinished lesson after it, or to the
 * first unfinished lesson at all when none follows. With no anchor, the first
 * lesson is current.
 *
 * So a learner who skipped ahead is not sent back to the start, and a learner
 * who then returned to the start continues there. Opening an earlier video to
 * review it also moves the current lesson back — storage cannot tell a review
 * from a return.
 *
 * "Finished" is the shared completion rule from `watch-progress`: marked
 * complete, or watched past the finish threshold.
 *
 * @example
 * ```ts
 * const route = deriveModuleRoute(lessons, { completedLessonIds, positions, lastOpenedLessonId });
 * route.steps.find((step) => step.state === "current");
 * ```
 *
 * @param lessons - The module's lessons, in any order
 * @param progress - The completion marks, playback positions and last opened lesson read from the browser
 * @returns The steps in sequence order, and the module's finished count and time left
 */
export function deriveModuleRoute(
  lessons: ReadonlyArray<RouteLesson>,
  progress: LearnerProgress,
): ModuleRoute {
  const orderedLessons = [...lessons].sort(bySequence);
  const steps = promoteCurrent(
    orderedLessons.map((lesson) => toStep(lesson, progress)),
    progress.lastOpenedLessonId,
  );
  return {
    steps,
    finishedCount: steps.filter((step) => step.state === "finished").length,
    lessonCount: steps.length,
    secondsLeft: sumSecondsLeft(orderedLessons, steps),
  };
}

function bySequence(a: RouteLesson, b: RouteLesson): number {
  return a.sequence - b.sequence;
}

function toStep(lesson: RouteLesson, progress: LearnerProgress): RouteStep {
  const positionSeconds = progress.positions.get(lesson.id) ?? null;
  const isFinished = countsAsComplete({
    isMarkedComplete: progress.completedLessonIds.has(lesson.id),
    positionSeconds,
    durationSeconds: lesson.durationSeconds,
  });
  return {
    lessonId: lesson.id,
    state: isFinished ? "finished" : "upcoming",
    watchedFraction: isFinished
      ? FULLY_WATCHED
      : watchedFraction(positionSeconds, lesson.durationSeconds),
  };
}

function promoteCurrent(steps: RouteStep[], lastOpenedLessonId?: LessonId): RouteStep[] {
  const currentIndex = currentStepIndex(steps, anchorIndex(steps, lastOpenedLessonId));
  return steps.map((step, index) =>
    index === currentIndex ? { ...step, state: "current" } : step,
  );
}

function anchorIndex(steps: RouteStep[], lastOpenedLessonId?: LessonId): number {
  const lastOpenedIndex = steps.findIndex((step) => step.lessonId === lastOpenedLessonId);
  return lastOpenedIndex !== NOT_FOUND ? lastOpenedIndex : furthestProgressIndex(steps);
}

function currentStepIndex(steps: RouteStep[], anchor: number): number {
  if (anchor !== NOT_FOUND && isUnfinished(steps[anchor]!)) return anchor;

  const nextIndex = steps.findIndex((step, index) => index > anchor && isUnfinished(step));
  return nextIndex !== NOT_FOUND ? nextIndex : steps.findIndex(isUnfinished);
}

function furthestProgressIndex(steps: RouteStep[]): number {
  return steps.reduce((furthest, step, index) => (hasProgress(step) ? index : furthest), NOT_FOUND);
}

function hasProgress(step: RouteStep): boolean {
  return step.state === "finished" || step.watchedFraction > 0;
}

function isUnfinished(step: RouteStep): boolean {
  return step.state !== "finished";
}

function sumSecondsLeft(orderedLessons: RouteLesson[], steps: RouteStep[]): number {
  return orderedLessons.reduce(
    (total, lesson, index) =>
      total + lesson.durationSeconds * (FULLY_WATCHED - steps[index]!.watchedFraction),
    0,
  );
}
