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
 * @param seconds - A duration in seconds.
 * @returns The duration as whole `hours` and the remaining whole `minutes`.
 *
 * @example
 * ```ts
 * formatDuration(1680); // { hours: 0, minutes: 28 }
 * ```
 */
export function formatDuration(seconds: number): DurationParts {
  const totalMinutes = Math.round(seconds / 60);
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}
