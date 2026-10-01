## Context

`MyLearningView` already renders most of variant 8: the greeting, `ResumeTile` in 8 of 12 columns
beside `CourseProgressTile` in 4, and Your courses as `EnrolledCourseSummaryCard`s. What is missing
is the catalog access: the button beside the greeting and the catalog card, plus the three-column
grid. `useCourseShelf` already returns `available` — every course the learner has not joined, in
catalog order (with at least one enrollment `recommended` is `null`, so nothing is held back) — and
the page already receives every catalog course (`courses`).

## Goals / Non-Goals

**Goals:**

- Add the See all courses button and the catalog card as the design review drew them, in the Immersion
  Cinema tokens the page already uses.
- Keep the card self-contained and reusable: it takes what it shows, not the shelf.

**Non-Goals:**

- Touching `ResumeTile`, `CourseProgressTile` or `useCourseShelf`.
- The mock's giant IPA glyph behind the card. The real catalog has no per-course glyph; the card
  keeps the gold gradient and border and uses the teased course's real thumbnail instead.

## Decisions

- **`CatalogCard` is a new project component** (`src/components/catalog-card/`) taking
  `courseCount`, `notJoinedCount` and an optional `teaser?: CourseForView`. The view computes those from
  `courses.length` and `shelf.available`. Alternative — passing the whole shelf — couples a
  presentational card to the hook's reading type; rejected.
- **The card opens `/courses` through a stretched link; the teaser opens the course page.** The
  heading's link stretches over the card (`after:absolute after:inset-0`, the pattern `ResumeTile`
  uses), so a click anywhere opens `/courses`; the drawn "See all courses" call to action is a span
  with `pointer-events-none`, so its hover lift never covers the link. The teaser is its own link,
  raised above the stretched one, to `courseDetailPath` (`/courses/<slug>/about`) — the course page
  every learner can open, where `courseOverviewPath` would send an enrolled learner to the board.
  Alternative — the whole card as one `Link` — cannot hold the teaser's link (nested anchors are
  invalid); rejected.
- **The enrolled card names both destinations.** Develop split a course into its progress board
  (`courseOverviewPath`) and its course page (`courseDetailPath`), so **View course** became ambiguous:
  it now reads **Progress**, and **Details** sits beside it. The ring and title wrap one link to the
  board with `tabIndex={-1}` — the same one-tab-stop rule `CourseProgressTile`'s title link follows.
- **The card's action follows the target's kind.** `start` / `continue` / `rewatch` map to **Start**,
  **Continue** and **Watch again**, the mapping `ResumeTile` already uses, so a course at 0 % no
  longer says Continue. It is the card's one gold, full-width button; Progress and Details move to a
  split bar that bleeds to the card's edges (negative margins undo the card's padding, the card clips
  with `overflow-hidden`, and the links' focus rings are inset so the clip does not cut them). The
  layout came from the "Tarjeta de curso inscrito" review: the button of its variant 1 and the bar
  of its variant 6, on the existing card.
- **A stretched link never transforms itself.** `ResumeTile` and `ContinueTile` stretched their action
  over the tile with `after:absolute after:inset-0` and also lifted that same link on hover
  (`translate`, `brightness`). A transformed or filtered element becomes the containing block of its
  absolute descendants, so on hover the stretched area shrank to the button, the pointer fell off it,
  the hover ended, the area grew back — a loop that flickered the cursor. The lift now lives on a
  span inside the link (`group-hover/action`), as `CatalogCard`'s drawn call to action already does.
- **Teaser = `available[0]`**: the first course in catalog order the learner has not joined. For a
  learner in Basic that is Advanced (Level 2), matching the mock. Its thumbnail is its first video's
  poster via `courseFirstVideo`, its size via `courseFacts`.
- **One See all courses button, wide screens only.** The greeting, the hero, the progress panel and
  the button share one 12-column grid; a wide screen pins the button to row 1, columns 9–12, beside
  the greeting. Phones hide it (`hidden lg:inline-flex`): the catalog card closing Your courses is
  their way to the catalog, so the leading block stays the hero and its panel.
- **The panel names the course page.** The panel's closing link reads **View course details** (the
  board's existing `viewCourseDetails` copy) and leads to `courseDetailPath`; `CourseProgressTile`
  ties the title to the same link, so the title opens the course page too. The board itself stays
  one click away through each card's **Progress**.
- **Browse courses link removed.** The variant's rationale places the catalog "in two places"; a third
  identical link beside the heading is redundant. `MyLearning.browseCourses` is replaced by
  `allCourses`.
- **Grid**: `md:grid-cols-2 lg:grid-cols-3`. With one enrollment the catalog card sits beside it; with
  more it becomes the last cell, as the review describes.
- **Copy** lives under `Components.CatalogCard` (en/es/pt) with ICU plurals for the counts; gender-
  neutral in es/pt ("Aún no te has inscrito en…").

- **The board moves to `/progress`; the bare address is a missing page.** Only the board's files
  move (`page.tsx`, `opengraph-image.tsx`, `loading.tsx` into `[courseSlug]/progress/`), so `/about`,
  modules and lessons keep their URLs. `courseOverviewPath` is the one place that names the board,
  and the two call sites that hand-built `/courses/<slug>` (`course-schema`, `ModuleOverviewError`)
  now use it. The OG image moves with the page because Next serves `opengraph-image` only at its own
  segment, and the loading shell moves because it traces the board — and because, left at
  `[courseSlug]`, it would wrap the bare address too. The helpers' course parameter widens to
  `{ slug: string }` so unbranded slugs from route params can build paths. Alternatives — a redirect
  from the bare address, or keeping it as an alias — were declined by the product owner.

## Risks / Trade-offs

- [Unknown paths under `/courses` answer 200] → the bare address renders the localized not-found
  state but with HTTP 200, as every unknown path below `/courses` already does on develop (the async
  session layout streams first). `lesson-view-polish` asks for 404; fixing that is its own change.
  The e2e pins what the learner sees, not the status.
- [`/about`'s sharing image] → on develop `/about` declares `/about/opengraph-image`, which answers
  HTML: the image file only serves its own segment. Unchanged here; noted for a follow-up.

- [A catalog of one course the learner has joined] → the card still renders with "You're enrolled in
  all of them" and no teaser; it remains the way to Available courses.
- [A teased course with no video] → no thumbnail; the teaser shows its title and label over the
  secondary background.
- [Three columns at `lg` narrow the enrolled cards] → the cards already truncate their Next up title
  and wrap their actions; verified in the browser at 1024 px.

## Testing strategy

- **Vitest + RTL component** — `catalog-card.test.tsx` (new): counts and plurals, teaser label and
  video count, the no-teaser state, the link to `/courses`, es copy. Mirrors
  `enrolled-course-summary-card.test.tsx` (`renderInLocale`, `aCourseView` stubs).
- **Vitest + RTL component** — `my-learning-view.test.tsx`: the See all courses button opens `/courses` and follows the progress panel in source order,
  the catalog card follows the enrolled cards and teases the first course not joined, the Browse
  courses test is replaced, the es test checks the new label.
- **Playwright** — `e2e/home.spec.ts` "My learning": the button and the card open Available courses
  on the real catalog.
- **Storybook** — `catalog-card.stories.tsx` (teaser, all joined, es) and the existing
  `my-learning-view.stories.tsx` renders the new layout; visual check with a Playwright script at desktop, tablet and phone widths (the MCP browser was held by another session; the app renders its dark theme under either colour scheme).
