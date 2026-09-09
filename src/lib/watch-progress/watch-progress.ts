/**
 * How close to the end of a lesson counts as having finished it, expressed
 * two ways. The finish threshold is whichever of the two comes **first**:
 *
 * - `SECONDS_FROM_END` — a fixed tail. Right for long lessons, where a
 *   percentage would leave minutes of outro standing between the learner and
 *   their check mark.
 * - `FINISHED_FRACTION` — a share of the runtime. Right for short clips,
 *   where a fixed tail would be a quarter of the whole thing.
 *
 * These thresholds are deliberately *earlier* than the resume rule's
 * `SECONDS_NEAR_END`: "is this done?" and "is it worth offering to resume?"
 * are different questions, and a narrow band answers yes to both. That is
 * coherent — completing a lesson is not a claim that nothing is left to
 * rewatch. Do not collapse the two constants into agreement.
 *
 * See `openspec/changes/show-watch-progress/design.md` §D2.
 */
export const SECONDS_FROM_END = 15;

/** @see {@link SECONDS_FROM_END} */
export const FINISHED_FRACTION = 0.95;

const isUsableDuration = (durationSeconds: number): boolean =>
  Number.isFinite(durationSeconds) && durationSeconds > 0;

const isUsablePosition = (positionSeconds: number | null): positionSeconds is number =>
  positionSeconds !== null && Number.isFinite(positionSeconds);

/**
 * The position, in seconds, at which a lesson counts as watched to the end.
 *
 * @remarks
 * The earlier of the two rules in {@link SECONDS_FROM_END}. For a clip
 * shorter than the fixed tail, `durationSeconds - SECONDS_FROM_END` is zero
 * or negative — a threshold no position could fail to cross — so the
 * percentage rule takes over and a finish stays reachable but earned.
 *
 * @param durationSeconds - The lesson's length
 * @returns The threshold in seconds; meaningless for a duration of `<= 0`,
 *          which {@link hasFinishedWatching} rejects before reaching here
 *
 * @example
 * ```ts
 * finishThresholdSeconds(600); // 570 — the percentage rule wins
 * finishThresholdSeconds(60);  // 45  — the fixed tail wins
 * finishThresholdSeconds(10);  // 9.5 — the tail would be negative
 * ```
 */
export const finishThresholdSeconds = (durationSeconds: number): number => {
  const fromEnd = durationSeconds - SECONDS_FROM_END;
  const fromFraction = durationSeconds * FINISHED_FRACTION;
  return fromEnd > 0 ? Math.min(fromEnd, fromFraction) : fromFraction;
};

/**
 * How much of a lesson the learner has watched, as a share of its runtime.
 *
 * @remarks
 * A **presentation policy**, like `isPositionResumable`: it exists so a
 * progress bar can be drawn, and deliberately lives outside the hexagon.
 * Range and finiteness of a *persisted* position are the `PlaybackPosition`
 * value object's job; this function additionally tolerates whatever a
 * detached player or a hand-edited storage entry hands it, because a bar is
 * never worth a thrown error.
 *
 * A lesson with no runtime — every reading lesson — has no watched fraction
 * rather than an infinite one.
 *
 * @param positionSeconds - The stored position, or `null` when nothing is saved
 * @param durationSeconds - The lesson's length; `<= 0` is treated as unknown
 * @returns A number in `[0, 1]`; `0` whenever the inputs cannot be divided
 *
 * @example
 * ```ts
 * watchedFraction(240, 600); // 0.4
 * watchedFraction(700, 600); // 1   — clamped
 * watchedFraction(null, 600); // 0
 * ```
 */
export const watchedFraction = (
  positionSeconds: number | null,
  durationSeconds: number,
): number => {
  if (!isUsablePosition(positionSeconds)) return 0;
  if (!isUsableDuration(durationSeconds)) return 0;
  return Math.min(1, Math.max(0, positionSeconds / durationSeconds));
};

/**
 * Whether the learner has watched a lesson to its end.
 *
 * @remarks
 * This is the rule that turns playback into completion: crossing it during
 * playback marks the lesson complete through `ProgressTracker`, and it also
 * lets a position saved before that rule existed read as complete with no
 * migration.
 *
 * @param positionSeconds - The stored position, or `null` when nothing is saved
 * @param durationSeconds - The lesson's length; `<= 0` is treated as unknown
 *                          and never finished
 * @returns Whether the position has reached {@link finishThresholdSeconds}
 *
 * @example
 * ```ts
 * hasFinishedWatching(570, 600); // true
 * hasFinishedWatching(569, 600); // false
 * hasFinishedWatching(240, 0);   // false — a reading lesson
 * ```
 */
export const hasFinishedWatching = (
  positionSeconds: number | null,
  durationSeconds: number,
): positionSeconds is number => {
  if (!isUsablePosition(positionSeconds)) return false;
  if (!isUsableDuration(durationSeconds)) return false;
  return positionSeconds >= finishThresholdSeconds(durationSeconds);
};

/**
 * Whether a lesson counts as done.
 *
 * @remarks
 * Completion has two producers — the **Mark as complete** button and playback
 * crossing {@link finishThresholdSeconds} — and this is where they are
 * combined. Every surface that shows completion asks this one question, which
 * is what stops a row, an outline entry and a module card from disagreeing
 * about the same lesson.
 *
 * Deriving from the saved position, rather than trusting the stored mark
 * alone, is also what lights up positions saved before the finish rule
 * existed: no migration, no backfill write.
 *
 * @param isMarkedComplete - What the progress tracker stored for this lesson
 * @param positionSeconds - The stored position, or `null` when nothing is saved
 * @param durationSeconds - The lesson's length; `<= 0` leaves the mark deciding
 * @returns Whether the lesson should be shown as complete
 */
export const countsAsComplete = ({
  isMarkedComplete,
  positionSeconds,
  durationSeconds,
}: {
  isMarkedComplete: boolean;
  positionSeconds: number | null;
  durationSeconds: number;
}): boolean => isMarkedComplete || hasFinishedWatching(positionSeconds, durationSeconds);
