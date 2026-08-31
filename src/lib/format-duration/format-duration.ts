/**
 * A duration split into whole hours and the remaining whole minutes.
 */
export type DurationParts = {
  hours: number;
  minutes: number;
};

/**
 * Split a duration in seconds into hours and minutes for display.
 *
 * @remarks
 * Returns parts rather than a formatted string on purpose: pluralisation and
 * word order differ across `en`, `es` and `pt`, so the joining belongs in the
 * ICU messages, not here. Callers pick a message key from whether `hours` is
 * zero and interpolate both numbers.
 *
 * The whole course is the reason this exists. Module durations run from 28
 * to 635 minutes, and rendering the longest as "635 min" is accurate but
 * unreadable.
 *
 * Rounding happens once, on the total, before the split. Rounding hours and
 * minutes independently would let 59m30s surface as "60 min" instead of
 * rolling over into "1 h". Anything above zero reports at least one minute,
 * so a short lesson never reads as free.
 *
 * @param seconds - A duration in seconds. Negative input is treated as zero.
 * @returns The duration as whole `hours` and the remaining whole `minutes`.
 *
 * @example
 * ```ts
 * formatDuration(1680);  // { hours: 0, minutes: 28 }
 * formatDuration(38100); // { hours: 10, minutes: 35 }
 * ```
 */
export function formatDuration(seconds: number): DurationParts {
  if (seconds <= 0) return { hours: 0, minutes: 0 };
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}
