## 1. Language section detection (pure logic, Vitest unit)

- [x] 1.1 Replace the block-count tests in `split-bilingual-notes.test.ts` with a failing test: a `# title` + `## Español` section + `## English` section splits into `{ kind: "split", es, en }`, with neither column carrying its `##` language heading (TDD: test → impl)
- [x] 1.2 Scan lines for level-2 headings (`/^##(?!#)\s*(.*)$/`), classify each heading's text as `es` / `en` / neither, and collect each section's body up to the next level-2 heading or EOF; return `split` when both languages are present (TDD: test → impl)
- [x] 1.3 Failing test: a language section containing `###` and `####` sub-headings plus bullet lists keeps every nested element inside its column, and the notes still split (TDD: test → impl)
- [x] 1.4 Failing test: the split is order-independent — `## English` before `## Español` still routes each body to the right language (TDD: test → impl)

## 2. Fallbacks (pure logic, Vitest unit)

- [x] 2.1 Failing test: notes with exactly one language section return `{ kind: "single" }` carrying that section's body with the `##` heading stripped (TDD: test → impl)
- [x] 2.2 Failing test: notes with no language section return `{ kind: "single" }` with the original Markdown unchanged; a level-2 section whose heading names no language is ignored, never merged into a neighbouring column (TDD: test → impl)
- [x] 2.3 Failing test: empty and whitespace-only input still return `{ kind: "single", markdown: "" }` (TDD: test → impl)
- [x] 2.4 Delete the `toBlocks` block-count path and the `HEADING` shift loop; update the module docblock to describe the language-section contract (no new test — covered by 1.1–2.3)

## 3. Notes tab wiring (component, Vitest + RTL)

- [x] 3.1 Move the `BILINGUAL` fixture in `lesson-notes-tabs.test.tsx` to the language-section shape and confirm the "Español" / "English" labelled columns still render their own language's text (TDD: test → impl)
- [x] 3.2 Confirm the existing single-column fallback, disabled-Transcript and no-raw-HTML tests still pass unchanged; adjust only fixtures, never assertions (TDD: test → impl)

## 4. Verification

- [x] 4.1 Confirm the real corpus splits: every bilingual `readme.md` under `public/local-filesystem-lesson/advanced-intermediate-course/` resolves to `kind: "split"`, and each monolingual one to `kind: "single"`
- [x] 4.2 Confirm no `#` title heading was touched and `git status` shows `src/adapters/persistence/in-memory/seed/seed-content.ts` unmodified after a generator run
- [x] 4.3 Run `pnpm test:run` (full unit suite) and `pnpm verify` (typecheck, format:check, lint, tests); no e2e run needed — this change adds no route or navigation behavior
