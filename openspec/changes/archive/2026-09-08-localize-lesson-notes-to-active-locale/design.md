## Context

The Notes tab is the last surface in the app that ignores the learner's language choice.
`LessonNotesTabs` calls `splitBilingualNotes(markdown)`, which returns
`{ kind: "split", es, en }`, and paints two columns under hard-coded "Español" / "English"
labels. The lesson bodies it reads live in 120 `readme.md` files under
`public/local-filesystem-lesson/`, each carrying exactly `## 🇪🇸 Español` and
`## 🇺🇸 English` sections; no file carries Portuguese.

Three constraints shape the design:

- **The splitter is purely presentational.** It has no domain, no ports and no I/O, and it
  must stay that way — the locale is a rendering concern, not a repository concern. The
  notes adapter keeps returning the whole `readme.md` body.
- **The content is machine-checked.** `scripts/verify-notes-shape/verify-notes-shape.ts`
  already enforces both halves of the content requirement: `notesShapeViolations` (each
  language section opens with a `###` sub-heading and carries prose) and `mirrorViolations`
  (the sections share a block skeleton and the same example words). Both are written for
  exactly two sections and for Spanish/English labels, so both must generalize before they
  can guard the Portuguese work.
- **Portuguese content is authored, not translated mechanically.** The course teaches
  English pronunciation to Spanish speakers, and several passages attribute a difficulty to
  Spanish specifically. Those passages cannot be copied across with the language name
  swapped — that would assert things about Portuguese phonology the lesson never taught.

## Goals / Non-Goals

**Goals:**

- The Notes tab renders exactly one language — the app's active locale — full width, with
  no column labels and no language control of its own.
- A defined fallback (active locale → English → Spanish → whole body) means no lesson ever
  renders an empty panel, whatever its notes happen to contain.
- Every lesson notes body carries a Portuguese section that mirrors the Spanish and English
  ones in structure and teaching content.
- The content checkers understand three languages, so the Portuguese work is verified
  mechanically rather than by eye across 120 files.

**Non-Goals:**

- A notes-only language switcher, a "read in another language" affordance, or a diff view.
- Localizing lesson titles, module titles or descriptions (they live in the catalog
  manifests, not in `readme.md`).
- Touching the notes repository, the blob store, or the notes cache.
- Making the recognized language set configurable at runtime.

## Decisions

### 1. The splitter becomes a locale selector, and is renamed

`splitBilingualNotes(markdown): BilingualNotes` becomes
`selectNotesForLocale(markdown, locale): string`, in a new folder
`src/components/lesson-view/select-notes-for-locale/`. The old folder is deleted.

*Why a rename rather than an added parameter:* the name `splitBilingualNotes` describes the
old behavior — there is no split any more, and "bilingual" is wrong the moment a third
language exists. Keeping the name would leave the codebase's most-read description of this
transform lying about what it does (`clean-code`: intention-revealing names). The
folder-per-entity rule makes the rename a folder move, so nothing is left half-renamed.

*Why a plain `string` return:* the caller no longer branches on a `kind`. The union existed
to tell "two columns" from "one column"; with one column always, the discriminant carries no
information and every consumer would immediately unwrap it. A `string` — empty only when the
notes are empty — is the whole contract.

*Alternative considered:* returning `{ language, body }` so the panel could label the body.
Rejected: the spec says the panel carries no language label, so the label would be dead data.

### 2. Language detection widens to three locales, matched by label regex

`languageOf(headingText)` keeps its shape and gains a Portuguese arm. The label patterns
stay deliberately loose — each language named in any of the three languages' words, with or
without a flag emoji:

| Locale | Pattern matches |
| ------ | --------------- |
| `es`   | `español`, `espanol`, `spanish`, `espanhol` |
| `en`   | `english`, `inglés`, `ingles`, `inglês` |
| `pt`   | `português`, `portugues`, `portuguese`, `portugués` |

*Order matters in one place:* `portugués`/`portugues` (Spanish for Portuguese) must not be
mistaken for a Spanish heading. The patterns are anchored on the language **name**, not on a
substring of it, and Portuguese is tested before Spanish so `## Portugués` resolves to `pt`.
The unit tests pin this.

### 3. Fallback is a lookup order, not a chain of `??` at the call site

`selectNotesForLocale` collects every language section into a
`Partial<Record<Language, string>>` — the existing `toLanguageSections` already does this —
and then walks a single ordered list: the requested locale, then `en`, then `es`. If nothing
matches, it returns the trimmed original body. The order lives in one named constant so the
spec's rule is readable in one line rather than inferred from nested conditionals.

*Alternative considered:* making the fallback the caller's business, so the component could
show a "not available in your language" notice. Rejected for now — it was offered and the
answer was a silent fallback, and a notice would be visible on every lesson under `pt` until
the content lands, which is noise once the content lands in this same change.

### 4. The component reads the locale from `next-intl`, not from props

`LessonNotesTabs` is already a client component and already calls `useTranslations`. It
gains `useLocale()` from the same import. The locale is not threaded through
`LessonView` → `LessonNotesTabs` as a prop.

*Why:* every other locale-sensitive component in the codebase (`LocaleSwitcher`,
`SiteHeader`) reads the locale from `useLocale()`, and `AGENTS.md` says so explicitly. A
prop would create a second source of truth that a caller could get wrong.

*Test consequence:* `lesson-notes-tabs.test.tsx` already mocks the whole `next-intl` module
(`vi.mock("next-intl", () => ({ useTranslations: vi.fn() }))`). That mock gains `useLocale`,
following the pattern already used in `site-header.test.tsx` and
`locale-switcher.test.tsx`.

### 5. `mirrorViolations` generalizes from a pair to a list

Today it destructures `const [first, second] = languageSectionsOf(markdown)` and compares
two skeletons. It becomes: compare every section against the first one, reporting the first
mismatch per file. A body with fewer than two sections is still passed over — a missing
section is `notesShapeViolations`' business.

`EXAMPLES_LABEL` — the bold label introducing a lesson's example words — gains its
Portuguese spellings (`Você ouve em`, `Pratique com`) alongside the Spanish and English
ones, or the Portuguese section's example words read as empty and the mirror check passes
vacuously.

`LANGUAGE_LABEL` in the same file widens the same way `languageOf` does, so a
`## 🇧🇷 Português` section is collected rather than skipped.

### 6. Authoring the 120 Portuguese sections

Each file gains one `## 🇧🇷 Português` section, appended after the English section, with the
same block skeleton (sub-heading, paragraphs, labelled lists, blockquote, closing line) and
the same italicized example words — those are English words being taught, and stay identical
across all three sections. `mirrorViolations` is the acceptance check for the skeleton;
reading is the acceptance check for the prose.

Where the Spanish section attributes an error to Spanish speakers ("El error típico en
español…"), the Portuguese section addresses Portuguese speakers about the same *teaching
point* without importing the claim about Spanish. Where the contrast genuinely differs
between the two languages, the Portuguese section states the point without naming a
first-language mechanism the lesson does not teach. This is the one part of the work a
checker cannot settle, and it is why the delta spec states the rule explicitly.

The 120 files are worked in batches, running the checkers after each batch, so a formatting
mistake surfaces within a few files rather than at the end.

### 7. The unused message keys are removed

`Components.LessonTabs.spanish` and `.english` exist only to label the two columns. With the
columns gone they are dead keys in three locale files, and a dead key is a key a future
translator has to ask about. They are removed from `en`, `es` and `pt`.

## Risks / Trade-offs

- **A Portuguese section that mirrors the Spanish one too literally states something false
  about Portuguese** (the schwa, nasal vowels and vowel reduction behave differently in
  Portuguese than in Spanish) → the delta spec forbids transplanting first-language claims,
  and every passage that names Spanish as the source of interference is rewritten rather
  than translated. Flagged for human review at verify time: this is the part of the change
  a green test suite does not prove.
- **The mirror checker enforces a skeleton, which can push the Portuguese prose into
  awkward shapes** to keep block counts equal → the skeleton is coarse (sub-heading, list,
  quote, label, paragraph), so it constrains structure, not wording. Where Portuguese
  genuinely needs a different structure, the right move is to change all three sections, not
  to weaken the checker.
- **`useLocale()` in a client component breaks existing component tests that mock
  `next-intl` wholesale** → the mock is extended in the same commit as the component change;
  the failing test is what drives it (TDD).
- **Only 48 of the 120 Portuguese sections reach the repository.** `.gitignore` tracks
  the Basic Course's text assets and ignores the rest of the content root, so the
  Advanced Course's 72 `readme.md` files — their existing Spanish and English sections
  included — live only on the machine that holds the content tree. The whole-catalog
  corpus check therefore reads only the notes files present on disk and degrades to the
  Basic Course on a fresh clone or in CI; hard-coding 120 would turn a correct fresh
  clone into a red build.
- **120 content files in one change is a large diff to review** → the `#` title heading of
  every file is untouched byte-for-byte, so the seed generator's title derivation cannot
  drift, and the checkers run over the whole tree at the end.
- **Stories and the visual check.** Removing the column labels changes the Notes panel's
  look; the Storybook stories encode the old two-column expectation. They are rewritten to
  one story per locale, and the result is verified in the browser rather than asserted.

## Migration Plan

No data migration and no deploy step. The change is a code edit plus content edits, both
shipped together, so no state exists in which the component expects Portuguese sections
that the content does not yet carry. Rollback is a revert of the branch.

## Testing strategy

| Behavior | Layer | File / pattern mirrored |
| -------- | ----- | ----------------------- |
| A locale selects its own section; the language heading is dropped; nested `###`/`####` and lists survive; section order in the file is irrelevant | Vitest unit | new `src/components/lesson-view/select-notes-for-locale/select-notes-for-locale.test.ts`, rewritten from the existing `split-bilingual-notes.test.ts` |
| Fallback order: missing locale → English; missing locale and English → Spanish; no language section → whole body; empty input → empty string | Vitest unit | same file |
| `## Portugués` (Spanish spelling) resolves to `pt`, not to `es` | Vitest unit | same file |
| The Notes panel renders one language for the active locale, shows neither other language, and shows no "ESPAÑOL"/"ENGLISH" label | Vitest component + RTL | existing `lesson-notes-tabs.test.tsx`, extending its `vi.mock("next-intl", …)` with `useLocale` as in `site-header.test.tsx` |
| Transcript stays disabled and reveals only the notice; no raw HTML is injected | Vitest component + RTL | existing tests in `lesson-notes-tabs.test.tsx`, kept |
| `notesShapeViolations` validates a Portuguese section like the other two; `mirrorViolations` compares three sections and flags a Portuguese section with an extra bullet, a missing sub-heading, or different example words | Vitest unit | existing `scripts/verify-notes-shape/verify-notes-shape.test.ts`, adding cases in its established style with `@faker-js/faker` prose |
| Every lesson `readme.md` in the tree conforms and mirrors across three sections | Ad-hoc `tsx` run of the two checkers over the content tree | the same way the checkers were used in `2026-09-08-enrich-basic-course-notes` |
| The Notes panel in a real browser under `/en`, `/es` and `/pt` | Playwright MCP visual check + Storybook | per `CLAUDE.md`: the visual check is performed here, not handed back |

No new Playwright e2e spec: the behavior is a component-level render decision that RTL
covers, and the existing e2e suite does not assert notes content.

## Open Questions

None. The two decisions that were open — how far Portuguese support goes (author all 120
sections now) and what an absent locale section falls back to (English, then Spanish) —
were settled before this document was written.
