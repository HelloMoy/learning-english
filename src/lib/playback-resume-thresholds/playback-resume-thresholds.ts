/**
 * Resume-position thresholds (in seconds). A saved position is offered as a
 * resume point only when both bounds hold:
 *
 * - `MIN_SECONDS_FROM_START` — below this, the learner effectively hasn't
 *   watched anything; auto-resume looks broken (video jumps mid-intro).
 * - `SECONDS_NEAR_END` — within the last N seconds of `durationSeconds`,
 *   the learner effectively finished; resume would show "you watched it
 *   all, except the last 3s" and feel broken.
 *
 * See `openspec/changes/archive/2026-07-26-lesson-playback-resume/design.md` §D4.
 */
export const MIN_SECONDS_FROM_START = 30;

/** @see {@link MIN_SECONDS_FROM_START} */
export const SECONDS_NEAR_END = 10;

/**
 * Returns true when the saved `positionSeconds` is meaningful enough to
 * resume from (not noise, not "basically finished"). Both bounds must hold.
 *
 * @remarks
 * This is a **presentation policy**, not a domain invariant: it decides when
 * it is worth *offering* a resume, and deliberately lives outside the
 * hexagon. Range and finiteness of a persisted position are the
 * `PlaybackPosition` value object's job.
 *
 * It lives apart from any component so the player can gate on it without
 * importing modal code — see
 * `openspec/changes/resume-dialog-shadcn-primitive/design.md` §D4.
 *
 * @param positionSeconds - The stored position, or `null` when nothing is saved
 * @param durationSeconds - The lesson's length; `<= 0` is treated as unknown
 *                          and never resumable
 * @returns Whether the resume dialog should be offered for this position
 *
 * @example
 * ```ts
 * isPositionResumable(180, 600); // true  — three minutes into a ten-minute lesson
 * isPositionResumable(5, 600);   // false — barely started
 * isPositionResumable(595, 600); // false — effectively finished
 * ```
 */
export const isPositionResumable = (
  positionSeconds: number | null,
  durationSeconds: number,
): positionSeconds is number => {
  if (positionSeconds === null) return false;
  if (!Number.isFinite(positionSeconds) || positionSeconds < 0) return false;
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return false;
  if (positionSeconds < MIN_SECONDS_FROM_START) return false;
  if (positionSeconds >= durationSeconds - SECONDS_NEAR_END) return false;
  return true;
};
