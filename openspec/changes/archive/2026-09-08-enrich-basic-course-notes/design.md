## Context

Two independent defects meet on the same screen.

**The content.** `public/local-filesystem-lesson/basic-course/` holds 48 lesson `readme.md`
files, all in the pre-normalization shape: a `#` title, one Spanish paragraph, one English
paragraph, no markers. Word counts run 13–188, and `1-introduction/1-introduction/readme.md`
is a title with an empty body. Fed to `splitBilingualNotes`, all 48 return
`kind: "single"` — the two-column reading experience the Lesson Page was designed around does
not exist for the entry-level course. The sibling `advanced-intermediate-course` was
normalized by change `2026-08-31-bilingual-notes-language-sections` and is the reference
shape; the Basic Course was imported afterwards (`2026-09-08-add-basic-course`) and never
brought along.

**The renderer.** `LessonNotesTabs` wraps notes in
`prose prose-sm prose-slate dark:prose-invert max-w-none text-foreground`. This project has
`@tailwindcss/postcss` but **not** `@tailwindcss/typography`, and `src/app/globals.css`
contains no `@plugin` directive. In Tailwind 4 the typography utilities exist only when that
plugin is loaded, so all four class names compile to nothing. Every notes body therefore
renders with the browser's bare user-agent styles inside a `text-foreground` box: an `h1` that
is barely larger than body text, paragraphs with default margins, list markers at default
indentation. Structure in the Markdown is invisible.

Constraint carried in from `course-content-storage`: a lesson's first `#` heading is
title-derivation input for `pnpm sync:manifest`, so it is out of bounds — changing it would
rewrite `src/content/basic-course.json`. Constraint carried in from the project's working
agreement: no new npm dependency without the human partner's approval.

## Goals / Non-Goals

**Goals:**

- Give all 48 Basic Course lessons a bilingual, structured, genuinely useful notes body under
  one editorial scaffold, so the course reads as one voice.
- Make the Notes tab render that structure visibly, without adding a dependency.
- Leave every `#` title heading byte-for-byte identical, and `src/content/basic-course.json`
  untouched.
- Leave `splitBilingualNotes` untouched — the content moves to the renderer's contract, not
  the other way around.
- Make the content rule executable, so a future imported course cannot silently regress.

**Non-Goals:**

- No `@tailwindcss/typography` dependency.
- No edits to `advanced-intermediate-course` content.
- No manifest, domain, adapter, route or i18n changes.
- No new locale; notes stay ES/EN, and notes content is not routed through `next-intl` (it is
  course content read from the blob store, not UI copy).
- No Transcript-tab work.

## Decisions

### Editorial strategy: one scaffold with two variants, not free prose

Every body follows a fixed spine so the 48 lessons read as one course and a learner who has
read three of them knows where to look in the fourth. The scaffold, per language section:

```markdown
## 🇪🇸 Español

### <Sub-título descriptivo — nombra el sonido y lo que hace>

<Encuadre: 2–3 frases. Qué es, dónde aparece, por qué le importa a tu pronunciación.>

**Cómo se produce**

- 👄 **Boca:** <posición de labios y mandíbula>
- 👅 **Lengua:** <dónde va>
- 🔊 **Voz:** <sorda / sonora, duración>

**Lo oyes en:** *word* · *word* · *word* · *word*

> ⚠️ **El error típico en español:** <la sustitución que hace un hispanohablante y qué
> palabra distinta acaba diciendo>

**Al terminar vas a poder:** <capacidad concreta, en primera persona del learner>
```

Two variants, because not every lesson teaches a sound:

- **Sound lessons** (modules 2 Vowels and 3 Consonants, 42 lessons) use the spine above.
- **Practice lessons** (module 1 Introduction, module 4 rhythm drills, module 5 fluency,
  6 lessons) swap **Cómo se produce** → **Qué vas a practicar** and **Lo oyes en** →
  **Practica con**, keeping the same heading levels so the two variants render identically.

*Style rules:* second person, present tense, short sentences; Spanish uses `tú`, never
`usted`; IPA symbols stay in `/slashes/`; example words are italic; the Spanish column
explains English sounds in Spanish rather than translating word-for-word from the English
column. Emoji are used as bullet labels only — at most one per bullet — matching the density
already present in `advanced-intermediate-course`. The two columns are **mirrors**: same
sub-headings, same example words, same error note. A learner picking either column gets the
same lesson.

*Alternatives rejected.* Free-form prose per lesson: reads well individually, but 48 lessons
drift into 48 shapes and the reader loses the ability to scan. A single rigid template with no
variants: forces a "how the sound is produced" block onto a song-practice lesson, where it is
either empty or invented.

### Example words go in a bold-labelled inline run, not a table

`**Lo oyes en:** *book* · *good* · *put*` survives a 50%-width column on a phone. A Markdown
table does not — `remark-gfm` renders it, but a three-column table inside a two-column grid
either overflows or compresses to unreadable. The middle-dot separator is already the corpus
convention (`> *lets you* → "le'cha" · *it's you* → "i'cha"`).

### The common-error note is a blockquote

It is the single highest-value line for a Spanish-speaking learner, and a blockquote is the
one block element that reads as an aside without needing a heading of its own. It also gives
the renderer's blockquote styling something to do on nearly every lesson, which is how the
formatting fix stays honest.

### Style the Markdown inside the renderer, not with a plugin or a global stylesheet

`Markdown`'s existing `components` map already overrides `a`. Extending that map with `h1`–`h4`,
`p`, `ul`/`ol`/`li`, `blockquote`, `strong`/`em`, `code` and `hr`, each carrying explicit
Tailwind classes built from Immersion Cinema tokens, puts the styling in the same file as the
renderer and makes it assertable from a component test.

*Alternative — add `@tailwindcss/typography`:* rejected. It needs a new dependency (approval
required), and `prose-slate` would then have to be beaten back into the Cinema palette with a
long chain of `prose-headings:`/`prose-a:` modifiers, which is more configuration than the
nine element rules it replaces.

*Alternative — a `.lesson-prose` block in `globals.css`:* rejected. It splits the renderer's
appearance across two files with no import linking them, and descendant selectors would leak
into anything else that lands inside the container.

*Accepted consequence:* the styling is per-element and explicit, so a Markdown element nobody
styled falls back to the user-agent default. The nine handled above cover every construct the
corpus uses; anything new is a visible, fixable gap rather than a silent one.

### `Markdown` moves to `src/components/lesson-notes/markdown/markdown.tsx`

The components layer's invariant is that folder name, entry file name and exported component
name agree. `lesson-notes/markdown.tsx` exporting `Markdown` does not satisfy it. The file is
being substantially reworked anyway and has exactly one importer, so the move is a two-line
cost taken now rather than left as a known deviation.

### The content rule becomes a test, not a script

`scripts/verify-notes-shape/verify-notes-shape.ts` exposes a pure
`notesShapeViolations(entries)` that takes `{ path, markdown }` records and returns a list of
human-readable violations (missing language section, title-only body, no `###` sub-heading
inside a language section). A colocated Vitest file unit-tests it against fabricated inputs
and then feeds it the real Basic Course corpus read from disk.

Living in `pnpm test:run` — already part of `pnpm verify` — means the guard runs on every
change with no new package.json script and no new CI wiring. Keeping the rule as a pure
function keeps the unit tests Fast, Independent and Repeatable; only the one corpus test
touches the filesystem.

## Risks / Trade-offs

- **[A rewritten body accidentally alters a `#` title, silently rewriting the manifest]** →
  The conformance checker asserts the first heading of each file, and the task list carries an
  explicit `git diff` gate: the only lines changed above the first `##` must be none. `pnpm
  sync:manifest` output is checked to be unchanged before archiving.
- **[48 hand-written bilingual bodies drift in quality or the two columns diverge]** → The
  scaffold is fixed and the mirror rule is specified; the checker enforces the structural half
  (both sections present, both carrying a `###` sub-heading). The semantic half — that the two
  columns say the same thing — is verified by reading them side by side in the browser, which
  is exactly what the Notes tab's two-column layout makes cheap.
- **[Per-element Tailwind classes rot as the theme evolves]** → They are built from theme
  tokens (`text-foreground`, `text-gold`, `border-border`), so a token change carries through.
  A raw color would not, and none is used.
- **[The corpus test couples a unit test run to files under `public/`]** → Accepted, and
  scoped: one test, 48 small text files, no network. The alternative — a separate script — is
  a guard that only runs when someone remembers to run it.
- **[Phonetic content is asserted by an author who is not the course's teacher]** → Bodies
  elaborate only on what each lesson's existing blurb and title already state; the spec makes
  "introduce no new claims" a requirement, and the common-error notes stay within
  well-established Spanish-to-English substitutions.

## Migration Plan

Content and renderer are independent and are landed in that order: the conformance test goes
red first, the 48 bodies turn it green, then the renderer work makes the new structure
visible. Rollback is `git revert` of a single squashed commit range on a feature branch; no
data, no schema, no deployed state is involved. `src/content/basic-course.json` is unchanged
throughout, so no re-seed and no cache invalidation is required.

## Testing strategy

| Behavior                                                                                   | Layer                            | File / pattern mirrored                                                    |
| ------------------------------------------------------------------------------------------ | -------------------------------- | -------------------------------------------------------------------------- |
| `notesShapeViolations` flags a missing language section, a title-only body, a missing `###` | Vitest unit                      | new `scripts/verify-notes-shape/verify-notes-shape.test.ts`, mirroring `scripts/verify-content.test.ts` |
| Every Basic Course `readme.md` on disk conforms                                             | Vitest unit (reads `public/`)    | same file, separate `describe`                                             |
| Every Basic Course `readme.md` splits into two columns                                      | Vitest unit                      | same file, asserting `splitBilingualNotes` returns `kind: "split"`         |
| `Markdown` styles headings, lists, blockquotes, emphasis, code, rules                       | Vitest component + RTL           | existing `src/components/lesson-notes/markdown.test.tsx`, moved            |
| `Markdown` still rejects raw HTML                                                           | Vitest component + RTL           | existing case in that file, kept                                           |
| `LessonNotesTabs` carries no typography classes on the notes container                      | Vitest component + RTL           | existing `lesson-notes-tabs.test.tsx`                                      |
| An enriched lesson renders as two columns with visible hierarchy                            | Storybook + Playwright MCP (manual visual check) | `lesson-notes-tabs.stories.tsx` fixture, plus a browser pass on a real lesson page |

No Playwright spec is added: nothing here is a browser flow. The two-column split and the
element styling are both reachable from RTL, and the visual confirmation is a review step
against the running app, not a regression suite.
