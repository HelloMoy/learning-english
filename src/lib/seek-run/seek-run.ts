/**
 * How far one double-tap seek may move the video, in seconds — the closed set
 * the learner chooses from, in the order the menu lists them.
 *
 * @remarks
 * The single place the offered intervals are spelled. The settings menu builds
 * its options from this list and {@link parseSeekStepSeconds} accepts nothing
 * outside it, so adding a fourth interval is one edit. Ascending, because that
 * is the order a list of durations reads in.
 *
 * @category Utilities
 */
export const SEEK_STEP_OPTIONS_SECONDS = [3, 5, 10] as const;

/**
 * One of the steps the learner may choose, in seconds.
 *
 * @remarks
 * Narrower than `number` on purpose: it is what lets the settings menu and the
 * stored preference pass a step around without either of them re-checking that
 * it is one of the offered ones. {@link parseSeekStepSeconds} is the only way
 * into this type from the outside world.
 *
 * @category Utilities
 */
export type SeekStepSeconds = (typeof SEEK_STEP_OPTIONS_SECONDS)[number];

/**
 * The step a learner who has never chosen gets, in seconds.
 *
 * @remarks
 * Named rather than indexed, because it is not the first or the last of
 * {@link SEEK_STEP_OPTIONS_SECONDS} but a choice of its own: five seconds is
 * the length of a spoken phrase, which is what the gesture is for here — the
 * learner missed a sentence, not a chapter. The shorter interval is there for
 * a single word or sound, and the longer one for a paragraph.
 *
 * @category Utilities
 */
export const DEFAULT_SEEK_STEP_SECONDS: SeekStepSeconds = 5;

/**
 * How long a seek run waits for another tap before it ends, in milliseconds.
 *
 * @remarks
 * Long enough to chain taps at a thumb's natural pace, short enough that the
 * next deliberate tap after a pause is a fresh single tap again.
 *
 * @category Utilities
 */
export const SEEK_RUN_WINDOW_MS = 700;

/**
 * Resolves a stored seek step to one the player can use.
 *
 * @remarks
 * Total by design: this reads a value the learner's browser may have had for
 * months, that another tab may have written, or that a hand in DevTools may
 * have mangled. Anything that is not one of {@link SEEK_STEP_OPTIONS_SECONDS}
 * spelled exactly — an absent entry, a number outside the set (an interval
 * this app no longer offers included), a float, a string with units — means
 * "never chosen" and resolves to
 * {@link DEFAULT_SEEK_STEP_SECONDS}. Nothing here throws, because failing to
 * remember a preference is not worth breaking the lesson the learner is on.
 *
 * @param stored - The raw string from storage, or `null` when there is none
 * @returns One of the offered steps, in seconds
 *
 * @category Utilities
 */
export function parseSeekStepSeconds(stored: string | null): SeekStepSeconds {
  const offered = SEEK_STEP_OPTIONS_SECONDS.find((step) => String(step) === stored);
  return offered ?? DEFAULT_SEEK_STEP_SECONDS;
}

/** The way a seek run moves the video. */
export type SeekDirection = "backward" | "forward";

/**
 * A run of edge taps that seek in one direction.
 *
 * @remarks
 * `anchorTime` is where the video was when the run started, and every target
 * is counted from it rather than from the current time — a provider that has
 * not yet applied the previous seek would otherwise make the next tap lose a
 * step.
 *
 * `stepSeconds` is carried by the run rather than read fresh on every tap, so
 * a step chosen from the settings menu while a run is in flight cannot
 * relabel seeks the indicator has already claimed. It governs the next run
 * instead.
 */
export type SeekRun = {
  direction: SeekDirection;
  steps: number;
  anchorTime: number;
  stepSeconds: number;
};

/**
 * Starts a one-step run from where the video is.
 *
 * @param direction - The side that was double-tapped
 * @param anchorTime - The playback position at that moment, in seconds
 * @param stepSeconds - The learner's step, which this run keeps for its life
 * @returns A run of one step anchored there
 */
export function startSeekRun(
  direction: SeekDirection,
  anchorTime: number,
  stepSeconds: number,
): SeekRun {
  return { direction, steps: 1, anchorTime, stepSeconds };
}

/**
 * Adds one tap to a run.
 *
 * @remarks
 * A tap on the run's own side adds a step, counted in the run's own
 * `stepSeconds` — `stepSeconds` here is ignored, which is what keeps a run
 * in flight honest when the learner changes the setting mid-run.
 *
 * A tap on the other side turns the run around: a fresh one-step run anchored
 * where the old run was heading, so the label starts counting again, as the
 * YouTube app's does. That run is new, so it does take the step passed in.
 *
 * @param run - The run in progress
 * @param direction - The side that was tapped
 * @param stepSeconds - The learner's step, used only if the run turns around
 * @returns The run after the tap
 */
export function extendSeekRun(
  run: SeekRun,
  direction: SeekDirection,
  stepSeconds: number,
): SeekRun {
  if (direction !== run.direction) return startSeekRun(direction, seekRunTarget(run), stepSeconds);
  return { ...run, steps: run.steps + 1 };
}

/**
 * The playback position a run asks the player for, in seconds.
 *
 * @remarks
 * Not clamped: the player bounds a seek to the seekable range itself.
 */
export function seekRunTarget(run: SeekRun): number {
  const sign = run.direction === "forward" ? 1 : -1;
  return run.anchorTime + sign * seekRunSeconds(run);
}

/** The seconds a run has asked for so far — what its label shows. */
export function seekRunSeconds(run: SeekRun): number {
  return run.steps * run.stepSeconds;
}
