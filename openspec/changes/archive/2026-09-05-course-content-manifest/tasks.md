## 1. Manifest schema and loader

- [x] 1.1 (TDD: test → impl) `scripts/courses-manifest/courses-manifest.test.ts`: a
  minimal valid manifest parses; a missing `sequence` or `folder` rejects; malformed
  JSON rejects. Then create `scripts/courses-manifest/courses-manifest.ts` exporting
  a Zod `coursesManifestSchema` and `parseCoursesManifest(raw)`.
- [x] 1.2 (TDD: test → impl) Defaults: an entry with only `folder` and `sequence`
  resolves to `slug = slugify(folder)`, `title = humanize(slug)`, the generated
  `description`, and `language: "en"`. Implement `resolveCourseDeclaration`.
- [x] 1.3 (TDD: test → impl) Cross-entry validation: duplicate `slug` and duplicate
  `sequence` each reject with a message naming both entries.
- [x] 1.4 (TDD: test → impl) `loadCoursesManifest(sourceDir)`: returns `null` when
  the file is absent; throws naming the offending entry when a declared `folder`
  does not exist under `sourceDir`.
- [x] 1.5 (TDD: test → impl) Override values in `lessonTitleOverrides` containing
  `'` (U+0027) reject — the apostrophe rule moved from `title-overrides.test.ts`.
- [x] 1.6 JSDoc on every export per `jsdoc-typescript-docs`, carrying forward the
  rationale currently in the JSDoc of `title-overrides.ts` and
  `title-from-notes-modules.ts` (why an allowlist is per-module, why an override
  outranks a heading, why keys are paths).

## 2. Tracked example manifest

- [x] 2.1 (TDD: test → impl) Add a test asserting
  `scripts/courses.manifest.example.json` parses against
  `coursesManifestSchema`. Then write the file with the real current values:
  `folder`/`slug` `advanced-intermediate-course`, the committed title, description,
  `language: "en"`, `sequence: 2`, the current (empty) `SLUG_OVERRIDES`, every entry
  of `TITLE_FROM_NOTES_MODULES`, and every entry of `LESSON_TITLE_OVERRIDES` with
  the leading `advanced-intermediate-course/` segment stripped.

## 3. Parameterize slug resolution

- [x] 3.1 (TDD: test → impl) Extend `scripts/resolve-slug.test.ts` for
  `resolveSlug(rawName, overrides)`: override hit, override miss, empty map. Then
  change the signature and drop the `SLUG_OVERRIDES` import.
- [x] 3.2 (TDD: test → impl) `scripts/normalize-content-disk.test.ts`: the step
  never renames `courses.manifest.json` or `rename-manifest.json`, and neither
  appears in the emitted rename entries. Then update the normalizer.
- [x] 3.3 (TDD: test → impl) The normalizer selects the override map by matching an
  entry's top-level folder against the manifest's `folder` fields, and passes an
  empty map when there is no manifest or no match.

## 4. Multi-course generation

- [x] 4.1 (TDD: test → impl) In `scripts/generate-course-content-seed.test.ts`, add
  a fixture with no manifest and assert the output is the current single-course
  shape (defaults applied, first folder used). Then wire `loadCoursesManifest` into
  `buildSeed` behind that fallback.
- [x] 4.2 (TDD: test → impl) Two-course synthetic fixture: `buildSeed` returns both
  courses in `sequence` order and the module / lesson / resource collections hold
  the union, each row carrying the right `courseId` / `moduleId`. Then replace the
  `courseFolders[0]` walk with a loop over the resolved declarations.
- [x] 4.3 (TDD: test → impl) An undeclared folder under the content root is skipped,
  named on stderr, and generation exits zero — the `console.warn`-and-drop behavior
  is gone.
- [x] 4.4 (TDD: test → impl) Declared `title`, `description`, `language` and
  `sequence` reach the emitted `Course` verbatim; delete
  `CONTENT_COURSE_SEQUENCE` and the inline title/description/language literals.
- [x] 4.5 (TDD: test → impl) `titleFromNotesModules` and `lessonTitleOverrides` are
  read per course and applied, including the scoping case: two courses with a
  same-slug module where only one allowlists it. Assertions lifted from
  `title-overrides.test.ts`. Then route both through the manifest instead of the
  module-level constants.
- [x] 4.6 (TDD: test → impl) A malformed manifest, or one naming a missing folder,
  aborts `runGenerator` non-zero and leaves the existing output file untouched —
  mirroring the existing unresolved-key failure test.
- [x] 4.7 (TDD: test → impl) The renderer emits `seedContentCourses` and no longer
  emits `seedContentCourse` / `SEED_CONTENT_COURSE_ID`; assert against the
  fixture-generated output text.

## 5. Migrate consumers

- [x] 5.1 Regenerate the real seed
  (`pnpm vitest run scripts/regenerate-content-seed.test.ts`) and confirm the ONLY
  diff in `seed-content.ts` is the course-export rename — proof the migrated
  overrides are equivalent to the deleted modules.
- [x] 5.2 (TDD: test → impl) Update
  `use-case-dependencies.test.ts` for `[seedCourse, ...seedContentCourses]`, then
  update `use-case-dependencies.ts`.
- [x] 5.3 Update `e2e/home-course-ladder.spec.ts` and `e2e/course-catalog.spec.ts`
  to read from `seedContentCourses[0]` instead of `seedContentCourse` /
  `SEED_CONTENT_COURSE_ID`.

## 6. Remove the superseded modules

- [x] 6.1 Delete `scripts/slug-overrides.ts`, `scripts/title-overrides.ts`,
  `scripts/title-overrides.test.ts` and `scripts/title-from-notes-modules.ts`, and
  confirm no import of them survives (`pnpm typecheck`).

## 7. Documentation and git hygiene

- [x] 7.1 Rewrite the `slug-overrides.ts` and generator sections of
  `scripts/README.md` around the manifest: its location, its shape, how to add a
  course, and that the live file is untracked while the example is not.
- [x] 7.2 Add a comment above the `public/local-filesystem-lesson/` line in
  `.gitignore` recording that `courses.manifest.json` is deliberately covered by it
  and that `scripts/courses.manifest.example.json` is the tracked template.

## 8. Verification

- [x] 8.1 Run `pnpm verify` (typecheck, format:check, lint, test:run) and fix every
  failure at its root cause.
- [x] 8.2 Run `USE_COURSE_CONTENT_SEED=1 pnpm test:e2e` for the touched specs
  (`home-course-ladder`, `course-catalog`, `course-overview`, `lesson-page`) and
  confirm the home ladder and catalog still render both courses.
