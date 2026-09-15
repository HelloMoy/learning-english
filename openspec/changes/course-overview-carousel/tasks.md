## 1. Setup

- [x] 1.1 Delete the superseded `openspec/changes/course-overview-marquee/` and confirm `openspec validate course-overview-carousel --strict` passes

## 2. Domain — every lesson in the module summary

- [x] 2.1 (TDD: test → impl) `find-course-for-view.test.ts`: a module of 31 lessons lists all 31 in sequence with id, sequence, title, runtime and poster; a reading lesson has runtime 0 and no poster — then replace `leadingLessons`/`lessonRuntimes`/`LEADING_LESSONS_CAP` with `lessons: ModuleLesson[]`
- [x] 2.2 Update every consumer and fixture of the old fields until `pnpm typecheck` passes

## 3. Progress rules

- [x] 3.1 (TDD: test → impl) `src/lib/module-progress/module-progress.test.ts`: not-started (no marks, no positions), in-progress (target = first incomplete, K of N, seconds left in target and in module, up next ≤ 3 and none at the end), completed, empty module — then implement `moduleProgress`
- [x] 3.2 (TDD: test → impl) initial selection: first in-progress module; else first not completed; else 0 — then implement `selectInitialModuleIndex`
- [x] 3.3 (TDD: test → impl) `useModuleProgress(lessons)` returns `moduleProgress` over the two stores (seed localStorage as the watch-progress tests do)

## 4. Messages

- [x] 4.1 Add the carousel and panel keys (design D7) to `en`, `es`, `pt`; update `messages.test.ts`

## 5. Presentational components

- [x] 5.1 (TDD: test → impl) `ProgressRing`: fraction fill and segmented mode with one lit segment; decorative — then implement with JSDoc and stories (`Components/ProgressRing`)
- [x] 5.2 (TDD: test → impl) `ModulePoster`: up to three collage images, one for a single lesson, placeholder without artwork, outlined ordinal, title, meta line; `selected`/`distance` styling hooks — then implement with JSDoc and stories

## 6. Lesson progress panel

- [x] 6.1 (TDD: test → impl) `LessonProgressPanel`: neutral pre-hydration state; not-started (segments, "N videos ready", Start this lesson → first video, up next); in-progress (percent, "C of N", Pick up title, Video K of N, time left, Continue → target, Open lesson → module, up next); completed (All N watched, Watch again, Open lesson) — then implement with JSDoc and stories for each state

## 7. Carousel and page

- [x] 7.1 (TDD: test → impl) `CourseCarousel`: one poster and dot per module; arrows disabled at ends and move selection; dot selects and is `aria-current`; ArrowLeft/Right move selection; clicking a neighbour selects without navigating; selected poster links to module overview, or to the lesson for a one-lesson module; polite announcement; selection jumps to the in-progress module after hydration; panel follows selection — then implement with JSDoc and stories
- [x] 7.2 (TDD: test → impl) `CourseOverview`: hero eyebrow, title, meta line below title, single Start course; renders the carousel — then rebuild
- [x] 7.3 (TDD: test → impl) Loading shell traces hero, carousel stage and panel — then rewrite `loading.tsx`
- [x] 7.4 Delete `ModuleShelf` and `VideoCard` (component, tests, stories) and unused message keys

## 8. End-to-end

- [x] 8.1 (TDD: test → impl) Rewrite `e2e/course-overview.spec.ts`: poster artwork loads; next arrow moves selection; selected poster opens its module; a one-video module's selected poster opens its lesson; Start this lesson opens the first video; seeded localStorage progress shows Continue naming the first unfinished video; at 390px no horizontal overflow and the meta line sits below the title
- [x] 8.2 (TDD: test → impl) Update `e2e/one-click-navigation.spec.ts` for the selected-poster click

## 9. Verification

- [x] 9.1 Screenshot 1440px and 390px, dark and light, not-started and in-progress, and compare with J3 + K3 in the canvas; fix drift
- [x] 9.2 Run `pnpm verify` (real exit code) and the touched e2e specs on Chromium with `--workers=1`; fix any failure
