## 1. Make the notes-shape rule executable

- [x] 1.1 (TDD: test → impl) Write `scripts/verify-notes-shape/verify-notes-shape.test.ts` with fabricated Markdown inputs covering: a conformant bilingual body passes; a body with no `##` language heading is flagged; a title-only body is flagged; a language section with no `###` sub-heading is flagged; a monolingual body with one language section passes. Use `@faker-js/faker` for arbitrary prose. Run it — it fails because the module does not exist.
- [x] 1.2 (TDD: impl) Implement `scripts/verify-notes-shape/verify-notes-shape.ts` exporting a pure `notesShapeViolations(entries: ReadonlyArray<{ path: string; markdown: string }>): string[]`, JSDoc'd per `jsdoc-typescript-docs`. Green.
- [x] 1.3 (TDD: test → content) Add a `describe("the basic-course corpus")` block to the same test file that reads every `readme.md` under `public/local-filesystem-lesson/basic-course/**` (excluding the course-root `readme.md`) and asserts `notesShapeViolations` returns `[]`. Run it — it fails, listing all 48 lessons.
- [x] 1.4 (TDD: test → content) In the same block, assert `splitBilingualNotes` returns `kind: "split"` for every lesson body. Run it — red for all 48.
- [x] 1.5 (TDD: test → content) In the same block, snapshot each file's first `#` heading against the `title` recorded in `src/content/basic-course.json` for that lesson, so a rewritten body that alters a title fails immediately. Run it — green today; it is the regression guard for group 2.

## 2. Rewrite the Basic Course lesson notes

Every task below applies the scaffold in `design.md` § "Editorial strategy", keeps each file's
first `#` heading byte-for-byte identical, and mirrors the two language columns.

- [x] 2.1 (TDD: tests from 1.3–1.5 are the red) Module 1 — `1-introduction/1-introduction/readme.md` (currently title-only): write both language sections using the **practice** variant.
- [x] 2.2 Module 2 Vowels, monophthongs — the 12 lessons `1-the-vowel-sound-schwa`, `2-the-vowel-sound-ih`, `3-the-vowel-sound-uu`, `6-the-vowel-sound-ae`, `7-the-vowel-sound-ah`, `8-the-vowel-sound-aw`, `10-the-vowel-sound-eh`, `11-the-vowel-sound-u`, `12-the-vowel-sound-i` plus the contrast lessons `4-schwa-or-strut`, `5-the-weak-vowel-merger`, `9-the-cot-caught-merger` — **sound** variant.
- [x] 2.3 Module 2 Vowels, diphthongs — `13-diphthong-sound-ai`, `14-diphthong-sound-au`, `15-diphthong-sound-oi`, `16-diphthong-sound-ei`, `17-diphthong-sound-ou` — **sound** variant, with the glide described as a movement between two positions.
- [x] 2.4 Module 3 Consonants, lessons 1–9 (`1-activar-las-cuerdas-vocales`, `2-consonantes-plosivas-y-de-parada`, `3-r`, `4-flap`, `5-vocales-roticas`, `6-dark-l-part-1`, `7-dark-l-part-2`, `8-sh`, `9-ch`) — **sound** variant.
- [x] 2.5 Module 3 Consonants, lessons 10–18 (`10-zh`, `11-dzh`, `12-th-voiceless`, `13-th-voiced`, `14-interdental-d-t`, `15-s`, `16-z`, `17-f`, `18-v`) — **sound** variant.
- [x] 2.6 Module 3 Consonants, lessons 19–25 (`19-n`, `20-m`, `21-ng`, `22-w`, `23-j`, `24-h`, `25-x`) — **sound** variant.
- [x] 2.7 Module 4 rhythm drills (4 lessons) and Module 5 fluency (1 lesson) — **practice** variant.
- [x] 2.8 Run the group-1 tests: all three corpus assertions green, no title changed.
- [x] 2.9 Confirm the manifest is untouched — `pnpm sync:manifest` produces no diff in `src/content/basic-course.json`, and `git diff --stat src/` shows no manifest change.

## 3. Make the Notes tab render Markdown formatting

- [x] 3.1 Move `src/components/lesson-notes/markdown.tsx` → `src/components/lesson-notes/markdown/markdown.tsx` and its test alongside it with `git mv`; update the single importer in `lesson-notes-tabs.tsx`. Run `pnpm test:run` — green, nothing else changed.
- [x] 3.2 (TDD: test → impl) Extend `markdown/markdown.test.tsx` with failing cases asserting the rendered elements carry styling: `h1`–`h4` each render with a class attribute distinguishing them from `p`; `ul`/`ol` render list markers; `li`, `blockquote`, `strong`, `em`, `code` and `hr` each render with classes. Red.
- [x] 3.3 (TDD: impl) Extend the `components` map in `markdown.tsx` with the element renderers, classes built from Immersion Cinema tokens per `design.md`. Keep the existing `a` styling and the no-raw-HTML guarantee. Update the component JSDoc to state that typography lives here. Green.
- [x] 3.4 (TDD: test → impl) Add a failing case to `lesson-notes-tabs.test.tsx` asserting the notes container carries no `prose*` class name. Red, then delete the `PROSE` constant and its usages in `lesson-notes-tabs.tsx`. Green.
- [x] 3.5 Update `lesson-notes-tabs.stories.tsx` so its bilingual fixture is a real enriched Basic Course body (sub-heading, list, blockquote, emphasis), and confirm the story renders correctly in `en`, `es` and `pt` via the toolbar locale switcher.

## 4. Verify

- [x] 4.1 Review the rendered Notes tab in Storybook with Playwright MCP: two columns, heading hierarchy visible, list markers present, blockquote distinct, dark surface readable.
- [x] 4.2 Review a real lesson page in the running app with Playwright MCP — `2-vowels/1-the-vowel-sound-schwa` and one practice lesson — at desktop and at a narrow viewport, confirming the two columns stack rather than overflow.
- [x] 4.3 Read the Spanish and English columns of three lessons side by side and confirm they are mirrors — same sub-heading, same example words, same error note.
- [x] 4.4 Run `pnpm verify` (typecheck, format:check, lint, test:run) and fix any failure at its root.
- [x] 4.5 Confirmed no e2e spec asserts on notes markup (they assert tab roles only, against the advanced course); ran `pnpm test:e2e --project=chromium` against the dev server anyway — 83/83 pass.

## 5. Make the mirror requirement executable (found during verify)

The `course-content-storage` delta requires the two language sections to be mirrors and
carries a scenario for it, but nothing enforces the structural half. Without a guard, the
next content edit can silently make one column poorer than the other.

- [x] 5.1 (TDD: test → impl) Add failing cases to `verify-notes-shape.test.ts` for a `mirrorViolations` checker: matching sections pass; a section with an extra bullet, a missing sub-heading, or different example words is flagged.
- [x] 5.2 (TDD: impl) Implement and export `mirrorViolations` alongside `notesShapeViolations`, comparing the two sections' block skeletons and their italicized example words. Green.
- [x] 5.3 (TDD: test → verify) Assert `mirrorViolations` returns `[]` for the whole Basic Course corpus, and re-run `pnpm verify`.
