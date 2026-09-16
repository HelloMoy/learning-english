## 1. The prize reaches the tiles

- [x] 1.1 `CourseProgressBoard` reads the claimed prizes once, beside the readings it already takes, and hands each lesson tile its module's prize with whether it is claimed, and the course tile the claimed-over-total tally counting only modules that hold lessons (TDD: RTL test → impl)

## 2. The lesson tile draws its prize

- [x] 2.1 `LessonRingTile` draws the module's prize on the artwork band opposite the ordinal: silhouette until claimed, coloured once claimed, hidden from assistive technology, adding no control and no tab stop (TDD: RTL test → impl)

## 3. The course tile states the prizes claimed

- [x] 3.1 `CourseProgressTile` states how many prizes are claimed out of the course's, draws each prize small in its own state, and says nothing about prizes until the reading arrives (TDD: RTL test → impl; copy under `CourseCatalog.courseOverview` in en/es/pt)

## 4. Stories

- [x] 4.1 `lesson-ring-tile.stories.tsx` and `course-progress-tile.stories.tsx` each gain a claimed and an unclaimed state (stories only)

## 5. End to end and review

- [x] 5.1 `e2e/course-overview.spec.ts`: a prize claimed on the device reads as claimed on the course overview, and the page still does not scroll sideways at 390px with the prizes present (TDD: spec red → green)
- [x] 5.2 Visual review with Playwright MCP of both surfaces, in both themes and at phone width
- [x] 5.3 Run `pnpm verify` and `pnpm test:e2e e2e/course-overview.spec.ts e2e/achievements.spec.ts` (Chromium) and fix every failure
