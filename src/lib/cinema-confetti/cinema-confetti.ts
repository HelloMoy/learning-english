/** Immersion Cinema's gold family, as literal hex: the canvas cannot read CSS tokens. */
const CINEMA_CONFETTI_COLORS = ["#e7b64c", "#f0c869", "#f4f1ea"];

/**
 * Fires the confetti burst the app celebrates with: one fan of gold from each
 * bottom corner of the page.
 *
 * @remarks
 * Every celebration calls this — finishing a lesson and enrolling in a
 * course — so they look and time the same.
 *
 * `canvas-confetti` is imported on demand rather than at module scope: most
 * routes celebrate nothing, and a static import would put the library in the
 * bundle every page pays for.
 *
 * Reduced motion is the library's own `disableForReducedMotion`, not a media
 * query of ours, so the preference has one definition.
 *
 * The burst leaves the middle of the page clear and it never blocks, focuses,
 * or waits to be dismissed. It is decoration over an action that already
 * succeeded, so a chunk that would not load or a canvas that would not draw
 * is swallowed rather than thrown at the caller.
 *
 * @example
 * ```ts
 * void fireCinemaConfetti();
 * ```
 *
 * @returns A promise that resolves once the bursts have been fired; it never rejects
 *
 * @category Celebration
 */
export async function fireCinemaConfetti(): Promise<void> {
  try {
    await fireCornerBursts();
  } catch {
    // Decoration only: the action being celebrated has already succeeded.
  }
}

async function fireCornerBursts(): Promise<void> {
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
