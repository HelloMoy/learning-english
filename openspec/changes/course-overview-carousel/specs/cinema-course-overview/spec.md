## ADDED Requirements

### Requirement: The course overview opens with a compact hero that carries Start course

The course overview (`/[locale]/courses/[courseSlug]`) SHALL open with a hero presenting a
"Now showing" eyebrow stating the number of lessons (modules), the course title, one meta
line stating the number of videos and the combined runtime (with an hours component above
60 minutes), and the primary **Start course** action linking to the deterministic first
lesson through the locale-aware lesson path.

The meta line SHALL sit below the title and SHALL NOT overlap it at any viewport width. The
page SHALL render exactly one Start course action, and none when the course has no lessons.

#### Scenario: The hero states what the course holds
- **WHEN** a course resolves with 5 modules holding 48 videos totalling 629 minutes
- **THEN** the hero shows an eyebrow naming 5 lessons, the course title, and a meta line stating 48 videos and 10 h 29 min

#### Scenario: Start course opens the first lesson
- **WHEN** a first lesson exists
- **THEN** a single Start course action links to that lesson for the active locale

#### Scenario: A course with no lessons has no action
- **WHEN** the course has no lessons
- **THEN** the hero renders no Start course action

#### Scenario: The meta line never overlaps the title
- **WHEN** the hero renders at 1440px and at 390px wide
- **THEN** the meta line's box starts below the title's box

### Requirement: Modules are presented as a poster carousel with one selected module

After the hero the course overview SHALL present one **poster** per module in `sequence`
order inside a carousel. Exactly one module SHALL be selected at a time.

A poster SHALL show a portrait collage of up to three of the module's first lessons'
posters (one image when the module holds one lesson; a decorative placeholder when none has
artwork), the module ordinal as an outlined numeral, the module title, and a line stating the
module's video count and combined runtime.

The selected poster SHALL be centred, larger than the others and edged in gold. Posters
nearer the selection SHALL be larger and more opaque than posters further from it. On wide
viewports up to two posters SHALL be visible on each side of the selection; on narrow
viewports the neighbours SHALL peek in from the screen edges. The carousel SHALL NOT make the
page scroll horizontally.

The selection SHALL move by: previous/next arrow buttons (each disabled at its end), one dot
per module, the Left/Right arrow keys while focus is within the carousel, a horizontal swipe
on touch screens, and a click on a non-selected poster. Clicking the selected poster SHALL
open its module overview — or, when the module holds exactly one lesson, that lesson.

The carousel SHALL be announced as a carousel region; every control SHALL carry a localized
accessible name; the dot for the selected module SHALL be marked current; a selection change
SHALL be announced politely as "Lesson N of M: <title>".

On first render the first module SHALL be selected. After hydration the carousel SHALL select
the first module, in `sequence` order, that the learner has started but not finished; when
there is none, the first module they have not finished; otherwise the first module.

#### Scenario: One poster per module, in order
- **WHEN** the course resolves 10 modules
- **THEN** the carousel holds 10 posters in `sequence` order and 10 dots

#### Scenario: A poster shows real artwork and its counts
- **WHEN** a module holding 25 videos totalling 325 minutes is rendered
- **THEN** its poster shows up to three of its lessons' posters, its ordinal, its title and "25 videos · 5 h 25 min"

#### Scenario: Arrows move the selection and stop at the ends
- **WHEN** the first module is selected
- **THEN** the previous arrow is disabled, and activating the next arrow selects the second module

#### Scenario: A dot selects its module
- **WHEN** the learner activates the fourth dot
- **THEN** the fourth module becomes selected and its dot is marked current

#### Scenario: Keyboard arrows move the selection
- **WHEN** focus is inside the carousel and the learner presses the Right arrow key
- **THEN** the next module becomes selected

#### Scenario: Clicking a neighbour selects it
- **WHEN** the learner clicks a poster that is not selected
- **THEN** that module becomes selected and no navigation happens

#### Scenario: Clicking the selected poster opens the module
- **WHEN** the learner clicks the selected poster of a module holding several lessons
- **THEN** they navigate to that module's overview for the active locale

#### Scenario: Clicking the selected poster of a one-video module opens that video
- **WHEN** the learner clicks the selected poster of a module holding exactly one lesson
- **THEN** they navigate straight to that lesson's page

#### Scenario: The carousel opens on the module in progress
- **WHEN** the learner has completed some but not all videos of the third module and none of the others
- **THEN** after hydration the third module is selected

#### Scenario: The carousel does not widen the page on a phone
- **WHEN** the course overview renders at 390px wide
- **THEN** the document does not scroll horizontally

### Requirement: A progress panel invites the learner into the selected module

Below the carousel the course overview SHALL render a progress panel for the selected module,
updating whenever the selection changes. The panel SHALL be in exactly one state, decided with
the same completion rule as every other progress indicator (`countsAsComplete`):

- **Not started** — no video of the module is complete and none has a saved playback
  position. The panel SHALL show a ring divided into one segment per video with the first
  segment lit and "N videos ready", a **Start this lesson** action opening the module's first
  video, the module's runtime and the first video's title.
- **In progress** — at least one video is complete or has a saved position, and not all are
  complete. The panel SHALL show a ring filled to the share of completed videos with its
  percentage and "C of N videos", "Pick up <title>" naming the first video in `sequence`
  that is not complete, that video's position ("Video K of N"), the time left in it (its
  runtime minus its saved position) and the time left in the module (the remaining time of
  every incomplete video), a **Continue** action opening that video, and an **Open lesson**
  action opening the module overview.
- **Completed** — every video is complete. The panel SHALL show a full ring, "All N videos
  watched", a **Watch again** action opening the first video, and an **Open lesson** action.

In the not-started and in-progress states the panel SHALL list, as "Up next", up to three
videos that follow the video its primary action opens, each with its position, title and
runtime.

Because progress is read from this device after hydration, the panel SHALL render on the
server and before hydration without asserting any state: the module title, its meta line and
an Open lesson action, with the ring track unfilled.

#### Scenario: An untouched module invites the learner to start
- **WHEN** the selected module holds 25 videos and none is complete or has a saved position
- **THEN** the panel shows 25 ring segments with the first lit, "25 videos ready", and Start this lesson linking to the module's first video

#### Scenario: A module in progress offers to continue
- **WHEN** the first three of 25 videos are complete and the fourth, "/Flap/", running 13 minutes, has a saved position of 6 minutes
- **THEN** the panel shows 12%, "3 of 25 videos", "Pick up /Flap/", "Video 4 of 25", 7 min left in the video, and Continue linking to "/Flap/"

#### Scenario: Time left in the module counts only unfinished videos
- **WHEN** a module is in progress
- **THEN** the time left in the module is the sum, over incomplete videos, of each runtime minus its saved position

#### Scenario: A finished module offers to watch again
- **WHEN** every video of the selected module is complete
- **THEN** the panel shows a full ring, "All N videos watched", Watch again linking to the first video, and Open lesson

#### Scenario: Up next follows the primary action
- **WHEN** the panel's primary action opens the fourth video of 25
- **THEN** Up next lists the fifth, sixth and seventh videos with their titles and runtimes

#### Scenario: Up next stops at the end of the module
- **WHEN** the primary action opens the last video of the module
- **THEN** no Up next list is rendered

#### Scenario: The panel follows the selection
- **WHEN** the learner selects a different module in the carousel
- **THEN** the panel re-renders for that module

#### Scenario: The server render asserts no progress
- **WHEN** the course overview is rendered on the server
- **THEN** the panel shows the selected module's title, meta line and Open lesson, and no state-specific copy or filled ring

#### Scenario: Panel copy is localized
- **WHEN** the locale is `es` or `pt`
- **THEN** every panel and carousel string renders from the matching message file

## REMOVED Requirements

### Requirement: Course overview renders modules as showcase cards
**Reason**: Replaced by the poster carousel (J3) and the progress panel (K3) after design review.
**Migration**: See "Modules are presented as a poster carousel with one selected module" and "A progress panel invites the learner into the selected module".

### Requirement: Showcase cards report how far the learner has got through the module
**Reason**: The showcase card no longer exists; module progress is shown by the panel's ring for the selected module.
**Migration**: See "A progress panel invites the learner into the selected module".

### Requirement: A showcase card is clickable across its whole area
**Reason**: A module is now opened from the selected poster in the carousel, or from the panel's actions.
**Migration**: See "Modules are presented as a poster carousel with one selected module".
