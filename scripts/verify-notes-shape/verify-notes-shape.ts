/**
 * A lesson notes file as read from the content tree.
 *
 * @category Content
 */
export type NotesEntry = {
  /** The path reported back in a violation, relative to the content root. */
  readonly path: string;
  /** The file's full Markdown body, title heading included. */
  readonly markdown: string;
};

/** A level-2 heading — `##` but not `###` — opens a language section. */
const LANGUAGE_SECTION_HEADING = /^##(?!#)\s*(.*)$/;
/** A level-3-or-deeper heading is a sub-heading inside a language section. */
const SUB_HEADING = /^###+\s*\S/;
const LANGUAGE_LABEL = /espa(ñ|nh|n)ol|spanish|english|ingl(é|e|ê)s|portugu(ê|e|é)s|portuguese/i;

type LanguageSection = {
  readonly heading: string;
  readonly lines: ReadonlyArray<string>;
};

function languageSectionsOf(markdown: string): LanguageSection[] {
  const sections: { heading: string; lines: string[] }[] = [];

  for (const line of markdown.split("\n")) {
    const heading = LANGUAGE_SECTION_HEADING.exec(line);
    if (heading === null) {
      sections.at(-1)?.lines.push(line);
      continue;
    }
    const label = heading[1]?.trim() ?? "";
    if (LANGUAGE_LABEL.test(label)) sections.push({ heading: label, lines: [] });
  }

  return sections;
}

function bodyBelowTitle(markdown: string): string {
  return markdown
    .split("\n")
    .filter((line) => !line.startsWith("# "))
    .join("\n")
    .trim();
}

function hasProse(lines: ReadonlyArray<string>): boolean {
  return lines.some((line) => line.trim().length > 0 && !line.trimStart().startsWith("#"));
}

function violationsOf({ path, markdown }: NotesEntry): string[] {
  if (bodyBelowTitle(markdown).length === 0) {
    return [`${path}: body is empty below the title heading`];
  }

  const sections = languageSectionsOf(markdown);
  if (sections.length === 0) {
    return [`${path}: no level-2 language section heading`];
  }

  return sections.flatMap(({ heading, lines }) => {
    if (!lines.some((line) => SUB_HEADING.test(line))) {
      return [`${path}: section "${heading}" has no ### sub-heading`];
    }
    if (!hasProse(lines)) {
      return [`${path}: section "${heading}" has no prose below its sub-heading`];
    }
    return [];
  });
}

/**
 * Reports every lesson notes body that does not carry the shape the Lesson
 * Page's Notes tab reads (`course-content-storage`: "Lesson notes bodies carry
 * explicit language sections").
 *
 * @remarks
 * A conformant body names each language with a level-2 heading, opens each
 * language section with a `###` sub-heading, and carries prose beneath it. A
 * body that is only its `#` title is reported too — a lesson the learner opens
 * to find nothing is a content gap, not an accepted state.
 *
 * The check is a line scan, matching `selectNotesForLocale`: it needs to know
 * where the level-2 headings are, and a Markdown AST would buy nothing but a
 * dependency. Its known limit is the same one — a `##` inside a fenced code
 * block reads as a heading — and notes bodies are prose.
 *
 * @example
 * ```ts
 * notesShapeViolations([{ path: "course/lesson/readme.md", markdown }]);
 * // ["course/lesson/readme.md: no level-2 language section heading"]
 * ```
 *
 * @param entries - Notes files to check, in the order they should be reported
 * @returns One human-readable violation per problem found, empty when all conform
 * @category Content
 */
export function notesShapeViolations(entries: ReadonlyArray<NotesEntry>): string[] {
  return entries.flatMap(violationsOf);
}

/** An italic run — `*word*` — but never the `**` of a bold marker. */
const ITALIC_RUN = /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g;
/** The bold label that introduces a lesson's example words, in any of the three languages. */
const EXAMPLES_LABEL =
  /^\*\*(Lo oyes en|You hear it in|Você ouve em|Practica con|Practice with|Pratique com):/;

/**
 * Collapses a section's lines into blocks separated by blank lines, so a
 * hard-wrapped paragraph counts once rather than once per line.
 */
function blocksOf(lines: ReadonlyArray<string>): string[] {
  const blocks: string[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length > 0) blocks.push(paragraph.join(" "));
    paragraph = [];
  };

  for (const line of lines) {
    if (line.trim().length === 0) flush();
    else paragraph.push(line.trim());
  }
  flush();

  return blocks;
}

/** The kind of each block, in order — a language-neutral shape of the section. */
function skeletonOf(lines: ReadonlyArray<string>): string[] {
  return blocksOf(lines).map((block) => {
    if (block.startsWith("###")) return "sub-heading";
    if (block.startsWith("- ")) return "list";
    if (block.startsWith("> ")) return "quote";
    if (block.startsWith("**")) return "label";
    return "paragraph";
  });
}

/** The example words a section lists, which both languages must share. */
function exampleWordsOf(lines: ReadonlyArray<string>): string[] {
  const examples = blocksOf(lines).find((block) => EXAMPLES_LABEL.test(block)) ?? "";
  return [...examples.matchAll(ITALIC_RUN)].map((match) => match[1] ?? "");
}

/** How one language section differs from the one it is compared against. */
function mismatchOf(reference: LanguageSection, other: LanguageSection): string | null {
  const skeletons = [skeletonOf(reference.lines), skeletonOf(other.lines)];
  if (skeletons[0]?.join() !== skeletons[1]?.join()) {
    return `sections differ in skeleton — ${skeletons[0]} vs ${skeletons[1]}`;
  }

  const examples = [exampleWordsOf(reference.lines), exampleWordsOf(other.lines)];
  if (examples[0]?.join() !== examples[1]?.join()) {
    return `sections list different example words — ${examples[0]} vs ${examples[1]}`;
  }

  return null;
}

/**
 * Reports every lesson whose language sections are not mirrors of one another
 * (`course-content-storage`: "the language sections SHALL be mirrors").
 *
 * @remarks
 * Checks the two halves of the requirement a machine can settle: every section
 * carries the same blocks in the same order as the first one, and they all list
 * the same example words. Whether they make the same claims is a reading task,
 * not a parsing one, and stays a review step.
 *
 * A body with a single language section has nothing to mirror and is passed
 * over — a missing section is `notesShapeViolations`' business, not this one.
 *
 * @param entries - Notes files to check, in the order they should be reported
 * @returns One violation per file that mismatches, empty when every one mirrors
 * @category Content
 */
export function mirrorViolations(entries: ReadonlyArray<NotesEntry>): string[] {
  return entries.flatMap(({ path, markdown }) => {
    const [reference, ...rest] = languageSectionsOf(markdown);
    if (reference === undefined) return [];

    const mismatch = rest.map((section) => mismatchOf(reference, section)).find(Boolean);
    return mismatch === undefined || mismatch === null ? [] : [`${path}: ${mismatch}`];
  });
}
