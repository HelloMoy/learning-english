## Context

`course-enrollment` stores enrollments and one resume location per course, and exposes them to the client
as `useEnrolledCourses()` and `useContinueWatchingByCourse()`. The screens that use them were chosen from
design explorations (artifacts "Wide Cinema, More Courses" case 3, "Basic Course First" view 1 without
"Not now", and "Cinema Enrollment Flow" view 3).

Today My learning resolves the single stored location through a Server Action round-trip
(`findContinueWatchingAction`), then asks for the course's continue target with another round-trip
(`useCourseContinueTarget`). Meanwhile the course overview already computes the continue target, per-module
progress and course tally on the client from `courseOverviewProgress(...)`, given the course's modules and
lessons (with posters and durations) from `findCourseForView`. The visual building blocks exist too:

- `ContinueTile` is the hero with artwork, eyebrow, title and CTA.
- `CourseProgressTile` is the side panel with the ring, figures and prize icons.
- `ProgressRing`, `PrizeIcon` and `prizeForModule` cover the smaller pieces.

## Goals / Non-Goals

**Goals:**

- Onboarding step 3 recommends the first catalog course. Starting it enrolls the learner and opens its
  first video.
- Available courses shows the last watched course, the other enrolled courses and the courses still
  available, with enroll.
- My learning shows the video to resume in the last watched course and every enrolled course.
- A learner with no enrollment who opens My learning is sent to step 3.
- Every learner-derived value is computed on the client from one reading, so no two panels disagree
  and no server round-trip is needed for the resume offer.

**Non-Goals:** see the proposal. Notably no un-enroll, no completion dates and no new domain use case.

## Decisions

### D1. Pages load every catalog course's view on the server; progress is computed on the client

A cached server helper `loadCourseViews()` in `src/app/[locale]/course-views.ts`:

1. It lists the catalog through `findCourseCatalog`, which already hides drafts.
2. It runs `findCourseForView` for each course.
3. It returns `CourseForView[]` in sequence order.

`/courses`, `/learning` and `/start/first-course` pass this array to a client view.

- **Why:** `ModuleSummary.lessons` carries `title`, `durationSeconds` and `poster`, which are exactly what
  the heroes, "Next up" rows and module lists need. With it the client can call `courseOverviewProgress`
  per course, which is the same function the course overview uses, so My learning, Available courses and
  the course overview always agree on "the next video".
- **Alternative:** keep the Server Action resolution. That needs one round-trip per course and cannot
  order courses by recency without another. With two courses and an in-memory catalog, sending the views
  is cheap.

### D2. One pure function sorts the catalog for a learner

`src/lib/course-shelf/course-shelf.ts`:

```ts
courseShelf({ courses, enrolledSlugs, records, completedIds, positions }): {
  featured: ShelfCourse | null;      // enrolled course watched most recently; else first enrolled by sequence
  otherEnrolled: ShelfCourse[];      // remaining enrolled courses, sequence order
  available: CourseForView[];        // not enrolled, sequence order
}
type ShelfCourse = { view: CourseForView; progress: CourseOverviewProgress; record: ContinueWatchingRecord | null };
```

Each enrolled course's `progress` comes from `courseOverviewProgress` with **that course's** record as
`location`. "Most recently watched" is the order of `records` (already latest-first). A course with a
record outranks one without.

With no enrollment, `featured` is `null`. The function also returns `recommended`, which is the first
catalog course read as if the learner had joined it, and in that case `available` no longer lists that
course. A companion `courseCardModel(shelfCourse, { positions, claimedPrizes })` reduces an enrolled
course to what every card draws: facts, tally, target video, saved position, watched-at time, prizes
and whether it is completed. `useCourseShelf(courses)` reads the learner store once and returns these
models, or `pending` until the store is seeded.

- **Why a pure function:** every rule ("featured", ordering, completed) is unit-testable in Vitest
  without rendering, and the three screens share it.

### D3. Available courses (`/[locale]/courses`) mirrors the "wide cinema" design

Page component `AvailableCoursesView` (client). Its header reads an eyebrow, the heading
"Available courses" and the summary "{total} courses · you're enrolled in {n}" (ICU plural, with an
"all" variant). Then three sections:

1. **Featured.** `CourseCinemaHero` is a 21:9 artwork card built from the continue target's poster. It
   has:
   - the `Enrolled` pill;
   - an eyebrow that reads **Last watched** when the course has a record and **Your course**
     otherwise;
   - a floating "Next up" / "Resume at m:ss" chip with the video's thumbnail;
   - the heading "Level N · M modules · V videos" above the course title;
   - a footer with a small ring, the "x of y videos · time left" figures and the prize icons;
   - the actions **Continue course** / **Start course** / **Watch again** (from the target kind),
     which open the target, and **View course**.

   With no enrollment, the first catalog course takes this slot with **Recommended for you** and
   **Start course**, which opens its first video (the lesson visit enrolls).
2. **Your other courses.** Renders only when there are other enrolled courses; each is an
   `EnrolledCourseCard`, in a single column for one course and a 2-column grid from two. A finished
   course (every video complete) reads **Completed**, shows its prize count and offers **Watch again**.
3. **More courses.** Each course is a `CourseShelfCard` with:
   - the first video's thumbnail and a "Level N" pill;
   - the title;
   - a strip of up to four module thumbnails (each module's first video) plus "+K";
   - the figures;
   - **Enroll**, which calls `enrollInCourse(slug)` so the card moves to "Your other courses" at once,
     optimistically;
   - **Preview course**, which opens the overview without enrolling.

   When nothing is left: "You're enrolled in every course. New courses will show up here." The section
   title is "Keep going after Level {highest enrolled level}".

The route sits under the existing `courses/layout.tsx` (session + profile). The header's `sectionKey`
learns `/courses` → `sectionCourses`.

### D4. First-course step (`/[locale]/start/first-course`) follows the chosen onboarding design

`FirstCourseStep` (client):

- the step indicator ("Step 3 of 3");
- the heading "Your first course, {first name}" and a short intro;
- a `ContinueTile`-styled hero for the first catalog course, carrying:
  - the **Recommended for you** pill;
  - the "Level · modules · videos" line;
  - the title and description;
- a "What you'll learn" panel listing its modules with outlined ordinals, plus videos, total runtime and
  prize count;
- **Start the {course}**: calls `enrollInCourse(slug)` and pushes the first video's path;
- **See all courses**: a link to `/courses`;
- a note that joining other courses is possible any time.

It guards like step 2: no profile sends the learner to `/start`.

**Step indicator:** `OnboardingProgress` counts three steps. The step shows it unless the URL carries
`?from=learning`, the marker the My learning redirect adds (parsed with `nuqs` as a string literal).

**Step 2 destination:** `useOnboardingDestinations().afterOnboarding` becomes `/start/first-course`, or the
valid course `next` as today. A learner who arrives from a course link keeps going to that course, and
visiting a lesson enrolls them there.

### D5. My learning is rebuilt; the redirect is client-side, like the profile redirect

`MyLearningView` keeps its profile shell and its `absent → /start` redirect. Once the profile is present
and the learner store is seeded, an empty `useEnrolledCourses()` replaces the route with
`/start/first-course?from=learning`.

- **Why client-side:** it matches the existing profile redirect and its "decide nothing while unknown"
  rule, and it keeps the URL right after sign-in unchanged for the account flows. A server redirect would
  also race optimistic enrollments made just before navigating.

The page renders:

1. The greeting (unchanged).
2. A pair:
   - `ResumeTile`: the featured course's continue target poster; the pill
     **Pick up where you left off** (or **Start here** for kind `start`); the eyebrow
     "{course} · Module NN · Video n of m"; the title; for a video with a saved position, a progress bar
     with "m:ss / m:ss" and "watched {relative time}" (`useFormatter().relativeTime` against `useNow`);
     and a single CTA **Resume**, **Start** or **Watch again**.
   - `CourseProgressTile` for the same course, rendered with its title as an `h2` (new `headingLevel`
     prop, default `h1` for the overview) and a **View course** link (new optional `href` prop).
3. **Your courses**: the heading "{n} courses you're enrolled in", a **Browse courses** link to
   `/courses`, and one `EnrolledCourseSummaryCard` per enrolled course in sequence order. Each card has
   a small ring, the title, "x of y videos", a "Next up" row (thumbnail with its progress bar, title,
   "Module N · title · Video n of m · k min") and **Continue** / **View course**. The featured course's
   card has the gold border.

Removed: the `ResumePanel` / `StartPanel` panel, the lesson-card grid and the courses table.
`ResumePanel`, `StartPanel`, `CourseProgressList` and `useCourseContinueTarget` lose their only caller
and are deleted with their stories and tests. `useResolvedContinueWatching` stays, because achievements
uses it.

### D6. The course overview reads its own course's place

`CourseProgressBoard` currently reads `continueWatching.get()`, the latest location overall. It switches
to that course's record from `useContinueWatchingByCourse()`. That is the per-course place
`course-enrollment` stores, so a learner who last watched Advanced still resumes Basic where they left
it. The injectable `continueWatching` repository prop (tests and stories) moves to `list()`.

### D7. Copy and i18n

New components use `Components.<ComponentName>` namespaces in `en`, `es` and `pt`. Counts use ICU plurals.
Relative time and percentages go through `next-intl` formatters. Durations reuse `useRuntimeLabel` and
`formatMinutesSeconds`. The header gains `SiteHeader.courses` and `SiteHeader.sectionCourses`. Onboarding
gains `Onboarding.firstCourse.*`, and its step label already takes `{total}`.

## Risks / Trade-offs

- **[Sending full course views to the client grows the payload]** → Two courses, about 155 lessons, text
  and poster URLs only: tens of kilobytes. If the catalog grows large, split per page later.
- **[The client redirect flashes the My learning shell]** → The shell already renders while the profile
  is read, and the redirect decides after the same hydration step, so no new flash shape appears.
- **[Optimistic Enroll on /courses refused by the server]** → `enrollInCourse` rolls back, so the card
  returns to "More courses" and nothing else changes.
- **[A learner whose only record is in a course they are not enrolled in]** → This cannot happen,
  because every recorded visit enrolls. `courseShelf` still ignores records of courses that are not
  enrolled.
- **[`from=learning` is user-editable]** → It only hides the step indicator. No behavior depends on it.

## Testing strategy

| Behavior | Layer | Mirrors |
| --- | --- | --- |
| `courseShelf`: featured by recency, fallback to first enrolled, other enrolled in sequence, available, completed detection, per-course location | Vitest unit | `course-overview-progress.test.ts` |
| `loadCourseViews` returns every catalog course's view in order | Vitest unit (node) | `catalog-levels.test.ts` |
| `CourseCinemaHero`, `EnrolledCourseCard`, `CourseShelfCard` (Enroll calls `enrollInCourse`), `ResumeTile` (bar, relative time, CTA kinds), `EnrolledCourseSummaryCard` | Vitest + RTL | `continue-tile.test.tsx`, `course-progress-tile.test.tsx` |
| `AvailableCoursesView` sections per state (none / one / both), optimistic enroll moves a card | Vitest + RTL with `givenLearner` | `my-learning-view.test.tsx` |
| `FirstCourseStep` (start enrolls and navigates, see all link, step indicator hidden with `from=learning`, no-profile redirect) | Vitest + RTL | `onboarding-avatar-step.test.tsx` |
| `MyLearningView` (resume tile for the last watched course, your courses cards, empty-enrollment redirect) | Vitest + RTL | `my-learning-view.test.tsx` (rewritten) |
| `OnboardingProgress` three segments; avatar step goes to first-course; `SiteHeader` menu order and `sectionCourses`; `CourseProgressBoard` per-course record; `CourseProgressTile` heading level and link | Vitest + RTL | existing tests of each |
| Stories for every new or changed component, in `en` / `es` / `pt` | Storybook, checked with Playwright MCP | existing stories |
| Onboarding → step 3 → Start opens the first video enrolled; See all opens `/courses`; `/learning` without enrollment lands on step 3 without the indicator | Playwright e2e | `course-onboarding-gate.spec.ts`, `home.spec.ts` |
| Available courses: enroll from the shelf; the last watched course is featured | Playwright e2e | new `available-courses.spec.ts` with `learner-state-fixture.ts` |
| My learning resumes the last watched course and lists both | Playwright e2e | `home.spec.ts` "My learning" group |
