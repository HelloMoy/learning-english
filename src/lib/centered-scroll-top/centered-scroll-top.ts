/**
 * The measurements `centeredScrollTop` needs, all in CSS pixels.
 *
 * @remarks
 * Plain numbers rather than DOM nodes on purpose: jsdom reports `0` for
 * every layout box, so geometry expressed against live elements cannot be
 * unit tested. The caller does the measuring; this module does the
 * arithmetic.
 */
export type CenteredScrollTopMeasurements = {
  /** The row's top edge, relative to the origin of the region's scrollable content. */
  rowOffsetTop: number;
  /** The row's own height. */
  rowHeight: number;
  /** The height of the region's visible area (its `clientHeight`). */
  regionHeight: number;
  /** The furthest the region can scroll (`scrollHeight - clientHeight`). */
  maxScrollTop: number;
};

/**
 * Returns the scroll offset that puts a row in the middle of a scrollable
 * region, clamped to what the region can actually scroll.
 *
 * @remarks
 * Clamping is the interesting half. A row in the first module cannot be
 * centred — centring it would ask for a negative offset — and a row in the
 * last module cannot either. In both cases the row lands off-centre but
 * visible, which is the correct outcome: the region is already showing
 * everything there is to show in that direction.
 *
 * A row taller than the region gets its own middle aligned with the
 * region's middle, which puts its top edge above the fold. That is
 * deliberate — with nothing else to go on, the middle of an oversized row
 * is the best guess at what the reader wants to see.
 *
 * @param measurements - The measured geometry of the region and the row
 * @returns A scroll offset within `[0, max(maxScrollTop, 0)]`
 *
 * @example
 * ```ts
 * // A 40px row 1000px down a 600px-tall region that can scroll 2000px.
 * centeredScrollTop({
 *   rowOffsetTop: 1000,
 *   rowHeight: 40,
 *   regionHeight: 600,
 *   maxScrollTop: 2000,
 * }); // 720 — the row's middle now sits at the region's middle
 * ```
 */
export const centeredScrollTop = ({
  rowOffsetTop,
  rowHeight,
  regionHeight,
  maxScrollTop,
}: CenteredScrollTopMeasurements): number => {
  const centered = rowOffsetTop - (regionHeight - rowHeight) / 2;
  const furthestOffset = Math.max(maxScrollTop, 0);
  return Math.min(Math.max(centered, 0), furthestOffset);
};
