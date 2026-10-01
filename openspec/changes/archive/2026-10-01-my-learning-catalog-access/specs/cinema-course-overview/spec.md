## MODIFIED Requirements

### Requirement: The course overview opens with a continue tile and the course's progress

The course overview (`/[locale]/courses/[courseSlug]/progress`) SHALL open with two tiles, side by side
on wide viewports and stacked on narrow ones:

- a **continue tile** presenting the video the learner continues with — its artwork (or a
  decorative placeholder when it has none), the lesson ordinal and the video's position in its
  lesson, the video's title — and exactly one primary action linking to that video through the
  locale-aware lesson path;
- a **course progress tile** presenting the course title as the page's level-one heading, a
  ring filled to the share of the course's videos that count as complete, that share as a
  percentage, the watched count out of the total, the time left, and **how many of the course's
  prizes the learner has claimed**, with the course's prizes drawn small beneath it.

The prize tally SHALL count the prizes claimed on the counter over the course's modules that hold
lessons — a module with no lessons has nothing to redeem and is counted by neither figure. Each drawn
prize SHALL be the coloured illustration when that module's prize has been claimed and the silhouette
until then, and SHALL be hidden from assistive technology, which hears the tally's sentence instead.

The video and the action's label SHALL be decided from this device's progress with
`countsAsComplete`:

- **Nothing watched** — the course's first video, labelled **Start course**.
- **Partly watched** — the video the module overview's route would mark as current, applied to
  the whole course in `sequence` order (lessons in order, videos in order within each): the
  anchor is the video named by the continue-watching record when it names a video of this course
  that still exists, otherwise the furthest video with any progress; the target is the anchor
  itself when it is not complete, otherwise the first incomplete video after it, otherwise the
  first incomplete video of the course. Labelled **Continue where you left off**.
- **Everything watched** — the course's first video, labelled **Watch again**.

Time left SHALL be the sum, over incomplete videos, of each runtime minus its saved position.

Because progress is read from this device after hydration, the tiles SHALL render on the
server and before progress is known without asserting any state: the course title, an
unfilled ring with no percentage, and placeholders of the continue tile's text and action.
Before the claims have been read, no prize SHALL render as claimed.
When the course has no lessons, the page SHALL render no continue tile.

#### Scenario: A new learner is invited to start
- **WHEN** no video of the course counts as complete, none has a saved position and no record names this course
- **THEN** the continue tile shows the first video and a single Start course action linking to it, and the course tile shows 0 %

#### Scenario: A returning learner continues the recorded video
- **WHEN** the continue-watching record names the second video of the second lesson of this course and that video is not complete
- **THEN** the continue tile shows that video, "Lesson 02 · Video 2 of 17", and Continue where you left off linking to it

#### Scenario: A finished recorded video continues with the next one
- **WHEN** the continue-watching record names the first video of the fifth lesson and that video is complete
- **THEN** Continue where you left off links to the second video of the fifth lesson, not to the finished one

#### Scenario: The last video of a lesson hands over to the next lesson
- **WHEN** the record names the last video of the second lesson and that video is complete
- **THEN** Continue where you left off links to the first incomplete video of the third lesson

#### Scenario: Without a record the furthest progress anchors the target
- **WHEN** no record names this course, the first video of the first lesson is part-watched and the first two videos of the third lesson are complete
- **THEN** Continue where you left off links to the third video of the third lesson

#### Scenario: A record for another course falls back to this course's progress
- **WHEN** the record names another course and the first three videos of this course's second lesson are complete
- **THEN** Continue where you left off links to the fourth video of the second lesson

#### Scenario: A finished course offers to watch again
- **WHEN** every video of the course counts as complete
- **THEN** the course tile shows 100 % and the continue tile's action reads Watch again and links to the first video

#### Scenario: The course tile states progress in videos and time
- **WHEN** 2 of 48 videos are complete and the remaining runtime minus saved positions is 10 h 7 min
- **THEN** the course tile shows 4 %, "2 of 48 videos" and "10 h 7 min left"

#### Scenario: The course tile states the prizes claimed
- **WHEN** the learner has claimed the prize of `Introduction` and the course holds five lessons
- **THEN** the course tile states 1 of 5 prizes, drawing the `Introduction` prize in colour and the other four as silhouettes

#### Scenario: A finished course whose prizes are unclaimed counts none
- **WHEN** every video of the course counts as complete and no prize has been claimed
- **THEN** the course tile shows 100 % and states 0 of 5 prizes, with every prize a silhouette

#### Scenario: The server render asserts no progress
- **WHEN** the course overview is rendered on the server
- **THEN** the course title is present, the ring is unfilled with no percentage, and the continue tile shows placeholders instead of a label

#### Scenario: A course with no lessons has no continue tile
- **WHEN** the course has no lessons
- **THEN** no continue tile and no continue action render

#### Scenario: A pointer resting on the continue tile keeps its link
- **WHEN** the pointer rests on the continue tile's poster, away from its action
- **THEN** the tile's link stays under the pointer, so the cursor and the hover style do not flicker

### Requirement: The progress board is for learners enrolled in the course

The course overview's progress board SHALL render only for a learner who is enrolled in the course when the learner store is first
seeded on the route; the board is the continue tile, the course progress tile and the lesson ring
tiles. Any other learner SHALL see the course page (`course-detail-page`) instead. The
board's own requirements are unchanged when it renders.

#### Scenario: Enrolled on arrival
- **WHEN** a learner enrolled in `basic-course` opens `/en/courses/basic-course/progress`
- **THEN** the continue tile, the course progress tile and one ring tile per lesson render

#### Scenario: Not enrolled on arrival
- **WHEN** a learner not enrolled in `atlas-of-american-sounds` opens its route
- **THEN** no continue tile and no ring tile render, and the course page does

### Requirement: The course progress tile leads to the course page

On the progress board, the course progress tile SHALL end with a **View course details** link to the
course page's own route (`/[locale]/courses/[courseSlug]/about`, `course-detail-page`) through the
locale-aware path, beneath the prizes. The course title SHALL link to the same page; that link SHALL
be left out of the tab order so keyboard users meet one link, not two, and the heading SHALL keep
its level and text. Both links SHALL render on the server and before progress is known, since they
depend on no progress. The link text SHALL read **Ver detalle del curso** in `es` and **Ver detalhes
do curso** in `pt`.

#### Scenario: The board links to the course page
- **WHEN** a learner enrolled in `basic-course` opens `/en/courses/basic-course/progress`
- **THEN** the course progress tile shows **View course details** linking to `/en/courses/basic-course/about`

#### Scenario: The title links to the course page
- **WHEN** the learner clicks the `Basic Course` heading in the course progress tile
- **THEN** the course page opens at `/en/courses/basic-course/about`

#### Scenario: One tab stop
- **WHEN** a keyboard user tabs through the course progress tile
- **THEN** focus lands on **View course details** once and not on the title

#### Scenario: Spanish board
- **WHEN** the board renders under `/es`
- **THEN** the link reads **Ver detalle del curso** and points to `/es/courses/basic-course/about`

#### Scenario: Before progress is read
- **WHEN** the board renders on the server
- **THEN** **View course details** is present while the ring shows no percentage

## ADDED Requirements

### Requirement: The progress board has its own address

The course's progress board SHALL be served at `/[locale]/courses/[courseSlug]/progress`. The bare course address `/[locale]/courses/[courseSlug]` SHALL have no page and SHALL render the localized page-not-found state; it SHALL NOT redirect. Every link to the board SHALL be built with the course overview path helper, so no screen links to the bare address. The board's sharing image SHALL be served at `/[locale]/courses/[courseSlug]/progress/opengraph-image`, and its loading shell SHALL apply to the board only.

#### Scenario: The board opens at /progress
- **WHEN** a learner enrolled in `basic-course` opens `/es/courses/basic-course/progress`
- **THEN** the progress board renders

#### Scenario: The bare address is a missing page
- **WHEN** a learner opens `/es/courses/basic-course`
- **THEN** the page-not-found state renders, and the learner is not redirected

#### Scenario: Links lead to /progress
- **WHEN** My learning, the course page, the lesson breadcrumb or the levels table link to a course's board
- **THEN** the link points to `/[locale]/courses/[courseSlug]/progress`

#### Scenario: The board's sharing image
- **WHEN** `/en/courses/basic-course/progress` renders
- **THEN** its `og:image` is `/en/courses/basic-course/progress/opengraph-image`, which answers an image
