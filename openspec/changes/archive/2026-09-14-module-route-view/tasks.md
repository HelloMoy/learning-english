## 1. Route state (pure logic)

- [x] 1.1 `splitRuntime(seconds)` returns `{ hours, minutes }` rounded to the minute in `src/lib/module-route/module-route.ts` (TDD: test → impl)
- [x] 1.2 `deriveModuleRoute` marks lessons finished via `countsAsComplete`, including a position past the finish threshold without the button (TDD: test → impl)
- [x] 1.3 `deriveModuleRoute` picks the first unfinished lesson in `sequence` order as current, none when all are finished, and never a later partly watched lesson (TDD: test → impl)
- [x] 1.4 `deriveModuleRoute` returns `finishedCount`, `lessonCount` and `secondsLeft` discounting partial progress and ignoring reading lessons' duration (TDD: test → impl)
- [x] 1.5 JSDoc on the exported functions and types

## 2. Hook

- [x] 2.1 `useModuleRoute` reports progress as not read before hydration and the derived state after, and updates when stored progress changes (TDD: test → impl)
- [x] 2.2 JSDoc on the hook

## 3. Copy

- [x] 3.1 Add the `CourseCatalog.moduleOverview` keys from design D8 to `src/messages/en.json`, `es.json` and `pt.json`

## 4. Presentational components

- [x] 4.1 `ModuleRouteStep` upcoming form: thumbnail (poster or gradient fallback, hidden from a11y), `Video N · M min`, title, "Watch video" action as the single link with stretched hit area (TDD: test → impl)
- [x] 4.2 `ModuleRouteStep` finished form: no thumbnail, muted title, "Watch again" action, finished marker with localized accessible name (TDD: test → impl)
- [x] 4.3 `ModuleRouteStep` current form: poster card, "You are here · Video N", bar and minutes left with "Continue" when partly watched, no bar and "Start" when not started, one link (TDD: test → impl)
- [x] 4.4 `ModuleRouteStep` rail marker and connector per state; reading lessons omit the minute label (TDD: test → impl)
- [x] 4.5 `ModuleProgressPanel`: decorative ring, percentage text, `N of M videos`, time left; completed label and no time left when finished; no figures when given no progress (TDD: test → impl)
- [x] 4.6 Stories for `ModuleRouteStep` (three states) and `ModuleProgressPanel` (in progress, completed, before progress) under `Components/`, rendering in `en`, `es`, `pt`
- [x] 4.7 JSDoc on both components and their props

## 5. Composition

- [x] 5.1 `ModuleRoute` renders the panel and ordered steps from `useModuleRoute`; first frame shows every step upcoming, no card, figure-less panel (TDD: test → impl)
- [x] 5.2 `ModuleOverview` rewrite: server header with eyebrow, title and videos-and-runtime line, no hero tile, back link, grid layout from design D4 mounting `ModuleRoute` (TDD: test → impl)
- [x] 5.3 Widen the page container to `max-w-7xl` in the module page
- [x] 5.4 Rewrite `module-overview.stories.tsx`; stories and JSDoc for `ModuleRoute`
- [x] 5.5 Remove `LessonCompletionMark` / `LessonWatchProgress` and unused message keys only if no caller remains

## 6. End-to-end

- [x] 6.1 `e2e/module-route.spec.ts`: seed storage for the Vowels module, featured card on the first unfinished video, panel figures, panel beside the route at 1440 and above at 390, no horizontal scroll, clicking a step body opens its lesson (TDD: test → impl adjustments)
- [x] 6.2 Re-run `one-click-navigation`, `course-overview` and `course-catalog` specs; update assertions that depended on the old rows

## 7. Verification

- [x] 7.1 Visual review in the browser at 1440px and 390px, dark theme, against the "E · Ruta" artboards
- [x] 7.2 `pnpm verify` (typecheck, format, lint, `pnpm test:run`) passes
- [x] 7.3 `pnpm test:e2e`

## 8. Current lesson follows the furthest progress

- [x] 8.1 `deriveModuleRoute` tests for the furthest-progress rule: skipping ahead features the next video after the furthest finished one, a partly watched furthest video is featured itself, reviewing an earlier video does not move the feature, nothing after the furthest falls back to the first unfinished, an untouched module features video 1 (TDD: test → impl)
- [x] 8.2 Implement the furthest-progress rule in `deriveModuleRoute` and update its JSDoc (TDD: test → impl)
- [x] 8.3 `pnpm verify`

## 9. Current lesson follows the last opened lesson

- [x] 9.1 `deriveModuleRoute` tests: the last opened lesson anchors the current one (unfinished → itself, finished → next unfinished after it, nothing after → first unfinished); a learner who returned to the start is featured the video after the one opened last; a last opened lesson outside the module falls back to the furthest progress (TDD: test → impl)
- [x] 9.2 Implement the anchor rule with an optional `lastOpenedLessonId` on `LearnerProgress`; update JSDoc (TDD: test → impl)
- [x] 9.3 `useModuleRoute` tests: not read until the continue-watching record is read; the record's lesson anchors the route; a record for another module does not (TDD: test → impl)
- [x] 9.4 Implement the record read in `useModuleRoute`; update JSDoc (TDD: test → impl)
- [x] 9.5 Update `ModuleRoute` and `ModuleOverview` component tests to wait for the asynchronous read
- [x] 9.6 `e2e/module-route.spec.ts`: a learner who finished 12–14, then went back and finished 1–2 with video 2 opened last, is featured video 3 (TDD: test → impl adjustments)
- [x] 9.7 `pnpm verify` and `e2e/module-route.spec.ts` pass and `e2e/module-route.spec.ts` pass for the specs in 6.1 and 6.2 passes with `--workers=1`
