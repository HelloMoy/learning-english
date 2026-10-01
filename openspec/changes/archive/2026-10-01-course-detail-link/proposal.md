## Why

A learner enrolled in a course only ever reaches its progress board: `/[locale]/courses/[courseSlug]`
shows the course page (what it teaches, its sounds, its syllabus, the pace picker) to learners who
have not joined, and nothing on the board leads there. The course page has no address of its own,
so a link to the course route sends an enrolled learner straight back to the board. The design
review (artifact "Acceso a Ver curso") picked the recommended variant: the board's course progress
tile leads to the course page, with a link reading **View course details**.

## What Changes

- The course page gets its own route, `/[locale]/courses/[courseSlug]/about`, that renders the
  course page to **every** learner — joined or not — in the state their enrollment calls for.
  Before the learner store is seeded it renders the same pending shape the course route does.
- `/[locale]/courses/[courseSlug]` keeps deciding between the course page and the board exactly as
  today, so every existing link (Available courses, My learning, breadcrumbs, levels table) keeps
  working unchanged.
- The progress board's course progress tile ends with a **View course details** link (es: **Ver
  detalle del curso**, pt: **Ver detalhes do curso**) to the course's `/about` route, and its course
  title links there too.
- The course page's enroll card, once the learner is enrolled, offers **Go to my progress**, a
  link to the course route, so a learner who arrived from the board has a way back.
- Once the learner is enrolled, the course page's action follows the learner's progress the way
  the board's continue tile does: **Start course** with nothing watched, **Continue where you left
  off** to the video the board would open, **Watch again** once everything is watched. Until now an
  enrolled learner with progress was offered **Start course** and sent back to the first video.
- My learning's progress panel, which reuses the same tile, links its course title to the course
  overview as well as its **View course** link.
- A `courseDetailPath` route builder joins the ones in `src/i18n/lesson-routes.ts`.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `course-detail-page`: the course page is also served from its own route, `/about`, to any
  learner; the enrolled enroll card links back to the progress board; the enrolled action follows
  the learner's progress.
- `cinema-course-overview`: the course progress tile on the board links to the course page.
- `my-learning`: the progress panel's course title links to the course overview.

## Non-goals

- Moving the course page off `/[locale]/courses/[courseSlug]` or redirecting learners who have not
  joined to `/about`. The existing route keeps its switch; `/about` is an additional address.
- Changing Available courses' links (the courses-poster-lobby change owns that page).
- Rewording the enroll card's enrolled body ("It's in My learning. Start whenever you like.").
- A structured-data block or a dedicated Open Graph image for `/about`; it inherits the course
  route's image and carries its own metadata only.
- Adding `/about` to the sitemap; course routes sit behind sign-in.

## Impact

- **Routes**: new `src/app/[locale]/courses/[courseSlug]/about/page.tsx`.
- **Components**: `CourseProgressTile` (a labelled link instead of a bare `href`, title link),
  `CourseProgressBoard` (passes the course page link), `MyLearningView` (new link prop shape),
  `CourseEnrollCard` (enrolled link back), `CoursePageSwitch` (pending shape shared with the new
  route).
- **Routing helpers**: `courseDetailPath` in `src/i18n/lesson-routes.ts`.
- **Messages**: new keys in `en`, `es`, `pt`.
- **Tests**: unit and component tests for the above; an e2e spec for board → course page → board.
