## Context

`CourseOverview` (Server Component) renders a hero with **Start course** and the
`CourseCarousel` client island, which owns selection, `ModulePoster`s and the
`LessonProgressPanel`. The page already receives everything the new layout needs:
`course`, `modules`, `moduleSummaries` (each lesson's id, title, runtime and poster) and
`firstLesson`. Progress lives on the device: `useCompletedLessons()` and
`useSavedPlaybackPositions()` are synchronous snapshots; `useContinueWatching().get()` resolves
the single stored location (`courseSlug`, `moduleSlug`, `lessonId`) asynchronously.
`moduleProgress` and `selectInitialModuleIndex` (`src/lib/module-progress`) already decide a
module's state and target lesson with `countsAsComplete`.

The chosen design is prototype 11 ("Anillos") on the "Página del curso" canvas, desktop and
phone.

## Goals / Non-Goals

**Goals:**
- Course progress and every lesson visible without paging; one continue action.
- Every tile's state decided by the same rule as the rest of the app.
- No hydration flicker that asserts a false state.

**Non-Goals:**
- Any per-video listing on this page; any domain/port/adapter change.

## Decisions

### 1. A pure view model: `courseOverviewProgress` in `src/lib/course-overview-progress/`

One function, `courseOverviewProgress({ course, entries, location, completedIds, positions })`,
returns:

- `course`: watched count, lesson count, fraction, seconds left;
- `modules[]` in `sequence` order: `moduleProgress` result, watched count, fraction, seconds
  left, and `status` (`completed` | `in-progress` | `not-started`), plus `isCurrent`;
- `continueTarget`: `{ kind: "start" | "continue" | "rewatch", module, lesson }`.

The continue target follows the **module overview's route rule** (`deriveModuleRoute` in
`src/lib/module-route/`), applied to the whole course: every video is laid out in course order
(lessons by `sequence`, videos by `sequence` within each), the stored location — when it names a
live video of this course — is passed as the last-opened video, and the step the route marks
`current` is the target. That rule anchors on the last-opened video, or the furthest progress
without one, and moves past it when it is already complete, so a finished recorded video
continues with the next one. `start` when nothing is watched and no record names the course,
`rewatch` when everything is complete. The current module is the one holding a `continue`
target.

*Why reuse `deriveModuleRoute`:* the module overview already answers "which video is next" for
one lesson; running the same function over the course means the two pages can never disagree.
*Rejected:* the first version returned the recorded video even when it was complete, which sent
a learner back to a video they had just finished.

*Why one pure function:* the three tiles must never disagree, and a pure function is unit
testable without React. *Alternative:* per-tile hooks — rejected, each would re-derive state.

### 2. One client island, three presentational tiles

`CourseOverview` stays a Server Component and renders `CourseProgressBoard` (client), which
reads the three device stores once, calls the view model and renders:

- `ContinueTile` — artwork of the target lesson (`poster`, or the glow placeholder), eyebrow
  "Lesson NN · Video K of N", title, primary action `startCourse` / `continueWhereLeftOff` /
  `watchAgain` linking through `lessonPath`.
- `CourseProgressTile` — course title as the page's `h1`, large ring, percentage,
  "C of N videos · X left".
- `LessonRingTile` × modules — artwork band with outlined ordinal, ring with percentage,
  status chip, title, "C/N · X left" ("All watched" when completed); a `Link` to
  `moduleOverviewPath` (or `lessonPath` for a one-lesson module, as the carousel did).

Tiles are pure props-in components so stories and RTL tests need no storage.

### 3. Hydration

Before hydration and before the stored location has been read, the board renders the
**pending** shape: rings with an empty track and no percentage, no status chips, the lesson
tiles' meta as "N videos · runtime", and the continue tile's text and action as skeleton bars
of their final size. The `h1` course title renders on the server. This mirrors how the
removed panel and the home's continue band avoided asserting progress.

### 4. Layout

Desktop (`lg`): a 12-column grid — continue tile spans 8, course tile spans 4; lesson tiles in
a `repeat(5, minmax(0, 1fr))` grid that wraps for courses with more modules. Phone: course
tile as a row (ring + title + counts), continue tile, then one row per lesson led by its ring.
Values follow the prototype and existing tokens (`--card`, `--border`, `--gold`, 26px/24px
radii, Geist). The ring is an inline SVG with the same stroke logic as `ProgressRing`; if
`ProgressRing` accepts the needed size/label, it is reused instead.

### 5. Copy

New keys under `CourseCatalog.courseOverview`: `continueWhereLeftOff`, `statusCompleted`,
`statusInProgress`, `statusNotStarted`, `lessonVideoPosition`, `watchedOfTotal`,
`timeLeftShort`, `allWatched` (reused if the existing one fits), `progressHeading`. Keys used
only by the carousel and the panel (`carouselLabel`, `previousLesson`, `nextLesson`,
`showLesson`, `selectionAnnouncement`, `keepGoing`, `pickUp`, `videosReady`, `beginsWith`,
`upNext`, `startThisLesson`, `timeLeftInModule`, `nowShowing`, `trackLabel`) are removed after
grepping for other readers. Final names are settled in the tasks.

### 6. Removal

`course-carousel`, `lesson-progress-panel` and `module-poster` are deleted with their stories
and tests; `use-horizontal-swipe` stays (the add-to-home-screen guide uses it).

## Risks / Trade-offs

- [With little progress the rings look empty] → the percentage and "0/N" still carry the
  information; the in-progress tile is edged in gold.
- [Ten-module courses make a two-row grid] → the grid wraps; tiles keep a fixed minimum width.
- [Removing the carousel breaks e2e and specs that assert on it] → updated in this change.

## Testing strategy

- **Vitest unit** — `course-overview-progress.test.ts`: course tally and time left; module
  status per `countsAsComplete`; continue target for no progress, partial progress, a record
  in this course, a stale record, a record of another course, and a finished course.
  Mirrors `src/lib/module-progress/module-progress.test.ts`.
- **Vitest component + RTL** — `continue-tile`, `course-progress-tile`, `lesson-ring-tile`
  (label per kind, links, pending shape, status chips, one-lesson module link) and
  `course-progress-board` (reads seeded `localStorage` + injected continue-watching fake,
  pending before the record read). Mirrors `lesson-progress-panel.test.tsx` patterns (key-echo
  `next-intl` mock, `useIsHydrated` mock). `course-overview.test.tsx` and `loading.test.tsx`
  updated.
- **Playwright e2e** — `e2e/course-overview.spec.ts`: tiles render in order with artwork; a
  lesson tile opens the module overview; a learner part-way through a module sees that tile
  marked in progress and Continue linking to the first unfinished video; returning from a
  lesson shows Continue where you left off; no horizontal scroll at 390px.
  `e2e/watch-progress.spec.ts` updated to read progress from the lesson tile.
- **Storybook** — stories for each tile (all states, `es`) and the board.
