/**
 * Splits a lesson's bilingual `readme.md` into Spanish and English blocks
 * for the Lesson Page's Notes tab (design.md §D6). The seed notes follow a
 * fixed shape — an optional heading, then a Spanish paragraph, then an
 * English paragraph:
 *
 *     # Intro
 *
 *     Para sonar fluido y natural en inglés…
 *
 *     To sound fluent and natural in English…
 *
 * This is a PURE presentational transform — no domain, no I/O. When the
 * content does not cleanly resolve to exactly two body blocks it falls back
 * to a single column so notes never render broken.
 */

export type BilingualNotes =
  | { readonly kind: "split"; readonly es: string; readonly en: string }
  | { readonly kind: "single"; readonly markdown: string };

const HEADING = /^#{1,6}\s/;

/** Split on blank lines into trimmed, non-empty blocks. */
function toBlocks(markdown: string): string[] {
  return markdown
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);
}

export function splitBilingualNotes(markdown: string): BilingualNotes {
  const trimmed = markdown?.trim() ?? "";
  if (trimmed.length === 0) {
    return { kind: "single", markdown: "" };
  }

  const blocks = toBlocks(trimmed);
  // Drop leading heading-only blocks (the lesson title is shown separately).
  const body = [...blocks];
  while (body.length > 0 && HEADING.test(body[0]!)) {
    body.shift();
  }

  // Exactly two body blocks → the ES/EN split. Anything else is ambiguous,
  // so render the original markdown in one column.
  if (body.length === 2) {
    return { kind: "split", es: body[0]!, en: body[1]! };
  }
  return { kind: "single", markdown: trimmed };
}
