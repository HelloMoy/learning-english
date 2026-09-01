/**
 * Format a playback position as a zero-padded `MM:SS` clock.
 *
 * @remarks
 * Deliberately not locale-aware and deliberately not hour-aware: this is the
 * clock a media control shows, and `MM:SS` reads the same in `en`, `es` and
 * `pt`. When a duration needs words instead — "10 h 35 min" — that is
 * {@link formatDuration}'s job, and the joining belongs in ICU messages.
 *
 * Seconds are truncated rather than rounded, because a `<video>` reports
 * `currentTime` as a float and rounding 599.9 of a 600-second lesson up to
 * `10:00` would claim it finished.
 *
 * @param totalSeconds - A position in seconds. Negative input reads as the start.
 * @returns The position as `MM:SS`, both halves zero-padded.
 *
 * @example
 * ```ts
 * formatMinutesSeconds(65);  // "01:05"
 * formatMinutesSeconds(600); // "10:00"
 * ```
 */
export function formatMinutesSeconds(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = Math.floor(safeSeconds % 60);
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${pad(minutes)}:${pad(seconds)}`;
}
