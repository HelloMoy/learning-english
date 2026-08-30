## 1. Types and the shared resolver

- [x] 1.1 Define the raw row types (`LessonRow`, `ResourceRow`) next to the resolver — plain object shapes whose `source` / `poster` / `url` hold content keys. Derive them from the domain schemas where possible (`z.input`-style) so a domain field rename cannot silently pass. (TDD: types first, no test of their own — they are exercised by 1.3)
- [x] 1.2 Write failing unit tests for `resolveLessonRow` / `resolveResourceRow` in `src/adapters/persistence/local-filesystem/resolve-content-row/resolve-content-row.test.ts`, using a hand-written fake `BlobStore` returning `https://test.example/<key>`. Cases: video row resolves `source`; video row resolves `poster`; video row **without** `poster` leaves it absent and never calls `url` (design D3); reading row passes through untouched; a row resolving to an invalid URL throws the schema error. (TDD: test → impl)
- [x] 1.3 Implement `resolve-content-row.ts` — resolve key fields via `BlobStore.url`, then `Lesson.parse` / `Resource.parse`. Discriminate on `row.kind`, not on property presence. Make 1.2 pass. (TDD: test → impl)

## 2. Lesson and resource adapters

- [x] 2.1 Rewrite `local-filesystem-lesson-repository.test.ts` to construct the subject from rows + a fake `BlobStore`, keeping every existing ordering assertion (`listByCourse` sorts by `sequence`) unchanged as the regression net. Add: returned `source` carries the fake store's prefix. (TDD: test → impl)
- [x] 2.2 Change `LocalFilesystemLessonRepository` to take `{ rows, blobStore }` and resolve on read via `resolveLessonRow`. Rewrite the class doc comment, which currently states the opposite ("does not consult any BlobStore"). Make 2.1 pass. (TDD: test → impl)
- [x] 2.3 Rewrite `local-filesystem-resource-repository.test.ts` the same way, preserving the `listByLesson` filtering and `listByModule` / `listByCourse` "return everything" assertions. (TDD: test → impl)
- [x] 2.4 Change `LocalFilesystemResourceRepository` to take `{ rows, blobStore }` and resolve via `resolveResourceRow`. Rewrite its doc comment. Make 2.3 pass. (TDD: test → impl)

## 3. Notes adapter matches by key

- [x] 3.1 Add a failing test to `local-filesystem-lesson-notes-repository.test.ts`: build the adapter with a `BlobStore` whose base URL is NOT the default and assert the notes resource is still found. This returns `null` under the current implementation — confirm it fails before touching the source. (TDD: test → impl)
- [x] 3.2 Change `LocalFilesystemLessonNotesRepository` to take `resourceRows` instead of parsed `resources`, match on `${lessonId}:${key}`, and return `resolveResourceRow(row, blobStore)`. Delete the `#findMarkdownResource` fallback loop. Make 3.1 pass. (TDD: test → impl)

## 4. Generator emits keys

- [x] 4.1 Update `generate-course-content-seed.validation.test.ts` expectations from URL-shaped to key-shaped values, and add the spec's assertion that no emitted `source` / `poster` / `url` begins with `/local-filesystem-lesson`. (TDD: test → impl)
- [x] 4.2 Change `buildSeed` / `runGenerator` to emit bare keys and to export `seedContentLessonRows` / `seedContentResourceRows` (raw) while keeping `seedContentCourse` / `seedContentModules` parsed. Collapse the two `LocalFilesystemBlobStore` constructions to one used solely for `exists()` validation, with a comment saying its `baseUrl` is unused for emission. Make 4.1 pass. (TDD: test → impl)
- [x] 4.3 Update `generate-course-content-seed.test.ts` for the new export names and row shape. (TDD: test → impl)

## 5. Composition root

- [x] 5.1 Add failing tests to `use-case-dependencies.test.ts`: with the content seed active and no env override, a read yields `/local-filesystem-lesson/...`; with `CONTENT_BASE_URL` stubbed via `vi.stubEnv`, the same read yields the new prefix. Follow the existing `USE_COURSE_CONTENT_SEED` test pattern in that file. (TDD: test → impl)
- [x] 5.2 Read `CONTENT_BASE_URL` / `CONTENT_LOCAL_ROOT` inside `buildDeps` (per call, not module load), build one shared `BlobStore`, and branch: content seed → `LocalFilesystem*` adapters from rows; A1 seed → `InMemory*` adapters from entities. Make 5.1 pass. (TDD: test → impl)
- [x] 5.3 Add both vars to `.env.example` with their defaults documented. (No test — config documentation.)

## 6. Regenerate the seed

- [x] 6.1 Run `pnpm generate:content-seed` (ffprobe 8.1.2 confirmed present) and regenerate `seed-content.ts`. (No test — this is data.)
- [x] 6.2 Verify the regenerated seed: entry counts still 107 lessons / 10 modules / 1 course, and `git diff` touches only `source` / `poster` / `url` lines plus the export names. Any changed `id`, `slug` or `sequence` line means the generator changed something it should not have — stop and investigate. (Verification gate.)

## 7. Verification

- [x] 7.1 Run `pnpm verify` (typecheck + format:check + lint + test:run). All must pass.
- [x] 7.2 Boot `USE_COURSE_CONTENT_SEED=1 pnpm dev` and drive a lesson page with Playwright MCP: video element has a `/local-filesystem-lesson/` source that returns 200, poster renders, resource links resolve, notes tab renders markdown, and playback starts. This is the only check that the 2,700-line regenerated seed is actually correct.
- [x] 7.3 Re-run the same page with `CONTENT_BASE_URL` set to a different prefix and confirm the rendered URLs change without regenerating the seed — the payoff of the whole change, verified end to end.
- [x] 7.5 (added during 7.3) Derive `images.remotePatterns` in `next.config.ts` from `CONTENT_BASE_URL`. A remote prefix made every `next/image` poster 500 until the host was allowlisted, which falsified the "configuration alone" claim. See design.md §D8. (No unit test: `next.config.ts` is not importable under vitest; covered by the browser check.)
- [x] 7.4 Run `pnpm test:e2e` for the lesson-page area to confirm the A1-seed default path is untouched.
