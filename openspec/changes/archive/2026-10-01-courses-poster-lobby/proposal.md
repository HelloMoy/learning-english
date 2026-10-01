## Why

Available courses (`/[locale]/courses`) leads with a 26 rem cinema frame even for a learner at 0 %,
which pushes the rest of the catalog below the fold, and gives the Level 2 course and the reference
course identical cards. The design review (artifact "Cursos disponibles · variantes") picked
**Cartelera** (variant 3): every course as a vertical poster side by side, so the whole catalog fits
on the first screen and no course dominates the others. For a learner who has joined nothing yet, the
review's **Continuar primero** bar (variant 6) says in one line what to do first.

## What Changes

- **BREAKING (layout)** Available courses drops the cinema hero, **Your other courses** and **More
  courses**. Under the page heading, every catalog course renders as a **course poster** in one
  lobby grid (three columns on wide screens, one on phones): the courses the learner is enrolled in
  first — the most recently watched leading — then the rest in catalog order.
- A poster for an **enrolled** course shows its continue target's artwork, a Level N / Reference chip
  and an Enrolled (or Completed) chip, a progress ring, "Next up · <video>" or "Resume at m:ss ·
  <video>", the title, the course brief, the videos watched and the time left, **Continue course** /
  **Start course** / **Watch again** and **View progress**, and a progress edge along its bottom.
- A poster for a course the learner has **not joined** shows its first video's artwork, the Level N /
  Reference chip, its modules · videos · runtime, the title, the course brief, how many prizes it
  awards, **Enroll** and **View details**.
- The **course brief**: **For** (who the course is for, one sentence) and **You'll learn** (three
  short points), read in the active locale. A course that declares neither shows no brief.
- A learner enrolled in **no course** sees a **next-up bar** above the page heading for the first
  level course: its first video's thumbnail, "Next up · <course>", the video title, "Module 01 ·
  0 of N videos · T left", a 0 % ring, **Start course** (opens the first video) and **View course**.
  The bar leaves as soon as the learner is enrolled in any course.
- Course manifests may declare `audience` (one sentence) and `highlights` (short points), and both
  in `translations`; `courseCopy` returns them per locale. All three tracked courses declare them in
  en, es and pt.
- `CourseCinemaHero`, `EnrolledCourseCard` and `CourseShelfCard`, used only by this page, are removed
  with their stories, tests and messages.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `available-courses`: the featured hero, the other-courses section and the shelf are replaced by a
  poster lobby of every catalog course and, for a learner enrolled in nothing, a next-up bar.
- `course-content-storage`: manifests may declare a course's audience and highlights, translated
  like its description and outcomes.
- `course-detail-page`: its hero no longer refers to an Available courses hero, which this change
  removes; what the hero shows is unchanged.

## Non-goals

- Changing My learning (`/learning`), the course page or the progress board. They keep their own
  layouts; `useCourseShelf` keeps its current shape for My learning.
- Showing the next-up bar to an enrolled learner. With at least one enrollment the lobby's first
  poster already carries the way back in.
- Other variants from the review (Marquesina, Escalera, Índice, Boletos, …).
- Rewording the long `outcomes`; the course page keeps them as they are.
- Scaling the lobby past three courses beyond letting the grid wrap to a new row.

## Impact

- **Domain**: `Course` and `CourseTranslation` gain optional `audience` and `highlights`.
- **Adapters**: `CourseManifest` schema gains the two fields; `flattenCourseManifests` passes them.
- **Content**: `src/content/*.json` gain `audience`, `highlights` and their es/pt translations.
- **Lib**: `courseCopy` returns `audience` and `highlights`; a pure `courseLobby` orders the posters.
- **Components**: new `CoursePoster`, `CourseBrief` and `NextUpBar` (stories, tests, JSDoc,
  `Components.*` messages in en/es/pt); `AvailableCoursesView` rewritten; three components removed.
- **E2E**: `available-courses.spec.ts` and the specs that locate the removed test ids
  (`course-shelf-card`, `enrolled-course-card`, `course-cinema-hero`) are updated.
- No new dependencies.
