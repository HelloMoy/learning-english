## 1. Domain read model

- [x] 1.1 Add a `ModuleSummary` type to `find-course-for-view.ts` (`moduleId`, `lessonCount`, `totalDurationSeconds`, `leadingLessons`) and extend `CourseForView` with `moduleSummaries`. Export a `LEADING_LESSONS_CAP` constant (6, per design D6). Types only — no behavior yet.
- [x] 1.2 (TDD: test → impl) Summaries reflect per-module lesson counts and summed video durations, in module `sequence` order. Extend `find-course-for-view.test.ts`.
- [x] 1.3 (TDD: test → impl) A module with no lessons yields a summary of zero count, zero duration and an empty `leadingLessons`, rather than being omitted from the result.
- [x] 1.4 (TDD: test → impl) `leadingLessons` returns lessons in `sequence` order, capped at `LEADING_LESSONS_CAP`, carrying each lesson's title and poster (poster absent for reading lessons).
- [x] 1.5 (TDD: test → impl) Spy on the lesson repository and assert `listByCourse` is called exactly once — guards design D5 against a future N+1. `firstLesson` behavior must remain unchanged.

## 2. Duration formatting

- [x] 2.1 (TDD: test → impl) Create `src/lib/format-duration/format-duration.ts` returning structured `{ hours, minutes }` parts rather than a formatted string, so ICU pluralisation stays in the message catalogues (design D7). Table-driven `format-duration.test.ts` covering 0s, sub-hour (28 min), exactly 60 min, and 635 min (module 10).

## 3. Vocabulary in the message catalogues

- [x] 3.1 In `src/messages/{en,es,pt}.json`, remove `CourseCatalog.courseOverview.season`, `episodesGridLabel` and `moduleLabel`; rename `CourseCatalog.moduleOverview.episode` to a video-ordinal key. Add keys for the module ordinal (`Lesson N`), the count line (videos + hours/minutes plural forms), the CTA, and the remainder disclosure. All three locales, identical key sets.
- [x] 3.2 (TDD: test → impl) Add a message-catalogue test asserting the three locales share an identical key set under the touched namespaces, and that no catalogue contains a season or episode key. Makes the `course-vocabulary` requirement enforceable.

## 4. ModuleShowcaseCard component

- [x] 4.1 (TDD: test → impl) Create `src/components/module-showcase-card/module-showcase-card.tsx` rendering the `Lesson N` ordinal as an `<Eyebrow>` outside the framed panel (design D4), plus the two-panel layout: left panel with module title, count line, CTA and decorative `PlayButton`; right panel with the mosaic. Immersion Cinema tokens only — `ARTWORK_GLOW`, `text-gold`, `tabular-nums`, `border-border`, `bg-[linear-gradient(180deg,var(--panel-2),var(--card))]`.
- [x] 4.2 (TDD: test → impl) The mosaic renders one tile per leading lesson, each with its `Video N` ordinal above the thumbnail and the lesson title below, in `sequence` order.
- [x] 4.3 (TDD: test → impl) A lesson without a poster falls back to the gradient tile; no broken or empty image is rendered.
- [x] 4.4 (TDD: test → impl) The card discloses the remainder when a module holds more lessons than the cap, and omits the disclosure when it does not.
- [x] 4.5 (TDD: test → impl) A single-lesson module renders a one-tile mosaic through the same layout, with no special casing.
- [x] 4.6 (TDD: test → impl) Accessibility contract per design D2/D3: the mosaic is exposed as a list (`getByRole("list")`, `getAllByRole("listitem")`); the mosaic contains **no** links; the card exposes exactly two links (title and CTA), both naming the module. Tiles carry no hover or pointer affordance.
- [x] 4.7 Responsive layout: three mosaic columns at `lg`, two below it, one below `sm`; the card stacks vertically on small screens and the CTA becomes a full-width `min-h-11` target (design D2 trade-off). Mosaic images use `next/image` with explicit `sizes` and no `priority`.
- [x] 4.8 Write `module-showcase-card.stories.tsx` with `SingleLesson` (module 4), `Typical` (module 3), `Overflowing` (module 7, 31 lessons), `LongDuration` (module 10, 635 min) and `MissingPoster`, using real title lengths from the seed so truncation is visible in review.

## 5. Course overview

- [x] 5.1 (TDD: test → impl) Rewrite `course-overview.tsx` to render the header (title, description, count pills) followed by one full-width `ModuleShowcaseCard` per module in a single-column list. Remove the season heading, the `PosterCard` grid and the `Module` badge. Retain "Start course" targeting the deterministic first lesson.
- [x] 5.2 Thread `moduleSummaries` from `find-course-for-view` through `src/app/[locale]/courses/[courseSlug]/page.tsx` into `CourseOverview`.
- [x] 5.3 (TDD: test → impl) Rewrite `course-overview.test.tsx`: one card per module in sequence with ascending ordinals; no season heading; no `Module` badge; "Start course" unchanged. Keep the existing `vi.mock("next-intl")` key-echoing pattern.
- [x] 5.4 Update `course-overview.stories.tsx` for the new structure.

## 6. Module overview rename

- [x] 6.1 (TDD: test → impl) Rename the row eyebrow from `Episode N` to `Video N` in `module-overview.tsx` and update the hero eyebrow's `Module NN` phrasing. Update the component's doc comment, which describes it as an "episode list". Row structure, thumbnail fallback, `aria-hidden` treatment and completion marking stay unchanged.
- [x] 6.2 (TDD: test → impl) Update `module-overview.test.tsx` eyebrow assertions to the new keys; every other assertion unchanged.
- [x] 6.3 Update the `6 episodes` badge text in `poster-card.stories.tsx` and the "episode" wording in the doc comments of `poster-card.tsx`, `play-button.tsx` and `eyebrow.tsx` so the codebase stops teaching the retired term.

## 7. End-to-end

- [x] 7.1 (TDD: test → impl) Create `e2e/course-overview.spec.ts` mirroring `course-catalog.spec.ts`: ten ordinals render in order; a card's CTA navigates to its module overview; mosaic images have non-zero `naturalWidth` (catches a broken `BlobStore` URL that jsdom cannot); no season or episode text in `en` or `es`.

## 8. Verification

- [x] 8.1 Run `pnpm verify` (typecheck, format:check, lint, test:run) and fix anything it surfaces.
- [x] 8.2 Run `pnpm test:e2e` for the course overview and module overview specs.
- [x] 8.3 Visual pass with Playwright on `/en/courses/advanced-intermediate-course` and `/es/courses/advanced-intermediate-course`: confirm the mosaic shows real artwork, module 4 (one lesson) and module 7 (31 lessons) both render correctly, module 10 shows an hours-based duration, and no card reads as a single video.
