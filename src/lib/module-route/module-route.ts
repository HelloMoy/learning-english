import type { LessonId } from "@/domain/entities/ids/ids";
import { findContinueTarget, type LearnerProgress } from "@/lib/continue-target/continue-target";
import { countsAsComplete, watchedFraction } from "@/lib/watch-progress/watch-progress";

export type { LearnerProgress } from "@/lib/continue-target/continue-target";

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const FULLY_WATCHED = 1;
const NO_CURRENT_STEP = -1;

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
 * The current lesson is the module's continue target, picked by
 * {@link findContinueTarget} — the single rule every continue surface shares
 * (the `continue-target` capability). In short: anchor on the last opened
 * lesson of this module, or the furthest lesson with progress; keep it when
 * unfinished, otherwise move to the first unfinished lesson after it, or to the
 * first unfinished lesson at all. A module whose lessons are all finished has
 * no current step.
 *
 * "Finished" is the shared completion rule from `watch-progress`: marked
 * complete, or watched past the finish threshold.
 *
 * @see findContinueTarget
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
  const currentIndex = currentStepIndex(orderedLessons, progress);
  const steps = orderedLessons.map((lesson, index) =>
    toStep(lesson, progress, index === currentIndex),
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

function currentStepIndex(
  orderedLessons: ReadonlyArray<RouteLesson>,
  progress: LearnerProgress,
): number {
  const target = findContinueTarget(orderedLessons, progress);
  return target.kind === "start" || target.kind === "continue" ? target.index : NO_CURRENT_STEP;
}

function toStep(lesson: RouteLesson, progress: LearnerProgress, isCurrent: boolean): RouteStep {
  const positionSeconds = progress.positions.get(lesson.id) ?? null;
  const isFinished = countsAsComplete({
    isMarkedComplete: progress.completedLessonIds.has(lesson.id),
    positionSeconds,
    durationSeconds: lesson.durationSeconds,
  });
  return {
    lessonId: lesson.id,
    state: isFinished ? "finished" : isCurrent ? "current" : "upcoming",
    watchedFraction: isFinished
      ? FULLY_WATCHED
      : watchedFraction(positionSeconds, lesson.durationSeconds),
  };
}

function sumSecondsLeft(orderedLessons: RouteLesson[], steps: RouteStep[]): number {
  return orderedLessons.reduce(
    (total, lesson, index) =>
      total + lesson.durationSeconds * (FULLY_WATCHED - steps[index]!.watchedFraction),
    0,
  );
}
