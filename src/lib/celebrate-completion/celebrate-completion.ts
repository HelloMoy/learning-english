import { fireCinemaConfetti } from "@/lib/cinema-confetti/cinema-confetti";

/**
 * Fires the confetti burst that celebrates finishing a lesson.
 *
 * @remarks
 * Both producers of completion call this — the manual "Mark as complete"
 * action once its write is confirmed, and the finish rule when playback
 * crosses the lesson's threshold — so the celebration looks and times the
 * same whichever way the learner got there.
 *
 * The burst itself is {@link fireCinemaConfetti}, shared with every other
 * celebration: loaded on demand, still for a reduced-motion learner, and
 * never thrown at the caller. The completed state and the next lesson live
 * in the middle of the page, which the burst leaves clear.
 *
 * @returns A promise that resolves once the bursts have been fired
 */
export async function celebrateLessonCompletion(): Promise<void> {
  await fireCinemaConfetti();
}
