# Capability: cinema-course-overview

## Purpose

Define the Immersion Cinema presentation of the course overview route (`/[locale]/courses/[courseSlug]`). The course is presented as a numbered index of its modules: a course header with gold count pills, then one full-width showcase card per module, each preceded by its ordinal. A card pairs the module's title, an explicit video count and duration, and a call to action with a receding gallery of that module's leading lesson artwork, so a module reads as a container of several videos rather than as one video to play. A primary "Start course" action targets the deterministic first lesson. Neither the earlier interactive practice track nor the poster grid that replaced it remains in this view.
## Requirements
### Requirement: The course overview opens with a continue tile and the course's progress

The course overview (`/[locale]/courses/[courseSlug]`) SHALL open with two tiles, side by side
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

### Requirement: Every lesson is a progress-ring tile that opens its lesson

Below the opening tiles the course overview SHALL render one tile per lesson (module) in
`sequence` order, all visible without paging. A tile SHALL show the lesson's artwork (the first
video's poster, or a decorative placeholder), the lesson ordinal as an outlined numeral, a ring
filled to the share of the lesson's videos that count as complete with that share as a
percentage, the lesson title, the watched count out of the lesson's videos with the time
left in the lesson (**All watched** when completed), and **the prize that lesson redeems**. On wide
viewports the tile SHALL also show a
status chip — **Completed**, **In progress** or **Not started**; on narrow viewports the row's
leading ring and meta line carry that state and no chip renders.

The prize SHALL be drawn on the tile's artwork, opposite the ordinal: the coloured illustration once the
learner has claimed it on the counter, and the silhouette until then — completing the lesson readies its
prize but does not reveal it. The illustration SHALL be decoration, hidden from assistive technology and
adding no control and no tab stop to the tile.

A tile SHALL NOT list the lesson's videos. Activating a tile SHALL open the lesson's module
overview for the active locale — or, when the lesson holds exactly one video, that video's
page. When the learner has progress to continue (a continue tile labelled Continue where you
left off), the lesson holding the continue tile's video SHALL be visually emphasized; a course
not started or fully watched emphasizes no lesson.

On wide viewports the tiles SHALL sit in a grid of up to five per row; on narrow viewports each
tile SHALL be a full-width row led by its ring. The page SHALL NOT scroll horizontally.

Before progress is known, tiles SHALL render with unfilled rings, no percentage and no status,
their prize as a silhouette, and their meta line SHALL state the lesson's video count and runtime. All
tile copy SHALL be
localized (en/es/pt) and every tile SHALL carry an accessible name that includes the lesson
title.

#### Scenario: One tile per lesson, in order
- **WHEN** the course resolves 5 lessons
- **THEN** 5 lesson tiles render in `sequence` order, each with its ordinal and title

#### Scenario: A tile states the lesson's progress
- **WHEN** 1 of the 17 videos of Vowels is complete and 2 h 24 min remain in it
- **THEN** its tile shows 6 %, In progress, "1/17" and "2 h 24 min left", and it is emphasized

#### Scenario: A completed lesson reads as completed
- **WHEN** every video of Introduction is complete
- **THEN** its tile shows 100 %, Completed and All watched

#### Scenario: A completed lesson keeps its prize hidden until it is claimed
- **WHEN** every video of Introduction is complete and its prize has not been claimed
- **THEN** its tile draws the prize as a silhouette

#### Scenario: A claimed prize is drawn in colour
- **WHEN** the learner has claimed the prize of Introduction on the counter
- **THEN** its tile draws the whistle in colour, and the illustration is hidden from assistive technology

#### Scenario: A tile opens the module overview
- **WHEN** the learner activates the tile of a lesson holding several videos
- **THEN** they navigate to that lesson's module overview for the active locale

#### Scenario: A one-video lesson opens its video
- **WHEN** the learner activates the tile of a lesson holding exactly one video
- **THEN** they navigate to that video's page

#### Scenario: Tiles never list videos
- **WHEN** the course overview renders in any progress state
- **THEN** no tile renders the titles of the lesson's videos

#### Scenario: The page does not scroll sideways on a phone
- **WHEN** the course overview renders at 390px wide
- **THEN** each lesson tile is a full-width row and the document does not scroll horizontally

