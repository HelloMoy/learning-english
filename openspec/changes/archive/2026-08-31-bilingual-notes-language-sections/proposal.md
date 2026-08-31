# Bilingual notes split on explicit language sections

## Why

The Notes tab decides its ES/EN columns by counting blank-line-separated blocks: it drops
leading heading blocks and splits only when **exactly two** body blocks remain. That shape
admits one paragraph per language and nothing else — a lesson cannot carry a descriptive
subtitle, a nested sub-section, a list, or an example without collapsing into a single
column.

The 72 lesson `readme.md` files in `advanced-intermediate-course` were never consistent
with that shape. Some already opened each language with a `##` heading, some had no
heading at all, and some mixed the two (`## English:` with `### …` for English, nothing for
Spanish). Now that the corpus has been normalized around explicit `## Español` / `## English`
sections with nested `###` sub-sections, **all 72 lessons render as a single column** —
the two-column reading experience is gone for every lesson in the course.

## What Changes

- `splitBilingualNotes` splits on explicit level-2 **language section headings** rather than
  counting blocks. A `##` heading whose text names Spanish or English opens that language's
  section; the section runs until the next `##` heading or end of file.
- The language heading itself is dropped from the column body — the Notes tab already renders
  its own "Español" / "English" column label, so keeping the marker would duplicate it.
- Everything nested inside a language section is preserved verbatim: `###`/`####`
  sub-headings, lists, blockquotes, emphasis, examples.
- A **monolingual** lesson (only one language section) renders in a single column carrying
  that section's body, with its language heading stripped. Today such a lesson either renders
  its raw `#` title alongside the prose or, worse, gets its two English paragraphs split
  across an "Español" and an "English" column.
- **BREAKING** for note content: the old two-bare-paragraphs shape no longer splits. Lesson
  notes must carry explicit language sections to render two columns. The `advanced-intermediate-course`
  corpus has already been normalized; this change makes the renderer match it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cinema-lesson-view`: the "Notes tab shows a bilingual split" requirement changes what
  makes notes splittable — explicit language sections instead of a two-block count — and
  gains behavior for nested sub-sections and for monolingual notes.
- `course-content-storage`: records the language-section shape lesson `readme.md` bodies are
  expected to follow, and pins the existing rule that a lesson's first `#` heading is
  title-derivation input, so reformatting a body must leave that heading byte-for-byte intact.

## Non-goals

- **No change to lesson titles.** The first `#` heading of every `readme.md` stays exactly as
  it is. It feeds title derivation for allowlisted modules, so editing it would rewrite
  `src/adapters/persistence/in-memory/seed/seed-content.ts`. Out of scope here.
- **No regeneration of the seed.** `seed-content.ts` is untouched.
- **No content rewriting.** Lesson prose, pedagogy, and translations are not being edited or
  corrected as part of this change.
- **No Transcript tab work.** It stays present-but-disabled.
- **No new column labels or layout changes** in `LessonNotesTabs` beyond consuming the new
  splitter result.
- **No third language.** The split stays ES/EN.

## Impact

- `src/components/lesson-view/split-bilingual-notes/split-bilingual-notes.ts` — the splitter
  itself; the only production file that changes.
- `src/components/lesson-view/split-bilingual-notes/split-bilingual-notes.test.ts` — rewritten
  around language sections, nested sub-sections and monolingual notes.
- `src/components/lesson-view/lesson-notes-tabs/lesson-notes-tabs.test.tsx` — its bilingual
  fixture moves to the language-section shape.
- `public/local-filesystem-lesson/advanced-intermediate-course/**/readme.md` — already
  normalized (content, gitignored); this change is what makes the renderer honor it.
- No domain, adapter, route, or i18n changes. The splitter stays a pure presentational
  transform with no I/O.
