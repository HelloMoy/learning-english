/** Immersion Cinema's gold family, as literal hex: the canvas cannot read CSS tokens. */
const CINEMA_CONFETTI_COLORS = ["#e7b64c", "#f0c869", "#f4f1ea"];

/**
 * Fires the confetti burst that celebrates finishing a lesson.
 *
 * @remarks
 * Both producers of completion call this — the manual "Mark as complete"
 * action once its write is confirmed, and the finish rule when playback
 * crosses the lesson's threshold — so the celebration looks and times the
 * same whichever way the learner got there.
 *
 * `canvas-confetti` is imported on demand rather than at module scope: no
 * other route celebrates anything, and a static import would put the library
 * in the bundle every page pays for.
 *
 * Reduced motion is the library's own `disableForReducedMotion`, not a media
 * query of ours, so the preference has one definition.
 *
 * The burst leaves the middle of the page clear — the completed state and
 * the next lesson live there — and it never blocks, focuses, or waits to be
 * dismissed.
 *
 * @returns A promise that resolves once the bursts have been fired
 */
export async function celebrateLessonCompletion(): Promise<void> {
  try {
    await fireCinemaBurst();
  } catch {
    // A chunk that would not load, or a canvas that would not draw. The
    // lesson is already recorded complete; refusing to swallow this would
    // throw an exception over work that succeeded, for decoration.
  }
}

async function fireCinemaBurst(): Promise<void> {
  const { default: confetti } = await import("canvas-confetti");
  const burst = {
    particleCount: 70,
    spread: 70,
    startVelocity: 45,
    ticks: 180,
    colors: CINEMA_CONFETTI_COLORS,
    disableForReducedMotion: true,
  };
  await Promise.all([
    confetti({ ...burst, angle: 60, origin: { x: 0, y: 0.9 } }),
    confetti({ ...burst, angle: 120, origin: { x: 1, y: 0.9 } }),
  ]);
}
