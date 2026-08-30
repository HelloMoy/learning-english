/**
 * Modules whose lesson titles come from the notes heading instead of the
 * folder slug.
 *
 * @remarks
 * Slugification is lossy. It strips IPA notation, apostrophes and
 * punctuation, so `# Fast /æ/` reaches the generator as `4-fast` — and in
 * the vowel module eight sibling folders reduced to the same word, leaving
 * eight lessons all displaying "Fast". `rename-manifest.json` was supposed
 * to preserve the original names but is empty, so the notes heading is the
 * only surviving source.
 *
 * Enabling a module is not automatic, because adopting its headings adopts
 * whatever inconsistencies they carry. Modules 9 and 10, for instance, mix
 * `Day#1`, `Day# 3` and `Day #4`, and `Exercise 1 : …` beside
 * `Exercise 10: …`; turning those on without deciding a normalization rule
 * would trade one presentation problem for another.
 *
 * **Adding an entry commits you to having read that module's headings.**
 * Check that each one is a title rather than a section label, that the
 * punctuation is consistent, and that no heading is malformed — the vowel
 * module needed a typo fixed at the source (`ast /ɛ/` → `Fast /ɛ/`) before
 * it could be enabled. Then re-run `pnpm generate:content-seed` and review
 * the diff: only titles should move.
 *
 * Lesson ids are derived from slugs, never from titles, so enabling a
 * module changes no identity and nothing keyed to it.
 *
 * @see {@link lessonTitle} in `./discriminate-lesson.ts` for the adoption rule.
 */
export const TITLE_FROM_NOTES_MODULES: ReadonlySet<string> = new Set([
  // 8 of its 13 folders slugged to a bare "fast"; the headings carry the
  // vowel each lesson is actually about.
  "2-advanced-vowel-pronunciation-in-american-english",
]);

/**
 * Whether a module's lessons take their titles from the notes heading.
 *
 * @param moduleSlug - The module's slug, as the generator resolved it
 * @returns `true` when the module has been reviewed and enabled
 */
export function usesTitleFromNotes(moduleSlug: string): boolean {
  return TITLE_FROM_NOTES_MODULES.has(moduleSlug);
}
