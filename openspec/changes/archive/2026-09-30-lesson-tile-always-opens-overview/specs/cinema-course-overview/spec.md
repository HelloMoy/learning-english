## MODIFIED Requirements

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
overview for the active locale, however many videos the lesson holds — a lesson holding a
single video opens its overview exactly as one holding several does. When the learner has progress to continue (a continue tile labelled Continue where you
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

#### Scenario: A one-video lesson opens its overview too
- **WHEN** the learner activates the tile of a lesson holding exactly one video
- **THEN** they navigate to that lesson's module overview for the active locale, not to the video's page

#### Scenario: Tiles never list videos
- **WHEN** the course overview renders in any progress state
- **THEN** no tile renders the titles of the lesson's videos

#### Scenario: The page does not scroll sideways on a phone
- **WHEN** the course overview renders at 390px wide
- **THEN** each lesson tile is a full-width row and the document does not scroll horizontally

