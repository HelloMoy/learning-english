## 1. Promote the basic course on the ladder

- [x] 1.1 (TDD: test → impl) Update the ladder-order test in `scripts/courses-manifest/courses-manifest.test.ts` to expect `basic-course` at `sequence: 1` and `advanced-intermediate-course` at `2`. Then set both integers in `public/local-filesystem-lesson/courses.manifest.json` and copy it to `scripts/courses.manifest.example.json`.
- [x] 1.2 Run `pnpm generate:content-seed` and confirm the `seed-content.ts` diff is exactly the two `sequence` integers — no id, slug, title, key, source name or notes key moves.

## 2. Make the content seed the only catalog

- [x] 2.1 (TDD: test → impl) In `use-case-dependencies.test.ts`, delete the `isCourseContentSeedEnabled` describe block and every A1 assertion, and rewrite the catalog tests to expect exactly `seedContentCourses` in `sequence` order with no env var set. Then delete `isCourseContentSeedEnabled`, the boolean parameter and the A1 branch from `use-case-dependencies.ts`, binding `courses`, `modules`, `lessons` and `resources` to the content seed alone.
- [x] 2.2 (TDD: test → impl) Assert that `lessons.byId` resolves an id from the content seed and returns `null` for an unknown id with the ports bound directly. Then bind `lessonsRepo` and `resourcesRepo` to `LocalFilesystemLessonRepository` / `LocalFilesystemResourceRepository` without a composite.
- [x] 2.3 Delete `src/adapters/persistence/composite/composite-lesson-repository/` and `src/adapters/persistence/composite/composite-resource-repository/` with their tests, and confirm nothing imports them.
- [x] 2.4 Delete `src/adapters/persistence/in-memory/seed/seed.ts`.

## 3. Retire the environment flag

- [x] 3.1 Remove `USE_COURSE_CONTENT_SEED` from `.env` and `.env.example`.
- [x] 3.2 Drop it from the `webServer.command` in `playwright.config.ts`.
- [x] 3.3 Update the `USE_COURSE_CONTENT_SEED` section of `scripts/README.md` to say the content root is required rather than opted into, and fix the four e2e spec docstrings that mention the flag.

## 4. Repoint the remaining A1 consumers

- [x] 4.1 Give `src/components/course-navigator/course-navigator.stories.tsx` its own course-and-modules fixture instead of importing the deleted seed, and confirm the story renders in Storybook.
- [x] 4.2 (TDD: test → impl) Rewrite `e2e/home-course-ladder.spec.ts` against `seedContentCourses` / `seedContentModules`: two cards in ladder order, "2 levels, in order", "2 courses", ordinals `Level 1` / `Level 2`, and the continue-watching round trip driven by a content-seed lesson. This spec is currently RED — it asserts the pre-basic-course catalog.

## 5. Verify

- [x] 5.1 Run `pnpm verify` (typecheck, format:check, lint, Vitest) and fix any failure at its root cause.
- [x] 5.2 Run `pnpm test:e2e` and confirm the ladder spec passes; note any failure that predates this change rather than folding it in silently.
- [x] 5.3 Drive the app in the browser via Playwright MCP: the home shows Basic Course at Level 1 and Advanced Intermediate Course at Level 2, both course overviews load, and a lesson plays with its notes and resources. Confirm the deleted A1 route no longer resolves.
