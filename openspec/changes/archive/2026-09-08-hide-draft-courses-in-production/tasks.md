## 1. Manifest schema accepts `draft`

- [x] 1.1 (TDD: test → impl) In `src/adapters/persistence/content-manifest/course-manifest-schema/course-manifest-schema.test.ts`, add failing cases: a manifest omitting `draft` parses with `draft === false`; a manifest declaring `"draft": true` parses with `draft === true`; a manifest declaring `"draft": "yes"` throws `InvalidCourseManifestError` whose message names that course's slug.
- [x] 1.2 (TDD: impl) Add `draft: z.boolean().default(false)` to `CourseManifest` in `course-manifest-schema.ts`, with JSDoc stating that a draft course is withheld when the environment hides drafts, that it defaults to published, and that deleting the field publishes the course.

## 2. The visibility decision (pure)

- [x] 2.1 (TDD: test → impl) Create `src/adapters/persistence/content-manifest/visible-course-manifests/visible-course-manifests.test.ts` with failing cases for `shouldShowDraftCourses(env)` covering the whole decision table: unset and `NODE_ENV=development` → true; unset and `NODE_ENV=production` → false; empty string behaves as unset; `"1"`, `"true"`, `"TRUE"` → true; `"0"`, `"false"`, `"False"` → false; `"treu"` throws an error naming `SHOW_DRAFT_COURSES` and the value.
- [x] 2.2 (TDD: impl) Create `visible-course-manifests.ts` exporting `shouldShowDraftCourses(env: NodeJS.ProcessEnv): boolean` — pure, no `process.env` access — with JSDoc documenting the table and why an unrecognized value throws instead of defaulting to hidden.

## 3. The filter

- [x] 3.1 (TDD: test → impl) Extend `visible-course-manifests.test.ts` with failing cases for `visibleCourseManifests`: with drafts shown it returns every manifest in the same order; with drafts hidden it returns only the non-draft manifests, order preserved; a set with no drafts is returned unchanged either way. Build `CourseManifest` fixtures with `@faker-js/faker` for titles, descriptions and slugs; drive the branch by setting `process.env.SHOW_DRAFT_COURSES` in the test and restoring it after, mirroring the save/restore pattern in `use-case-dependencies.test.ts`.
- [x] 3.2 (TDD: impl) Add `visibleCourseManifests(courses)` to the same file — one argument, reading the flag via `shouldShowDraftCourses(process.env)` — with JSDoc explaining that filtering before the flatten is what makes every catalog surface consistent, and pointing at the removal recipe in this change's `design.md`.

## 4. Wire the filter into the catalog

- [x] 4.1 (TDD: test → impl) Extend `src/adapters/persistence/content-manifest/content-manifest.test.ts` with failing assertions over the real tracked catalog: every module, lesson row, resource row and notes key belongs to a course present in `contentCatalog.courses` (so a hidden course leaves nothing addressable behind).
- [x] 4.2 (TDD: impl) In `content-manifest.ts`, wrap the parse in `visibleCourseManifests(...)` and extend the module's `@remarks` to say that draft courses are withheld here, naming the capability.

## 5. Mark the Advanced course as a draft

- [x] 5.1 (TDD: test → impl) Add a failing assertion in `content-manifest.test.ts` (or a sibling test over `courseManifests`) that at least one tracked manifest declares `draft: true` and that its slug is `advanced-intermediate-course` — the one place the slug is allowed to appear outside `src/content/`, because it is asserting the content decision rather than implementing it.
- [x] 5.2 (TDD: impl) Add `"draft": true` to `src/content/advanced-intermediate-course.json`, next to `sequence`. Verify `src/content/basic-course.json` is byte-identical.

## 6. Document the flag

- [x] 6.1 Add a `SHOW_DRAFT_COURSES` block to `.env.example`: accepted values, that unset means `NODE_ENV !== "production"`, that it must be set to `1` when running e2e against a production build, and that deleting `"draft": true` from a manifest publishes that course without touching the flag.

## 7. Verify

- [x] 7.1 Confirm no module outside `src/content/` and outside the tests named above contains the string `advanced-intermediate-course` as part of the filtering or wiring (`grep -rn advanced-intermediate-course src/`; e2e specs and existing component fixtures are expected hits).
- [x] 7.2 Run `pnpm verify` (typecheck, format:check, lint, test:run) and fix every failure at its root.
- [x] 7.3 Run the six e2e specs that drive the Advanced course against a dev server (`PLAYWRIGHT_BASE_URL` per the project's e2e setup, `--workers=1`) and confirm they pass unchanged — drafts show in development.
- [x] 7.4 Verify in the browser with Playwright MCP: with the dev server the home shows both courses and the Advanced course overview loads; with `SHOW_DRAFT_COURSES=0` the home shows one card and `/en/courses/advanced-intermediate-course` renders the not-found state. Capture both.
