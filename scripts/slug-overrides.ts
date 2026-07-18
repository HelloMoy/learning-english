/**
 * Manual slug overrides for course content folder names.
 *
 * The seed generator looks up a folder's RAW name (as it appears on disk,
 * including spaces and special characters) in this map. If a key matches,
 * the corresponding value is used as the slug. If not, `slugify` from
 * `./slug.ts` runs and produces an automatic slug.
 *
 * When to add an entry:
 * - The automatic slug is technically valid but ugly (e.g., "5 Sound
 *   Natural: American Intonation Essentials" → "5-sound-natural-american-
 *   intonation-essentials"; you may prefer "5-sound-natural-intonation").
 * - The author wants to fix inconsistencies (e.g., "1 Day#1" vs "3 Day# 3"
 *   both auto-slug to "1-day-1" and "3-day-3", but you want "1-day-01" and
 *   "3-day-03" for sequence clarity).
 * - The auto-normalization produces an ambiguous result (e.g., two folders
 *   that auto-slug to the same string).
 *
 * Each entry MUST be reviewed in code review alongside the content it
 * represents — an absent entry is a deliberate choice to accept the
 * automatic slug.
 */
export const SLUG_OVERRIDES: Record<string, string> = {
  // Example (replace with real overrides when content is reviewed):
  // "1 Day#1": "1-day-01",
  // "3 Day# 3": "3-day-03",
};
