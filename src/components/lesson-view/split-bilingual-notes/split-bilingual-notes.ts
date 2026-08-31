/**
 * Splits a lesson's bilingual `readme.md` into Spanish and English blocks
 * for the Lesson Page's Notes tab (design.md §D6). The seed notes mark each
 * language with a level-2 heading, placed after the lesson title, and are
 * free to nest sub-sections underneath it:
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
 * Splitting on those markers — rather than counting blank-line-separated
 * blocks — is what lets a lesson carry nested sections, lists and examples
 * without collapsing into a single column. The language heading itself is
 * dropped: the Notes tab already renders a "Español" / "English" label above
 * each column.
 *
 * This is a PURE presentational transform — no domain, no I/O.
 */

export type BilingualNotes =
  | { readonly kind: "split"; readonly es: string; readonly en: string }
  | { readonly kind: "single"; readonly markdown: string };

/** A level-2 heading — `##` but not `###` — opens a language section. */
const SECTION_HEADING = /^##(?!#)\s*(.*)$/;
const SPANISH_LABEL = /espa(ñ|n)ol|spanish/i;
const ENGLISH_LABEL = /english|ingl(é|e)s/i;

type Language = "es" | "en";

function languageOf(headingText: string): Language | null {
  if (SPANISH_LABEL.test(headingText)) return "es";
  if (ENGLISH_LABEL.test(headingText)) return "en";
  return null;
}

/**
 * Collects the body of each language section. Lines before the first `##`
 * heading (the lesson title) are discarded, as is the body of any `##`
 * section whose heading names no language.
 */
function toLanguageSections(markdown: string): Partial<Record<Language, string>> {
  const sections: Partial<Record<Language, string>> = {};
  let current: Language | null = null;
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

export function splitBilingualNotes(markdown: string): BilingualNotes {
  const trimmed = markdown?.trim() ?? "";
  if (trimmed.length === 0) {
    return { kind: "single", markdown: "" };
  }

  const { es, en } = toLanguageSections(trimmed);
  if (es !== undefined && en !== undefined) {
    return { kind: "split", es, en };
  }
  // Monolingual notes still drop the language heading — the single column
  // needs the body, not the marker that selected it.
  const only = es ?? en;
  if (only !== undefined) {
    return { kind: "single", markdown: only };
  }
  return { kind: "single", markdown: trimmed };
}
