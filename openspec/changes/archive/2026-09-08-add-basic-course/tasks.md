## 1. Manifest schema — `moduleTitleOverrides`

- [x] 1.1 (TDD: test → impl) In `scripts/courses-manifest/courses-manifest.test.ts`, add cases for `moduleTitleOverrides`: a valid table parses; a value containing `'` (U+0027) is rejected naming the key; an untrimmed value is rejected; an absent table resolves to `{}`. Then add the field to `CourseDeclaration`, `ResolvedCourse` and `resolveCourseDeclaration` in `scripts/courses-manifest/courses-manifest.ts`, reusing the existing `ReviewedTitle` schema.
- [x] 1.2 (TDD: test → impl) In `scripts/generate-course-content-seed.test.ts`, assert that a module named in `moduleTitleOverrides` is emitted with the override as its title and that a sibling module without an entry keeps its `humanize(slug)` title. Then apply the override in `appendModule` in `scripts/generate-course-content-seed.ts`.
- [x] 1.3 (TDD: test → impl) Assert that adding a module title override leaves that module's `id`, `slug` and `sequence`, and every lesson and resource key beneath it, unchanged.

## 2. Reshape script — pure notes transform

- [x] 2.1 (TDD: test → impl) Create `scripts/reshape-course-tree.test.ts` covering the exported notes transform as a pure string function: promotes the first line to a `#` heading; drops a following line equal to the module's display name; strips leading blank lines before choosing the title; emits no heading when the first line exceeds 120 characters; leaves an already-`#`-headed document unchanged. Then implement the transform in `scripts/reshape-course-tree.ts`.

## 3. Reshape script — tree moves

- [x] 3.1 (TDD: test → impl) Extend `scripts/reshape-course-tree.test.ts`, mirroring `scripts/normalize-content-disk.test.ts` (`mkdtempSync` root, `mkfile` helper): a dry run prints its plan and mutates nothing. Then implement the dry-run/`--apply` split.
- [x] 3.2 (TDD: test → impl) Test that `--apply` promotes a nested group folder to a sibling module at its declared new position and renumbers the modules that follow. Then implement module promotion.
- [x] 3.3 (TDD: test → impl) Test that files loose in a module folder are wrapped in a lesson folder, and that `<lesson>/resources/*` files are hoisted into `<lesson>/` and the emptied `resources` folder removed. Then implement both moves.
- [x] 3.4 (TDD: test → impl) Test that a lesson's `description.md` becomes `readme.md` with the transform from 2.1 applied, and that stray `.DS_Store` and placeholder `index.html` entries under the planned course are removed. Then implement.
- [x] 3.5 (TDD: test → impl) Test that re-running with `--apply` on an already-reshaped tree reports nothing and exits zero, that a move onto an existing path aborts non-zero before mutating that directory, and that a course folder with no plan entry is untouched. Then implement the idempotence and collision guards.
- [x] 3.6 Write the `basic-course` plan into `scripts/reshape-course-tree.ts`: promote `1 Vowels` → `2 Vowels` and `2 Consonants` → `3 Consonants` out of `2 American vowel & consonant sounds`, renumber `3 Ejercicios…` → `4 Ejercicios…` and `4 Fluidez y Velocidad` → `5 Fluidez y Velocidad`, wrap `1 Introduction`'s loose files in a `1 Introduction` lesson folder, hoist every `resources/`, adopt `description.md` as the notes filename.

## 4. Migrate the content root

- [x] 4.1 Run `pnpm tsx scripts/reshape-course-tree.ts` (dry run) and read the printed plan end to end — confirm every module, lesson, PDF and notes file is accounted for and nothing under `advanced-intermediate-course` appears.
- [x] 4.2 Run `pnpm tsx scripts/reshape-course-tree.ts --apply`, then confirm on disk that `basic-course` has exactly five module folders, each holding lesson folders only, and that no `resources/` or `description.md` remains.

## 5. Declare the course

- [x] 5.1 Add the `basic-course` entry to `public/local-filesystem-lesson/courses.manifest.json` with `sequence: 2`, its slug, title, description and language, and change the advanced course's `sequence` from `2` to `3`.
- [x] 5.2 Add the `slugOverrides` that give the IPA folders readable slugs (`8 ʃ` → `8-sh`, `9 tʃ` → `9-ch`, `10 ʒ` → `10-zh`, `11 dʒ` → `11-j`, `12 θ` → `12-th-voiceless`, `13 ð` → `13-th-voiced`, `21 ŋ` → `21-ng`, and the vowel/diphthong equivalents), then run `pnpm normalize:content` and check the dry-run plan before `pnpm normalize:content:apply`.
- [x] 5.3 Add `titleFromNotesModules` for `2-vowels`, `3-consonants`, `4-ejercicios-para-dominar-el-ritmo-en-ingles` and `5-fluidez-y-velocidad` — and deliberately not `1-introduction`.
- [x] 5.4 Add `moduleTitleOverrides` restoring the accents on the two Spanish module titles, and `lessonTitleOverrides` for the two lessons whose notes carry no title line.

## 6. Regenerate and confirm the advanced course is untouched

- [x] 6.1 Run `pnpm generate:content-seed` and confirm it reports two courses and exits zero with no unresolved keys.
- [x] 6.2 Diff `src/adapters/persistence/in-memory/seed/seed-content.ts` and confirm that every advanced-course row is unchanged except the single `sequence` integer on its `Course` row.
- [x] 6.3 Read the new basic-course rows: module titles, lesson titles, poster and source keys, and one resource row per hoisted PDF.
- [x] 6.4 Copy the live manifest to `scripts/courses.manifest.example.json` so the tracked template matches.

## 7. Verify

- [x] 7.1 Run `pnpm test:run`; then `pnpm verify` (typecheck, format:check, lint, tests) and fix any failure at its root cause.
- [x] 7.2 With `USE_COURSE_CONTENT_SEED=1`, drive the app in the browser via Playwright MCP: the home ladder shows the basic course at its rung, its course overview lists five modules with correct titles, a vowel lesson and a consonant lesson play with a poster, the Notes tab renders the migrated notes, and a PDF resource link resolves. Confirm the advanced course still renders from the same session.
