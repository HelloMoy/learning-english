## 1. View model (Vitest unit)

- [x] 1.1 `src/lib/course-overview-progress/course-overview-progress.test.ts`: course tally, fraction and seconds left (TDD: test → impl)
- [x] 1.2 Module status (`completed` / `in-progress` / `not-started`), per-module seconds left and `isCurrent` (TDD: test → impl)
- [x] 1.3 Continue target: nothing watched → `start`; record in this course → that video; stale record or other course → first lesson in progress / first not started; everything watched → `rewatch` (TDD: test → impl)
- [x] 1.4 Implement `courseOverviewProgress` with JSDoc, reusing `moduleProgress`, `selectInitialModuleIndex` and `countsAsComplete`

- [x] 1.5 The continue target follows the module overview's route rule across the course (`deriveModuleRoute`): a completed recorded video continues with the next incomplete one, the last video of a lesson hands over to the next lesson, and without a record the furthest progress anchors (TDD: test → impl)

## 2. Copy

- [x] 2.1 Add the new `CourseCatalog.courseOverview` keys in `src/messages/{en,es,pt}.json` and update `messages.test.ts` expectations

## 3. Tiles (Vitest component + RTL)

- [x] 3.1 `lesson-ring-tile`: ordinal, title, ring percentage, status, "C/N · left", All watched, module link, one-video link, pending shape, no video titles (TDD: test → impl)
- [x] 3.2 `course-progress-tile`: h1 title, percentage, "C of N videos", time left, pending shape (TDD: test → impl)
- [x] 3.3 `continue-tile`: label and link per target kind, eyebrow position, artwork, pending placeholders (TDD: test → impl)
- [x] 3.4 Implement the three tiles with JSDoc and colocated stories (all states, `es`)

- [x] 3.5 `ProgressRing` gains an optional `glow` switch (default on, so its other users are unchanged); the lesson tile turns it off over artwork, where the glow's filter paints a dark square behind the ring (TDD: test → impl)

- [x] 3.6 On a phone the lesson row's artwork is as visible as the desktop band: drop the extra 12 % fade on the row layer and keep the title legible with a gradient instead (TDD: test → impl)

## 4. Board and page (Vitest component + RTL)

- [x] 4.1 `course-progress-board`: pending before hydration/record read; seeded completion + injected record drive the tiles; emphasized current lesson (TDD: test → impl)
- [x] 4.2 Implement `CourseProgressBoard` (client island) with JSDoc and story
- [x] 4.3 Rewrite `CourseOverview` to render the board; update `course-overview.test.tsx` and its story (TDD: test → impl)
- [x] 4.4 Reshape `loading.tsx` to the new layout; update `loading.test.tsx` (TDD: test → impl)

## 5. Removal

- [x] 5.1 Delete `course-carousel`, `lesson-progress-panel`, `module-poster` (components, stories, tests) after confirming no other readers
- [x] 5.2 Remove copy keys used only by them from `en`, `es`, `pt`

## 6. End-to-end (Playwright)

- [x] 6.1 Rewrite `e2e/course-overview.spec.ts` for tiles: order and artwork, tile → module overview, one-video tile → video, progress state with Continue, return from a lesson → Continue where you left off, no horizontal scroll at 390px (TDD: test → impl)
- [x] 6.2 Update `e2e/watch-progress.spec.ts` to read progress from the lesson tile (its unrelated "a lesson watched to its end reads full" case already fails on `main`: finished rows on the module overview render no progress bar since `fc2db4f`)
- [x] 6.3 Update `e2e/one-click-navigation.spec.ts`, which still drives the carousel's dots and selected poster, to open lessons from their tiles

## 7. Verification

- [x] 7.1 Run `pnpm verify` and `pnpm test:e2e e2e/course-overview.spec.ts e2e/watch-progress.spec.ts`; compare desktop and 390px in the browser against prototype 11 in `es` for new, in-progress and completed states (verify green; e2e 20/21 on chromium, the one failure being the pre-existing module-overview case noted in 6.2)
