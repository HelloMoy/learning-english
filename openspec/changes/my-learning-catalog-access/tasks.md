## 1. Catalog card

- [x] 1.1 `CatalogCard` shows `Catalog · N courses`, the heading and the not-joined count (ICU plural), and links to `/courses` (TDD: `catalog-card.test.tsx` → impl)
- [x] 1.2 `CatalogCard` teases a course: first video thumbnail, title, `Level N` / `Reference` and video count; with no teaser it says the learner is in every course (TDD: test → impl)
- [x] 1.3 `Components.CatalogCard` messages in en/es/pt; es copy test (TDD: test → messages)
- [x] 1.4 `catalog-card.stories.tsx` (teaser, reference teaser, all joined, Spanish) and JSDoc on the component and its props

## 2. My learning

- [x] 2.1 The See all courses button → `/courses`; replaces the Browse courses test and the es assertion (TDD: `my-learning-view.test.tsx` → impl)
- [x] 2.2 Your courses closes with the catalog card, teasing the first course not joined; grid `md:2 / lg:3` columns; Browse courses link and `MyLearning.browseCourses` removed (TDD: test → impl)
- [x] 2.3 Update the MyLearningView JSDoc and stories for the new layout

## 3. Leading row

- [x] 3.1 On wide screens the resume hero stretches to the progress panel's height (TDD: `home.spec.ts` height assertion red at 380 vs 497 px → wrapper `lg:flex lg:flex-col [&>section]:lg:flex-1` → green)

- [x] 3.2 See all courses reads the same on every width and sits in the greeting's row on wide screens (TDD: `home.spec.ts` position test red → greeting, hero, panel and button share one 12-column grid → green); phones hide it (TDD: `home.spec.ts` `toBeHidden` at 390 px red → `hidden lg:inline-flex` → green)
- [x] 3.5 The progress panel's link reads **View course details** and, with the title, opens `/courses/<slug>/about` (TDD: `my-learning-view.test.tsx` red → impl → green; `one-click-navigation.spec.ts` updated)

- [x] 3.3 The teaser opens the teased course's page at `courseDetailPath` (`/courses/<slug>/about`, from develop's course-detail-link); the heading's stretched link keeps the rest of the card on `/courses` (TDD: RTL teaser-href test red → impl → green; `home.spec.ts` teaser → `/about` and call-to-action click)

- [x] 3.4 Each enrolled course card: ring and title open the board (out of the tab order), **View course** becomes **Progress**, and **Details** opens `/courses/<slug>/about`; `viewCourse` replaced by `viewProgress` and `viewDetails` in en/es/pt (TDD: `enrolled-course-summary-card.test.tsx` red → impl → green; `home.spec.ts` card links)

- [x] 3.6 Enrolled card actions: one gold full-width button reading Start / Continue / Watch again by the target's kind (`start` message in en/es/pt), and Progress + Details as a split bar with icons closing the card (TDD: `enrolled-course-summary-card.test.tsx` Start test red → impl → green; visual check at 1440 and 390 px)

- [x] 3.7 Fix the hover flicker on `ResumeTile` and `ContinueTile`: the stretched link no longer transforms or filters itself; the lift moves to a span inside (TDD: `home.spec.ts` samples the element under a resting pointer for 30 frames — red, alternating — → impl → green)

## 4. Board route

- [x] 4.1 `courseOverviewPath` returns `/courses/<slug>/progress`; `courseDetailPath`, module and lesson paths keep theirs; helpers take `{ slug: string }` (TDD: `lesson-routes.test.ts` red → impl → green)
- [x] 4.2 Move the board's `page.tsx`, `opengraph-image.tsx` and `loading.tsx` (with their tests) into `[courseSlug]/progress/`; `course-schema` and `ModuleOverviewError` build the board URL with the helper (TDD: `course-schema.test.ts` and new `module-overview-error.test.tsx` red → impl → green)
- [x] 4.3 Update the nine component assertions and every e2e spec that opened the board; `not-found-routes.spec.ts` pins the bare address as a missing page and `/progress` as the board
- [x] 4.4 Spec deltas for `cinema-course-overview` (new address requirement), `course-detail-page`, `my-learning`, `cinema-home`, `course-content-storage`, `site-metadata`, `learner-onboarding`

## 5. End to end and verification

- [x] 5.1 `e2e/home.spec.ts`: My learning's See all courses button and catalog card open Available courses (TDD: spec → run against the implemented page)
- [x] 5.2 Visual check of `/es/learning` at 1440, 1024 and 390 px against variant 8, with screenshots from a Playwright script (the MCP browser was held by another session; the app renders dark under either colour scheme, so light was not compared)
- [x] 5.3 Run `pnpm verify` and the touched Playwright specs (`home.spec.ts`, `one-click-navigation.spec.ts`, `available-courses.spec.ts`)
