## Why

My learning (`/[locale]/learning`) returns the learner to their last video and lists their courses,
but the only way to the rest of the catalog is a small **Browse courses** link beside the Your
courses heading, below the fold on a phone. The design review ("Mi aprendizaje · variantes") picked
**Sala + Cartelera** (variant 8): keep the resume hero first and largest, and put the catalog in two
visible places — a persistent button beside the greeting for a learner who knows what they want, and
a catalog card in Your courses that names a real course they have not tried, so exploring has
content and is not just a link.

## What Changes

- A **See all courses** button opens `/[locale]/courses`, at the right of the greeting on wide
  screens and hidden on phones, where the catalog card leads to the catalog.
- The progress panel's **View course** becomes **View course details** and, with its title, opens the
  course page (`/[locale]/courses/[courseSlug]/about`).
- **Your courses** lays its cards out in three columns on wide screens (two on tablets, one on
  phones) and closes the grid with a **catalog card**, which opens `/[locale]/courses`. It shows:
  - the eyebrow **Catalog · N courses**, with N the number of catalog courses;
  - the heading **All available courses**;
  - how many of them the learner has not joined, or that they are enrolled in all of them;
  - when there is one, the first course in catalog order the learner has not joined, as a teaser:
    its first video's thumbnail, its title and its Level N / Reference label with its video count,
    opening that course's page (`/[locale]/courses/[courseSlug]/about`);
  - a primary **See all courses** call to action.
- Each enrolled course card's **View course** becomes **Progress** (the course overview) beside a new
  **Details** link to the course page (`/[locale]/courses/[courseSlug]/about`), in a split bar closing
  the card; the card's ring and title open the course overview too. Its action becomes one gold
  button across the card, reading **Start**, **Continue** or **Watch again**.
- Fix: a pointer resting on the resume hero (My learning) or the continue tile (progress board) no
  longer flickers between the hand and the arrow.
- **BREAKING (routes)** The progress board moves from `/[locale]/courses/[courseSlug]` to
  `/[locale]/courses/[courseSlug]/progress`. The bare address has no page any more and renders the
  page-not-found state (no redirect). The course page (`/about`), modules and lessons keep their
  addresses.
- **BREAKING (layout)** The **Browse courses** link beside the Your courses heading is removed; the
  See all courses button and the catalog card replace it.
- On wide screens the resume hero stretches to the height of the progress panel beside it, so the leading row reads as one block. The enrolled course cards are unchanged.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `my-learning`: Your courses loses the Browse courses link and gains the three-column grid and the
  catalog card; the leading block gains the See all courses button; each enrolled card offers
  Progress and Details.
- `cinema-course-overview`: the progress board is served at `/progress`; the bare course address has
  no page.
- `course-detail-page`, `cinema-home`, `course-content-storage`, `site-metadata`,
  `learner-onboarding`: their requirements name the board at its new address.

## Non-goals

- The other variants from the review (Cartelera, Dos carriles, Filas, Tablero, Taquilla, Enfoque,
  Ruta).
- Changing what `ResumeTile` or `CourseProgressTile` show (only the hero's hover flicker is fixed).
- Enrolling from My learning. The catalog card only leads to Available courses; enrolling stays there
  and on the course page.
- Choosing the teased course by anything smarter than catalog order (next level, recommendations).
- Available courses (`/[locale]/courses`) itself.

## Impact

- **Components**: new `CatalogCard` (`src/components/catalog-card/`) with stories, tests, JSDoc and
  `Components.CatalogCard` messages in en/es/pt; `MyLearningView` gains the button and the card and
  drops the Browse courses link.
- **Routes**: `src/app/[locale]/courses/[courseSlug]/page.tsx`, its `opengraph-image` and its
  `loading` shell move to `progress/`; `courseOverviewPath` returns `/courses/<slug>/progress`.
  `course-schema` and `ModuleOverviewError` stop hand-building the old URL.
- **Messages**: `MyLearning.browseCourses` is replaced by `allCourses`;
  `EnrolledCourseSummaryCard.viewCourse` by `viewProgress` and `viewDetails`.
- **E2E**: `home.spec.ts` covers the button and the cards on My learning; every spec that opened
  the board opens `/progress`; `not-found-routes.spec.ts` pins the bare address.
- No domain, adapter or dependency changes; `useCourseShelf` already exposes the courses the learner
  has not joined.
