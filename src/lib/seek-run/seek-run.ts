/**
 * How far one double-tap seek moves the video, in seconds.
 *
 * @remarks
 * The single place the interval is spelled. The gesture actions, every seek
 * target in a run and the indicator's label all read it; a future setting
 * for the interval has one value to write.
 *
 * @category Utilities
 */
export const SEEK_STEP_SECONDS = 10;

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
 */
export type SeekRun = {
  direction: SeekDirection;
  steps: number;
  anchorTime: number;
};

/**
 * Starts a one-step run from where the video is.
 *
 * @param direction - The side that was double-tapped
 * @param anchorTime - The playback position at that moment, in seconds
 * @returns A run of one step anchored there
 */
export function startSeekRun(direction: SeekDirection, anchorTime: number): SeekRun {
  return { direction, steps: 1, anchorTime };
}

/**
 * Adds one tap to a run.
 *
 * @remarks
 * A tap on the run's own side adds a step. A tap on the other side turns the
 * run around: a fresh one-step run anchored where the old run was heading, so
 * the label starts counting again, as the YouTube app's does.
 *
 * @param run - The run in progress
 * @param direction - The side that was tapped
 * @returns The run after the tap
 */
export function extendSeekRun(run: SeekRun, direction: SeekDirection): SeekRun {
  if (direction !== run.direction) return startSeekRun(direction, seekRunTarget(run));
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
  return run.steps * SEEK_STEP_SECONDS;
}
