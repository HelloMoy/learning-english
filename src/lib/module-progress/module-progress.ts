import type { ModuleLesson } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { countsAsComplete } from "@/lib/watch-progress/watch-progress";

/** How many lessons the progress panel previews after the one it opens. */
const UP_NEXT_LIMIT = 3;

/**
 * Where the learner stands in one module, decided from this device's progress.
 *
 * @remarks
 * - `empty` — the module holds no lessons.
 * - `not-started` — nothing is complete and no lesson has been played at all.
 * - `in-progress` — something is complete or has been played, and something
 *   is not complete yet. `target` is the first lesson, in sequence, that is
 *   not complete.
 * - `completed` — every lesson is complete.
 */
export type ModuleProgress =
  | { kind: "empty" }
  | {
      kind: "not-started";
      target: ModuleLesson;
      lessonCount: number;
      upNext: ModuleLesson[];
    }
  | {
      kind: "in-progress";
      target: ModuleLesson;
      targetNumber: number;
      completedCount: number;
      lessonCount: number;
      secondsLeftInTarget: number;
      secondsLeftInModule: number;
      upNext: ModuleLesson[];
    }
  | { kind: "completed"; first: ModuleLesson; lessonCount: number };

/** The learner's progress on this device, read from the two local stores. */
export type ModuleProgressInput = {
  lessons: ReadonlyArray<ModuleLesson>;
  completedIds: ReadonlySet<string>;
  positions: ReadonlyMap<string, number>;
};

/**
 * Decides which state a module's progress panel is in, and the lesson its
 * primary action should open.
 *
 * @remarks
 * Completion uses `countsAsComplete`, the rule every other progress indicator
 * uses, so the panel can never disagree with a lesson row or a module meter.
 * Time left in a lesson is its runtime minus its saved position; time left in
 * the module is that remainder summed over every lesson not yet complete.
 *
 * @example
 * ```ts
 * const progress = moduleProgress({ lessons, completedIds, positions });
 * if (progress.kind === "in-progress") console.log(progress.target.title);
 * ```
 *
 * @param input - The module's lessons in sequence order and the learner's marks and positions
 * @returns The module's progress state
 */
export function moduleProgress(input: ModuleProgressInput): ModuleProgress {
  const { lessons } = input;
  const [first] = lessons;
  if (!first) return { kind: "empty" };

  const isComplete = (lesson: ModuleLesson) => isLessonComplete(lesson, input);
  const targetIndex = lessons.findIndex((lesson) => !isComplete(lesson));
  if (targetIndex === -1) return { kind: "completed", first, lessonCount: lessons.length };

  const upNext = lessons.slice(targetIndex + 1, targetIndex + 1 + UP_NEXT_LIMIT);
  if (!hasStarted(input)) {
    return { kind: "not-started", target: first, lessonCount: lessons.length, upNext };
  }

  const target = lessons[targetIndex]!;
  const unfinished = lessons.filter((lesson) => !isComplete(lesson));
  return {
    kind: "in-progress",
    target,
    targetNumber: targetIndex + 1,
    completedCount: lessons.length - unfinished.length,
    lessonCount: lessons.length,
    secondsLeftInTarget: secondsLeft(target, input.positions),
    secondsLeftInModule: unfinished.reduce(
      (total, lesson) => total + secondsLeft(lesson, input.positions),
      0,
    ),
    upNext,
  };
}

function isLessonComplete(lesson: ModuleLesson, input: ModuleProgressInput): boolean {
  return countsAsComplete({
    isMarkedComplete: input.completedIds.has(lesson.id),
    positionSeconds: input.positions.get(lesson.id) ?? null,
    durationSeconds: lesson.durationSeconds,
  });
}

function hasStarted(input: ModuleProgressInput): boolean {
  return input.lessons.some(
    (lesson) => isLessonComplete(lesson, input) || (input.positions.get(lesson.id) ?? 0) > 0,
  );
}

function secondsLeft(lesson: ModuleLesson, positions: ReadonlyMap<string, number>): number {
  return Math.max(0, lesson.durationSeconds - (positions.get(lesson.id) ?? 0));
}
