## 1. The shared rule (Vitest unit)

- [x] 1.1 `src/lib/continue-target/continue-target.test.ts`: every `continue-target` scenario — in order, finished record moves on, partly watched record kept, return to the start, record outside the list, partly watched furthest, first gap, course hand-over across lessons, untouched → `start`, all finished → `rewatch`, empty → `none` (TDD: test → impl)
- [x] 1.2 Implement `findContinueTarget` with JSDoc naming it the single source of truth and listing its callers; move `LearnerProgress` here and re-export it from `module-route`

## 2. Module overview delegates (refactor)

- [x] 2.1 `deriveModuleRoute` takes its current step from `findContinueTarget` (`start`/`continue` → current, `rewatch`/`none` → none); `module-route.test.ts` and `use-module-route.test.tsx` run unchanged and green (refactor under an existing net: test → impl)

## 3. Course overview

- [x] 3.1 `courseOverviewProgress` derives its continue target through `findContinueTarget` over the flattened course; the three red cases of `course-overview-rings` task 1.5 turn green, and that task is ticked (TDD: test → impl)
- [x] 3.2 Remove `selectInitialModuleIndex` from `src/lib/module-progress/`, its only caller now gone, with its tests (refactor: test → impl)

## 4. Catalog in learning order

- [x] 4.1 `find-course-catalog.test.ts`: a repository returning a course's lessons shuffled across modules yields slices ordered by module `sequence`, then lesson `sequence` (TDD: test → impl)
- [x] 4.2 Sort the slices in `makeFindCourseCatalog`

## 5. My learning

- [x] 5.1 `use-course-continue-target` hook test: an unfinished recorded video resolves to its own panel with no second round-trip; a finished one resolves the next video's location; all finished resolves the first video; pending while either round-trip runs (TDD: test → impl)
- [x] 5.2 Implement `useCourseContinueTarget` with JSDoc and `@see findContinueTarget`
- [x] 5.3 `my-learning-view.test.tsx`: with a finished recorded video, Resume and the lead lesson card open the next video and the lead card belongs to its module (TDD: test → impl)
- [x] 5.4 Wire `MyLearningView` so `ResumePanel` and `CourseProgressList` receive the continue target

## 6. Documentation

- [x] 6.1 `@see findContinueTarget` on `deriveModuleRoute`, `courseOverviewProgress` and `useCourseContinueTarget`; the lesson close card's JSDoc states that Up next is a different question

## 7. End-to-end (Playwright)

- [x] 7.1 My learning: open a lesson, mark it complete, open My learning → Resume opens the next video, and the course overview's continue tile offers the same video (TDD: test → impl)

## 8. Verification

- [x] 8.1 Run `pnpm verify` and `pnpm test:e2e` for `one-click-navigation`, `course-overview`, `watch-progress` and the My learning spec; check `/es/learning`, the course overview and a module overview in the browser after finishing a video
