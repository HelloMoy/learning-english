## 1. The locale selector (pure logic)

- [x] 1.1 (TDD: test) Create `src/components/lesson-view/select-notes-for-locale/select-notes-for-locale.test.ts` with the cases the delta spec names: each of `es`/`en`/`pt` selects its own section from a three-language body; the `##` language heading is dropped; nested `###`/`####` sub-headings, lists and blockquotes survive; section order in the file is irrelevant; a heading with a flag emoji and a heading without one both match; `## Portugués` (the Spanish spelling) resolves to `pt`, not `es`; a `##` section naming no language is ignored; content above the first `##` (the `#` title) is discarded. Use `@faker-js/faker` for arbitrary prose. Run it — it fails, the module does not exist.
- [x] 1.2 (TDD: test) Add the fallback cases to the same file: a body with no section for the requested locale resolves to English; a body with neither the requested locale nor English resolves to Spanish; a body with no recognized language section returns the trimmed original Markdown; empty or whitespace-only input returns an empty string. Still red.
- [x] 1.3 (TDD: impl) Implement `src/components/lesson-view/select-notes-for-locale/select-notes-for-locale.ts` exporting `selectNotesForLocale(markdown: string, locale: string): string`, carrying over the level-2 heading scan from `split-bilingual-notes.ts`, widening language detection to `es`/`en`/`pt`, and resolving through one named fallback order (requested locale → `en` → `es` → whole body). JSDoc per `jsdoc-typescript-docs`; functions single-purpose per `clean-code`. Green.
- [x] 1.4 Delete `src/components/lesson-view/split-bilingual-notes/` (module and test) and update `src/components/lesson-view/index.ts` if it re-exports the old name. `pnpm typecheck` names every remaining caller.

## 2. The Notes panel (component)

- [x] 2.1 (TDD: test) Rewrite the notes cases in `src/components/lesson-view/lesson-notes-tabs/lesson-notes-tabs.test.tsx`: extend the existing `vi.mock("next-intl", …)` with `useLocale` (as `site-header.test.tsx` does), then assert that under `es` the panel shows the Spanish body and neither the English nor the Portuguese body; under `en` the English body alone; under `pt` the Portuguese body alone; that no "spanish"/"english" column label is rendered in any locale; and that a `pt` request against an ES/EN-only body renders the English body. Keep the existing Transcript-disabled and no-raw-HTML tests untouched. Red.
- [x] 2.2 (TDD: impl) Update `lesson-notes-tabs.tsx`: read `useLocale()`, call `selectNotesForLocale(markdown, locale)`, render one full-width `<Markdown>` panel, and delete the two-column grid, the `COLUMN_LABEL` constant and both column headings. Green.
- [x] 2.3 Rewrite `lesson-notes-tabs.stories.tsx` per `storybook-story-writing`: one story per locale (`parameters: { locale }`) over a three-language sample body, plus a story for a body missing the active locale's section that demonstrates the English fallback. Remove the story that existed to show the ES/EN split.
- [x] 2.4 Remove the now-unused `Components.LessonTabs.spanish` and `Components.LessonTabs.english` keys from `src/messages/en.json`, `es.json` and `pt.json`. `pnpm test:run` proves nothing still reads them.

## 3. The content checkers

- [x] 3.1 (TDD: test) Add cases to `scripts/verify-notes-shape/verify-notes-shape.test.ts`: `notesShapeViolations` recognizes a `## 🇧🇷 Português` section and flags it when it has no `###` sub-heading or no prose; `mirrorViolations` compares all three sections and flags a Portuguese section with an extra bullet, a missing sub-heading, or different example words; a two-section body still behaves as before. Red.
- [x] 3.2 (TDD: impl) Update `scripts/verify-notes-shape/verify-notes-shape.ts`: widen `LANGUAGE_LABEL` to Portuguese, generalize `mirrorViolations` from a destructured pair to "every section against the first", and add the Portuguese example-word labels (`Você ouve em`, `Pratique com`) to `EXAMPLES_LABEL`. Update the JSDoc that says "the two language sections". Green.
- [x] 3.3 Guard the whole catalog from the test suite instead of a throwaway runner: extend the corpus block of `verify-notes-shape.test.ts` to read both course manifests (120 declared notes files) and assert shape, mirroring, and one language section per locale. Baseline recorded: all 120 files fail the per-locale assertion, none fails shape or mirroring. The corpus reader skips notes files absent from disk, because `.gitignore` tracks only the Basic Course's text assets — verified by hiding `advanced-intermediate-course/` and re-running: 26/26 still green.

## 4. Portuguese notes content

Each task adds one `## 🇧🇷 Português` section per lesson `readme.md` in that module, after the English section, mirroring the block skeleton and the italicized example words of the other two, restating any Spanish-speaker claim for Portuguese speakers rather than transplanting it, and leaving the file's `#` title heading byte-for-byte unchanged. Run the checkers from 3.3 after each task.

- [x] 4.1 `basic-course/1-introduction` (1 lesson)
- [x] 4.2 `basic-course/2-vowels` (17 lessons)
- [x] 4.3 `basic-course/3-consonants` (25 lessons)
- [x] 4.4 `basic-course/4-ejercicios-para-dominar-el-ritmo-en-ingles` (4 lessons)
- [x] 4.5 `basic-course/5-fluidez-y-velocidad` (1 lesson)
- [x] 4.6 `advanced-intermediate-course/1-advanced-pronunciation-course` (2 lessons)
- [x] 4.7 `advanced-intermediate-course/2-advanced-vowel-pronunciation-in-american-english` (13 lessons)
- [x] 4.8 `advanced-intermediate-course/3-contractions-reductions` (5 lessons)
- [x] 4.9 `advanced-intermediate-course/4-key-sound-patterns-and-features` (1 lesson)
- [x] 4.10 `advanced-intermediate-course/5-sound-natural-american-intonation-essentials` (6 lessons)
- [x] 4.11 `advanced-intermediate-course/6-rules-for-speaking-fast-natural-in-english` (9 lessons)
- [x] 4.12 `advanced-intermediate-course/7-everyday-english-phrases-part-1-master-them` (7 lessons)
- [x] 4.13 `advanced-intermediate-course/9-speak-with-confidence-in-30-days` (13 lessons)
- [x] 4.14 `advanced-intermediate-course/10-the-practice-zone-sharpen-your-skills` (16 lessons)
- [x] 4.15 Run both checkers over the whole tree: zero shape violations and zero mirror violations across all 120 lesson bodies.

## 5. Verification

- [x] 5.1 Run `pnpm verify` (typecheck, format:check, lint, test:run) and fix every failure at its root cause. Typecheck, lint (0 errors) and `pnpm test:run` (1221/1221) are green; `prettier --check` over this change's paths is clean. `pnpm verify` as a whole still fails on 4 Prettier warnings in files belonging to the concurrent `show-watch-progress` change (`module-overview.test.tsx`, `module-showcase-card.test.tsx`, `use-complete-when-watched.test.ts`, `use-playback-position.test.ts`) — left untouched, they are not this change's to format.
- [x] 5.2 Visual check: the `Schwa /ə/ or Strut /ʌ/ ?` lesson opened under `/es`, `/en` and `/pt` renders one language — the active one — full width, with no `ESPAÑOL` / `ENGLISH` labels. Driven by a scratchpad Playwright script rather than Playwright MCP, whose browser profile was held by the concurrent session.
- [x] 5.3 Read a sample of the Portuguese sections against their Spanish counterparts: no Portuguese section mentions Spanish at all (mechanical sweep, 0 hits), and every `⚠️` warning is restated for Portuguese speakers — the schwa, dark-L, /v/, /h/, final-nasal and epenthetic-vowel passages are rewritten around Portuguese, not translated from the Spanish claim.
