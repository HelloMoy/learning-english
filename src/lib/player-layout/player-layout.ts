/**
 * The width, in CSS pixels, at and above which the lesson Player wears its
 * full chrome.
 *
 * @remarks
 * Vidstack's own default also breaks on *height* — below 380px it switches to
 * the compact chrome — and a 16:9 player in the lesson column is about 360px
 * tall on a desktop, so every desktop learner would get the phone chrome.
 * Width alone is the project's rule; `LessonVideoPlayer` says why.
 *
 * @category Utilities
 */
export const COMPACT_CHROME_MAX_WIDTH = 576;

/**
 * Whether a player of this width wears the Default Layout's compact chrome.
 *
 * @remarks
 * The single source for the question "which chrome is on screen?". The
 * Player's `smallLayoutWhen` asks it, and so does the decision to draw a
 * centre play/pause control — the compact chrome draws one of its own, and
 * exactly one may ever be on screen.
 *
 * @example
 * ```ts
 * isCompactChrome(360); // true  — a phone in portrait
 * isCompactChrome(714); // false — the player enlarged in landscape
 * ```
 *
 * @param width - The player's own width in CSS pixels, as Vidstack reports it
 * @returns `true` while the compact chrome is in force
 */
export function isCompactChrome(width: number): boolean {
  return width < COMPACT_CHROME_MAX_WIDTH;
}
