/**
 * Selects the language section a learner should read from a lesson's
 * `readme.md`, given the app's active locale (design.md §D6). Notes bodies
 * mark each language with a level-2 heading, placed after the lesson title,
 * and are free to nest sub-sections underneath it:
 *
 *     # Intro
 *
 *     ## 🇪🇸 Español
 *
 *     ### Pronunciación rápida de las vocales
 *
 *     Para sonar fluido y natural…
 *
 *     ## 🇺🇸 English
 *
 *     ### Fast Vowel Pronunciation
 *
 *     To sound fluent and natural…
 *
 *     ## 🇧🇷 Português
 *
 *     ### Pronúncia rápida das vogais
 *
 *     Para soar fluente e natural…
 *
 * Selecting on those markers — rather than counting blank-line-separated
 * blocks — is what lets a lesson carry nested sections, lists and examples
 * without losing the language it belongs to. The language heading itself is
 * dropped: the Notes tab renders the body in the language the learner already
 * chose, so a label would only repeat the app's own language control.
 *
 * This is a PURE presentational transform — no domain, no I/O.
 */

/** A level-2 heading — `##` but not `###` — opens a language section. */
const SECTION_HEADING = /^##(?!#)\s*(.*)$/;

/**
 * The languages a notes body can be written in: the app's locales.
 *
 * @category Content
 */
export type NotesLanguage = "es" | "en" | "pt";

/**
 * How a language is named in a heading, in any of the three locales' words.
 * Portuguese is tested first because `Portugués` — Spanish for Portuguese —
 * would otherwise be read as a Spanish heading.
 */
const LANGUAGE_LABELS: ReadonlyArray<readonly [NotesLanguage, RegExp]> = [
  ["pt", /portugu(ê|e|é)s|portuguese/i],
  ["es", /espa(ñ|nh|n)ol|spanish/i],
  ["en", /english|ingl(é|e|ê)s/i],
];

/**
 * Which section a learner reads when the notes carry no section for their
 * locale: English first, then Spanish. The order is the one the Lesson Page
 * specifies, not a preference of this module.
 */
const FALLBACK_ORDER: ReadonlyArray<NotesLanguage> = ["en", "es"];

function languageOf(headingText: string): NotesLanguage | null {
  return LANGUAGE_LABELS.find(([, label]) => label.test(headingText))?.[0] ?? null;
}

/**
 * Collects the body of each language section. Lines before the first `##`
 * heading (the lesson title) are discarded, as is the body of any `##`
 * section whose heading names no language.
 */
function toLanguageSections(markdown: string): Partial<Record<NotesLanguage, string>> {
  const sections: Partial<Record<NotesLanguage, string>> = {};
  let current: NotesLanguage | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (current === null) return;
    const body = buffer.join("\n").trim();
    if (body.length > 0) sections[current] = body;
  };

  for (const line of markdown.split("\n")) {
    const heading = SECTION_HEADING.exec(line);
    if (heading === null) {
      buffer.push(line);
      continue;
    }
    flush();
    current = languageOf(heading[1] ?? "");
    buffer = [];
  }
  flush();

  return sections;
}

function asNotesLanguage(locale: string): NotesLanguage | null {
  return LANGUAGE_LABELS.some(([language]) => language === locale)
    ? (locale as NotesLanguage)
    : null;
}

/**
 * Returns the Markdown a learner on `locale` should read, without its `##`
 * language heading.
 *
 * @remarks
 * Resolves in one order — the requested locale, then English, then Spanish —
 * so a lesson whose notes do not yet carry every language still renders prose
 * the learner can read instead of an empty panel. A body with no recognized
 * language section is returned whole, title heading included, so notes never
 * render broken.
 *
 * @example
 * ```ts
 * selectNotesForLocale("# Intro\n\n## Español\n\nHola.", "es"); // "Hola."
 * selectNotesForLocale("# Intro\n\n## Español\n\nHola.", "pt"); // "Hola."
 * ```
 *
 * @param markdown - The lesson's whole `readme.md` body
 * @param locale - The app's active locale, as `next-intl` reports it
 * @returns The selected section's body, or the whole body when none matches
 * @category Content
 */
export function selectNotesForLocale(markdown: string, locale: string): string {
  const trimmed = markdown?.trim() ?? "";
  if (trimmed.length === 0) return "";

  const sections = toLanguageSections(trimmed);
  const requested = asNotesLanguage(locale);
  const order = requested === null ? FALLBACK_ORDER : [requested, ...FALLBACK_ORDER];

  return order.map((language) => sections[language]).find((body) => body !== undefined) ?? trimmed;
}
