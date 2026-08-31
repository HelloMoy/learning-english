## 1. Domain — schemas and ports

- [x] 1.1 Add `sequence` (positive int) to the `Course` schema and give both seeds a value (`seed.ts` → 1, `seed-content.ts` generator + output → 2) (TDD: test → impl)
- [x] 1.2 Add the `ContinueWatchingLocation` entity under `src/domain/entities/continue-watching-location/` (TDD: test → impl)
- [x] 1.3 Add the `ContinueWatchingRepository` port under `src/domain/ports/continue-watching-repository/` (type-only; covered by its adapters' tests)

## 2. Domain — use cases

- [x] 2.1 Order `InMemoryCourseRepository.listAvailable()` by `Course.sequence` (TDD: test → impl)
- [x] 2.2 Add `leadingModules` to `CourseCatalogEntry` in `findCourseCatalog`, capped at 3, in module `sequence` order, with no extra repository call (TDD: test → impl)
- [x] 2.3 Add the `findContinueWatching` use case and its `.errors.ts` (TDD: test → impl)

## 3. Adapters — persistence

- [x] 3.1 Add `CompositeLessonRepository` under `src/adapters/persistence/composite/composite-lesson-repository/` — first-hit `byId`, concatenating `listByCourse` (TDD: test → impl)
- [x] 3.2 Add `CompositeResourceRepository` under `src/adapters/persistence/composite/composite-resource-repository/` — same fan-out over `byId`, `listByLesson`, `listByModule`, `listByCourse` (TDD: test → impl)
- [x] 3.3 Add `BrowserLocalStorageContinueWatchingRepository` with an injected `Storage` seam, degrading to `null` on absent/corrupt/unavailable storage (TDD: test → impl)
- [x] 3.4 Rewire `getCoursePlatformDeps()` to assemble one graph: A1 seed always, content seed added under `USE_COURSE_CONTENT_SEED=1`, lessons and resources bound to the composites, `findContinueWatching` registered in `useCases` (TDD: test → impl)

## 4. Client composition roots

- [x] 4.1 Add the `use-continue-watching` hook — reads/writes the location through the browser adapter, memoized like `usePlaybackPosition` (TDD: test → impl)
- [x] 4.2 Add the `continueWatchingAction` server action in `src/app/[locale]/actions.ts` wrapping `findContinueWatching` behind a Zod input schema (TDD: test → impl)

## 5. Components

- [x] 5.1 Add `CourseLevelCard` — ordinal, state badge, title, description, leading modules with ordinals, `+N more`, counts badges, CTA (TDD: test → impl)
- [x] 5.2 Add `CourseLadder` — numbered track plus one `CourseLevelCard` per course in sequence order, marking the in-progress course after hydration (TDD: test → impl)
- [x] 5.3 Add `ContinueWatching` — reads the location, resolves it through the action, renders the panel with breadcrumb, title, progress and `Resume`; renders nothing when there is nothing to continue (TDD: test → impl)
- [x] 5.4 Add `RememberContinueWatching` — records the location on lesson-page mount through an injectable repository (TDD: test → impl)
- [x] 5.5 Add Storybook stories for `CourseLevelCard`, `CourseLadder` and `ContinueWatching`, following the existing `*.stories.tsx` pattern

## 6. Pages and i18n

- [x] 6.1 Add the new message keys to `en.json`, `es.json` and `pt.json` (`HomePage` section copy, `Components.CourseLevelCard`, `Components.CourseLadder`, `Components.ContinueWatching`) and retire the keys the featured rail owned
- [x] 6.2 Rewrite `src/app/[locale]/page.tsx` — hero, `ContinueWatching`, `CourseLadder` over every catalog entry; drop `FeaturedCourse` from the home (TDD: test → impl)
- [x] 6.3 Mount `RememberContinueWatching` on the lesson page (TDD: test → impl)
- [x] 6.4 Delete `FeaturedCourse` and its tests/stories once nothing imports it

## 7. Verification

- [x] 7.1 Add the e2e spec: `/en` lists both courses under `Available courses` in ladder order; a fresh profile shows no `Continue watching`; after opening a lesson and returning home the panel appears and `Resume` navigates back to that lesson (TDD: test → impl)
- [x] 7.2 Run `pnpm verify` (typecheck, format:check, lint, test:run) and fix every failure
- [x] 7.3 Run `pnpm test:e2e` for the home and lesson specs and fix every failure
- [x] 7.4 Drive `/en` in a real browser and confirm the rendered page matches the approved design in both themes
