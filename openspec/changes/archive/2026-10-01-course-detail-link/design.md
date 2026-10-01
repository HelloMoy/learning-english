## Context

`/[locale]/courses/[courseSlug]` renders `CoursePageSwitch`, a client component that waits for the
learner store to be seeded and then shows either `CourseDetailView` (not enrolled) or the
`CourseOverview` board (enrolled on arrival). Both trees are rendered by the server and passed in.
The course page therefore has no address an enrolled learner can reach.

The board's `CourseProgressTile` already knows how to end with a link: My learning passes it an
`href` and it renders a gold **View course** link (`CourseCatalog.courseOverview.viewCourse`). The
board passes nothing.

Route builders live in `src/i18n/lesson-routes.ts` (`courseOverviewPath`, `moduleOverviewPath`,
`lessonPath`) and every component links through `Link` from `@/i18n/navigation`.

A parallel change (`courses-poster-lobby`) is rewriting Available courses and touches the message
files; this change stays off that page.

## Goals / Non-Goals

**Goals:**

- Give the course page a stable address that renders it for any learner.
- Link to it from the board's course tile, labelled **View course details**.
- Give the enrolled course page a link back to the board.

**Non-Goals:**

- Retiring the switch on the course route or redirecting to `/about`.
- Changing the enrolled enroll action (**Start course** → first video).
- Touching Available courses, the sitemap, structured data or Open Graph images.

## Decisions

### `/about` is an additional route; the course route keeps its switch

`src/app/[locale]/courses/[courseSlug]/about/page.tsx` loads the view with the same cached
`findCourseForView` call and renders the course page behind a seeded-store gate.

- *Alternative: move the course page to `/about` and redirect learners who have not joined.* The
  enrollment is only known on the client, so the redirect would be a client `router.replace` after
  a pending frame, and eight callers of `courseOverviewPath` (catalog cards, breadcrumbs, levels
  table, My learning) would need to decide which address to use — several of them in files the
  poster-lobby change is rewriting. Keeping the switch leaves every existing link correct.
- *Alternative: `?view=course` on the course route via `nuqs`.* It works, but a query flag that
  changes the whole page reads as state, not as a page; a path segment is clearer to share and to
  test, and matches the `modules/…` nesting already under the course route.
- The segment is `about`: short, conventional, and it cannot collide with `modules`.

### A shared pending gate instead of reusing the switch

The course page reads enrollments on the client, so before seeding it would show **Enroll** to an
enrolled learner. Extract the pending shape and the "is the learner store seeded" read out of
`CoursePageSwitch`:

- `useIsLearnerStoreSeeded()` in `src/hooks/use-is-learner-store-seeded/` — the
  `useSyncExternalStore` read the switch already does.
- `PendingCoursePage` in `src/components/pending-course-page/` — the skeleton the switch renders
  today, unchanged.
- `CoursePageGate({ title, children })` in `src/components/course-page-gate/` — pending shape until
  seeded, then `children`.

`CoursePageSwitch` keeps its own `useArrival` (it must freeze the first decision) but uses the
shared hook and pending shape. Passing `CourseDetailView` as both `detail` and `board` of the switch
was rejected: it hides intent and couples the new route to the switch's arrival rule.

### The tile takes a labelled link

`CourseProgressTile`'s `href?: string` becomes `link?: { href: string; label: string }`. The caller
translates the label (My learning: **View course**; board: **View course details**), so the tile no
longer reaches into `CourseCatalog.courseOverview.viewCourse`. When a link is given the heading's
text is wrapped in a `Link` with `tabIndex={-1}`: a larger mouse target, one keyboard stop.

- *Alternative: a second prop (`detailHref`).* Two optional links on one tile invite rendering both.

The board builds the link from `courseDetailPath(course)`; My learning keeps
`courseOverviewPath(course)`.

The link makes the course tile taller than the continue tile's minimum height, so on wide
viewports the board lets the continue tile fill its row (`flex-1`, as the course tile already
does); otherwise a band of empty page shows under the artwork.

### The enroll card links back

`CourseEnrollCard` renders a **Go to my progress** link to `courseOverviewPath(course)` beneath the
action when enrolled. On the course route this link appears after enrolling from the page and
leads to the board on the next render of that route, which is what the switch already specifies.

### The enrolled action reads the board's continue target

`CourseEnrollAction` renders three times on the page (hero, card, phone bar), so the target is read
by a hook each instance calls, `useCourseContinueTarget(view)` in
`src/hooks/use-course-continue-target/`. It reads the learner store's continue-watching records,
completion marks and playback positions — the same slices the board reads — keeps this course's
record, and returns `courseOverviewProgress(...).continueTarget`. One rule, one source: the action
and the board cannot disagree. The kind maps to the label as the continue tile maps it (`start` →
**Start course**, `continue` → **Continue where you left off**, `rewatch` → **Watch again**); `none`
renders nothing, as a course without videos does today.

- *Alternative: reuse the board's `useBoardProgress`.* It reads the continue-watching record through
  the repository port asynchronously, which adds a pending state the page does not need: every
  course-page route already waits for the seeded store, where the records live.

**Continue where you left off** does not fit on one line beside the course title in the phone
bar, so the bar keeps its title column at least 8.5 rem wide and lets the action's label wrap there;
the hero and the card keep it on one line, and the action's icons no longer shrink.

The two new labels join `Components.CourseEnrollAction` (`continueWhereLeftOff`, `watchAgain`), with
the same wording the continue tile uses.

### Messages

New keys, in `en`, `es` and `pt`:

- `CourseCatalog.courseOverview.viewCourseDetails` — "View course details" / "Ver detalle del curso"
  / "Ver detalhes do curso".
- `Components.CourseEnrollCard.goToProgress` — "Go to my progress" / "Ir a mi progreso" / "Ir para
  meu progresso".

## Risks / Trade-offs

- [Two addresses render the course page for a learner who has not joined] → Both sit behind
  sign-in and are not indexed; `/about` declares its own canonical through `shareMetadata`, so
  neither page claims the other's URL.
- [The board and the course page could pick different videos] → Both call `courseOverviewProgress`
  over the same store slices; the e2e spec asserts the same href on both.
- [Message files conflict with the poster-lobby change on merge] → Keys are added in their own
  spots under existing namespaces; a merge conflict there is mechanical.

## Testing strategy

- **Vitest unit** — `src/i18n/lesson-routes.test.ts`: `courseDetailPath` returns
  `/courses/<slug>/about` (mirrors the existing builder tests).
- **Vitest + RTL**
  - `use-is-learner-store-seeded.test.ts`: false until `learnerStore` is seeded, true after
    (mirrors the seeding set-up in `course-page-switch.test.tsx`).
  - `course-page-gate.test.tsx`: pending shape with the title as level-one heading before seeding,
    children after.
  - `course-page-switch.test.tsx`: existing tests keep passing after the extraction.
  - `course-progress-tile.test.tsx`: with `link`, the label links to `href` and the heading's link
    has `tabindex="-1"`; without `link`, no link renders.
  - `course-progress-board.test.tsx`: the tile links **View course details** to
    `/courses/<slug>/about`, also while progress is pending.
  - `course-enroll-card.test.tsx`: **Go to my progress** only when enrolled, pointing to the course
    route.
  - `use-course-continue-target.test.ts`: start with nothing watched, the board's next video with
    a record, rewatch when all is watched, `null` for a course without videos.
  - `course-enroll-action.test.tsx`: the label and href follow the target's kind.
  - `my-learning-view.test.tsx`: **View course** still links to the overview after the prop change.
- **Playwright** — `e2e/course-detail-page.spec.ts`, new describe block: an enrolled learner opens
  the board, follows **View course details**, lands on `/about` with the course page in its enrolled
  state, then **Go to my progress** returns to the board. Uses the existing
  `learner-profile-fixture` (learner enrolled in the Basic Course).
- **Visual** — Playwright MCP on the board and on `/about` at desktop and phone widths, `es`.
