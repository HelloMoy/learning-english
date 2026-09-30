const SECONDS_PER_MINUTE = 60;
const DAYS_PER_WEEK = 7;

/** How long a course takes at a steady daily pace. */
export type StudyPace = {
  /** Study days, the last one counted even when it is only partly used. */
  days: number;
  /** Those days as the nearest whole number of weeks, never less than one. */
  weeks: number;
};

/**
 * Turns a course's runtime into how long it takes at a number of minutes a day.
 *
 * @remarks
 * Weeks are rounded to the nearest whole number because the course page states
 * them as an estimate ("about 5 weeks"). A course that fits in a few days still
 * reads as one week rather than zero.
 *
 * @example
 * ```ts
 * studyPace(37_768, 20); // { days: 32, weeks: 5 }
 * ```
 *
 * @param runtimeSeconds - The course's total video runtime
 * @param minutesPerDay - How long the learner studies each day
 * @returns The study days and the equivalent weeks
 *
 * @category Course page
 */
export function studyPace(runtimeSeconds: number, minutesPerDay: number): StudyPace {
  const days = Math.ceil(runtimeSeconds / SECONDS_PER_MINUTE / minutesPerDay);
  return { days, weeks: Math.max(1, Math.round(days / DAYS_PER_WEEK)) };
}
