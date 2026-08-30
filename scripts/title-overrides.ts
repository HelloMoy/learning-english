/**
 * Per-lesson title overrides, keyed by full `courseSlug/moduleSlug/lessonSlug`.
 *
 * @remarks
 * The generator resolves a lesson's title from three sources, in order:
 * this table, then the notes heading (for allowlisted modules), then the
 * slug. An override therefore beats everything — it exists precisely because
 * the automatic sources are absent or wrong.
 *
 * **That precedence has a cost.** If someone later adds a `readme.md` to a
 * lesson listed here, its heading will be ignored until the entry is deleted.
 * Every entry carries a comment saying why it exists, so a future reader can
 * tell when it has become obsolete.
 *
 * Keys are full paths, never bare lesson slugs: `1-intro` exists in most
 * modules, and a bare key would silently rename all of them at once.
 *
 * Values are written by hand and are **not** normalized — unlike headings,
 * which get their apostrophes unified. Write `’` (U+2019), not `'`; a test
 * enforces it rather than repairing it silently.
 *
 * An override applies whether or not its module is in
 * {@link TITLE_FROM_NOTES_MODULES}. The allowlist gates the *automatic*
 * heading source, which needs a module-wide review; an entry here is already
 * a per-lesson reviewed decision.
 */
export const LESSON_TITLE_OVERRIDES: Record<string, string> = {
  // No `readme.md` at all — only an mp4 and a thumbnail — so neither a
  // heading nor anything but the mangled slug ("I D You D We D All The Would
  // Contractions") is available. The value restores the folder name the slug
  // preserved. The thumbnail shows a longer list ("I’d, you’d, he’d, she’d,
  // it’d, we’d, they’d, who’d") under the label "Would"; that is the
  // on-screen teaching aid, not the lesson's name, and its sibling lessons
  // are shortened lists too. Delete this entry if the lesson ever gains a
  // readme with a real heading.
  "advanced-intermediate-course/3-contractions-reductions/6-i-d-you-d-we-d-all-the-would-contractions":
    "I’d, you’d, we’d — all the WOULD contractions",
};

/**
 * The reviewed title for a lesson, when one has been declared.
 *
 * @param slugPath - `courseSlug/moduleSlug/lessonSlug`
 * @returns The override, or `undefined` when the lesson has none
 */
export function lessonTitleOverride(slugPath: string): string | undefined {
  return LESSON_TITLE_OVERRIDES[slugPath];
}
