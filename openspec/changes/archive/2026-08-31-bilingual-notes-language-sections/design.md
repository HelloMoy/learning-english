## Context

`splitBilingualNotes` is a pure presentational transform in
`src/components/lesson-view/split-bilingual-notes/split-bilingual-notes.ts`, consumed only by
`LessonNotesTabs`. Today it:

1. splits the Markdown on blank lines into trimmed, non-empty blocks,
2. shifts off leading blocks that start with `#`…`######`,
3. returns `{ kind: "split", es, en }` when **exactly two** blocks remain, otherwise
   `{ kind: "single", markdown }`.

Step 3 is the constraint. "Exactly two blocks" means one paragraph per language and nothing
else — a subtitle, a list, a second paragraph, or a nested section each push the count past
two and collapse the lesson into one column. It also fails in the other direction: a
monolingual English lesson that happens to have two paragraphs gets its first paragraph
labelled "Español".

The `advanced-intermediate-course` corpus (72 `readme.md` files) has been normalized around
explicit `## Español` / `## English` sections with nested `###` sub-headings, lists and
examples. Measured against the current splitter, **72 of 72 lessons now resolve to
`kind: "single"`** — the two-column reading experience is gone course-wide. The splitter is
what has to change; the content shape is the one the lessons actually have.

Constraint carried in from the corpus work: a lesson's first `#` heading is title-derivation
input for allowlisted modules (`course-content-storage`), so it is out of bounds here and
`seed-content.ts` must not move.

## Goals / Non-Goals

**Goals:**

- Split on explicit level-2 language section headings rather than on a block count.
- Preserve everything nested inside a language section verbatim — `###`/`####` sub-headings,
  lists, blockquotes, emphasis, examples.
- Drop the language heading itself from the column body, since the tab renders its own label.
- Give monolingual notes a correct single column instead of a mislabelled split or a raw title.
- Keep the module a pure transform: no I/O, no domain, no new dependency.

**Non-Goals:**

- No change to any lesson's `#` title heading, and no regeneration of `seed-content.ts`.
- No rewriting of lesson prose, pedagogy or translations.
- No layout, label or Transcript-tab changes in `LessonNotesTabs`.
- No third language; the split stays ES/EN.
- No Markdown parser dependency (see Decisions).

## Decisions

**Parse with a line scan, not a Markdown AST.** The transform needs one thing: where the
level-2 headings are. A line scan over `markdown.split("\n")` with `/^##(?!#)\s*(.*)$/` gives
that in a few lines, keeps the module dependency-free, and preserves each section's body as
the exact source text so `react-markdown` renders it unchanged downstream. Pulling in
`remark`/`mdast` to walk a tree would mean re-serializing each section back to Markdown to
hand it to `<Markdown>` — more code, more dependency surface, and a round-trip that can alter
formatting. Rejected.

*Accepted limitation:* a `##` line inside a fenced code block would be read as a heading. The
notes corpus is prose — no fenced code — and the fallback is a single column, not a crash.
Not worth an AST.

**Match the language by label, not by position or emoji.** `## Español` and `## 🇪🇸 Español`
and `## English` must all work, and the corpus writes flag emoji into the headings. Testing
the heading text against `/espa(ñ|n)ol|spanish/i` and `/english|ingl(é|e)s/i` accepts every
spelling in use, tolerates the emoji prefix, and lets the two sections appear in either
order. Keying off "first section is Spanish" would silently mislabel the English-first files.

**A section runs to the next level-2 heading.** `###` and deeper stay inside their language
section — that is exactly what makes nested sub-sections work. A `##` section whose heading
names no language is dropped rather than merged into a neighbour, so a stray `## Notas` can
never leak into the wrong column.

**Drop the language heading from the body.** `LessonNotesTabs` already renders "Español" /
"English" as an `<h3>` column label. Keeping the `##` marker would print the label twice.

**Remove the two-block fallback rather than keep it as a secondary path.** Once every
bilingual lesson carries explicit markers, the block count can only fire on notes that lack
them — which is precisely where it guesses wrong (a two-paragraph English lesson split into
"Español" + "English"). Keeping it would preserve a known-bad guess for no gain. Notes with no
language section fall back to the original Markdown in one column.

## Risks / Trade-offs

- **A lesson body added later without language headings silently renders as one column.**
  → The `course-content-storage` delta states the required shape, and the fallback is a
  correct single column rather than a broken or mislabelled render. `AGENTS.md` now flags
  lesson Markdown as generator input, not free-form prose.
- **A `##` inside a fenced code block would be misread as a section heading.** → The notes
  corpus is prose with no code fences; worst case is the single-column fallback. Accepted
  over an AST dependency.
- **The language regexes could match a heading that merely mentions a language** (e.g.
  `## Why English rhythm matters`). → Real risk, but only inside a `##` heading, and the
  corpus uses bare language names. Mitigated by covering the ordering and non-language-section
  cases in unit tests.
- **Behavior change for any note still written in the old two-paragraph shape.** → The
  corpus has been normalized; the `cinema-lesson-view` delta records the new contract.

## Migration Plan

No data migration and no deploy step. The content is already in the new shape; this change
makes the renderer agree with it. Rollback is reverting the single production file — the
Markdown stays valid either way, degrading to one column.

## Testing strategy

TDD per `AGENTS.md`: failing test first, then the implementation.

- **Vitest unit** — `src/components/lesson-view/split-bilingual-notes/split-bilingual-notes.test.ts`
  carries the bulk of the coverage, mirroring the existing file's `describe`/`test` style. One
  test per spec scenario: the ES/EN split; nested `###`/`####` sub-headings and lists surviving
  inside a column; either section order; monolingual notes yielding a single column with the
  heading stripped; no language section falling back to the original Markdown; a non-language
  `##` section ignored; empty and whitespace-only input.
- **Vitest component + RTL** — `src/components/lesson-view/lesson-notes-tabs/lesson-notes-tabs.test.tsx`
  keeps its current assertions, with the `BILINGUAL` fixture moved to the language-section
  shape, so the two labelled columns, the single-column fallback, the disabled Transcript tab
  and the no-raw-HTML guarantee are all still covered through the component.
- **Playwright e2e** — none. This is a pure presentational transform with no route, network or
  navigation behavior; the existing lesson-page e2e coverage is unaffected.
- **Full suite** — `pnpm verify` (typecheck, format, lint, unit) before archiving.

## Open Questions

None.
