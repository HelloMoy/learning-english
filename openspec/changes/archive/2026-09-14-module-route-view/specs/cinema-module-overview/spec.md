## MODIFIED Requirements

### Requirement: Module overview renders as a video list

The module overview (`/[locale]/courses/[courseSlug]/modules/[moduleSlug]`) SHALL present a back link to the course, an eyebrow stating the module's ordinal and the course title, the module title, a line stating how many videos the module holds and their total runtime, a module progress panel, and a **route**: an ordered sequence of steps, one per lesson, joined by a vertical rail. All copy SHALL be localized and links SHALL be locale-aware.

Each step SHALL carry a marker on the rail showing its state — **finished**, **current** or **upcoming** — and the state SHALL be perceivable without relying on colour alone. Steps SHALL render in `sequence` order and SHALL be labelled `Video N` with the real lesson title and, for video lessons, a minute label.

- An **upcoming** step SHALL show the lesson's thumbnail, the `Video N · M min` eyebrow, the title, and a trailing action labelled as watching that lesson's video.
- A **finished** step SHALL be compact: the `Video N · M min` eyebrow and the title, visually subordinate to upcoming steps, with a trailing action labelled as watching the video again. It SHALL NOT show a thumbnail.
- The **current** step is specified by the requirement "The current lesson is featured on the route".

The trailing action SHALL be labelled with what it does rather than with the generic `Open`.

The header SHALL NOT render a decorative hero tile for the module. A `Module` carries no artwork, so such a tile could only repeat the ordinal the eyebrow already states and a truncation of the title beneath it, while displacing the route.

Steps SHALL NOT be labelled `Episode N`; the `course-vocabulary` capability fixes each term to one level.

A thumbnail SHALL render the lesson's `poster` artwork when the lesson has one, and SHALL fall back to the decorative gradient tile with a play affordance when it does not. The thumbnail SHALL navigate to the same lesson as that step's action when activated with a pointer, and SHALL be excluded from the accessibility tree and from the tab order, leaving the step's action as its single announced and tabbable control.

#### Scenario: The header carries no decorative hero tile
- **WHEN** the module overview renders
- **THEN** the header shows the back link, the eyebrow, the module title and the videos-and-runtime line, and no gradient tile repeating the module ordinal or the first word of its title

#### Scenario: The header states the module's size
- **WHEN** a module holds 17 video lessons totalling 9,525 seconds
- **THEN** the header reads as 17 videos and 2 h 39 min in the active locale

#### Scenario: Steps reflect real lessons in order
- **WHEN** the module resolves its lessons
- **THEN** steps render in `sequence` order, each labelled `Video N` with the real lesson title, and each step's action links to that lesson for the active locale

#### Scenario: An upcoming step invites watching the video
- **WHEN** a step renders for a lesson that is neither finished nor current
- **THEN** it shows the lesson's thumbnail and an action reading as an invitation to watch that video, and no step is labelled `Open`

#### Scenario: A finished step recedes
- **WHEN** a step renders for a finished lesson
- **THEN** it shows no thumbnail, its title is visually subordinate to upcoming titles, its rail marker shows the finished state, and its action reads as watching the video again

#### Scenario: Duration shown only when known
- **WHEN** a lesson is a video with a duration
- **THEN** its step shows a minute label; **AND WHEN** the lesson is a reading lesson
- **THEN** the duration is omitted rather than shown as zero

#### Scenario: Back link returns to the course overview
- **WHEN** the user activates the back link
- **THEN** they navigate to the course overview for the active locale

#### Scenario: A lesson without artwork keeps the placeholder tile
- **WHEN** a step that shows a thumbnail renders for a lesson with no `poster`
- **THEN** the thumbnail shows the decorative gradient tile with its play affordance, and no broken or empty image is rendered

#### Scenario: The thumbnail does not duplicate the step's control for assistive technology
- **WHEN** a screen reader or keyboard user traverses a step
- **THEN** exactly one link is announced and reachable for that step, and the thumbnail is skipped

#### Scenario: Retired vocabulary is absent
- **WHEN** the module overview renders in any supported locale
- **THEN** no step or eyebrow is labelled with an episode or season term

### Requirement: Video rows mark lessons the learner has already completed

A step's state SHALL be derived from the learner's stored progress, using the existing
completion rule of the `lesson-progress` and `watch-progress` capabilities: a lesson is
**finished** when it counts as complete; otherwise it has a watched fraction between 0
and 1.

The finished marker SHALL carry a localized accessible name, so the finished state is
announced and does not rest on the marker's colour or glyph alone. A step whose lesson
is partly watched and is not the current step SHALL NOT render a progress bar; partial
progress is shown on the current step only.

Because completion and playback position are read in the browser after hydration while
the module's lessons are resolved on the server, the route and the progress panel SHALL
be client-rendered from lesson data the server resolves; the header and back link SHALL
remain server-rendered. No explicit "not completed" marker text SHALL be rendered.

#### Scenario: A completed lesson is distinguishable on the route
- **WHEN** the module overview renders a lesson the learner has completed
- **THEN** that step shows the finished marker with its localized accessible name, and steps for lessons never opened show the upcoming marker

#### Scenario: A lesson watched to the end counts as finished without the button
- **WHEN** a lesson has a stored position past its finish threshold and was never marked complete
- **THEN** its step renders as finished

#### Scenario: The header stays server-rendered
- **WHEN** the module overview is rendered
- **THEN** the back link, eyebrow, title and videos-and-runtime line are produced on the server, and only the route and the progress panel are client-rendered

#### Scenario: The indicator is announced, not merely coloured
- **WHEN** a screen reader reaches a finished step
- **THEN** the finished state is announced through a localized accessible name

## ADDED Requirements

### Requirement: The current lesson is featured on the route

The **current** lesson SHALL follow where the learner was last, so a learner who skips
ahead is not sent back to the start, and a learner who then returns to the start
continues there. It is found from an **anchor** lesson:

- The anchor SHALL be the **last opened** lesson — the lesson recorded by the
  `continue-watching` capability — when that record points to a lesson of this module.
- Otherwise — no record, or a record pointing outside this module — the anchor SHALL be
  the **furthest** lesson: the one with the highest `sequence` that has any progress
  (finished, or a watched fraction above 0).

From the anchor:

- When the anchor is not finished, it SHALL be the current lesson.
- When it is finished, the current lesson SHALL be the first unfinished lesson after it
  in `sequence` order.
- When no unfinished lesson follows it, the current lesson SHALL be the first unfinished
  lesson in the module.
- When there is no anchor, the current lesson SHALL be the first lesson.

Because the record holds the lesson opened last, opening an earlier lesson to review it
moves the current lesson to that point; the record cannot tell a review from a return to
the start, and a return to the start is what the learner means more often.

The current step SHALL be expanded into a featured card showing the lesson's poster
(or the gradient fallback), a "you are here" eyebrow naming `Video N`, the title, and one
primary action linking to the lesson.

When the current lesson is partly watched, the card SHALL show its watch progress bar
and the minutes left in that lesson, and the primary action SHALL read as continuing.
When it has not been started, the card SHALL show no bar and the primary action SHALL
read as starting the video.

A module in which every lesson is finished SHALL have no current step and SHALL feature
no card.

The featured card SHALL expose exactly one announced and tabbable link — its primary
action — with the poster excluded from the accessibility tree and the tab order.

#### Scenario: A learner going in order is featured the next video
- **WHEN** lessons 1–5 are finished and lesson 5 was opened last
- **THEN** step 6 is expanded into the featured card and no other step is expanded

#### Scenario: A learner who skipped ahead is not sent back to the start
- **WHEN** lessons 25–27 are finished, lesson 27 was opened last and lessons 1–24 have no progress
- **THEN** step 28 is featured, and steps 1–24 render as upcoming

#### Scenario: A learner who returned to the start continues there
- **WHEN** lessons 25–27 are finished, and afterwards lessons 1–2 were finished with lesson 2 opened last
- **THEN** step 3 is featured, not step 28

#### Scenario: A partly watched last opened lesson is featured itself
- **WHEN** lessons 25–27 are finished and lesson 7 was opened last and is partly watched
- **THEN** step 7 is featured

#### Scenario: A record from another module falls back to the furthest progress
- **WHEN** lessons 25–27 of this module are finished and the last opened lesson belongs to another module
- **THEN** step 28 is featured

#### Scenario: A partly watched furthest lesson is featured when there is no record
- **WHEN** there is no record, lesson 1 is finished, lesson 2 is not started and lesson 7 is partly watched
- **THEN** step 7 is featured, and step 2 renders as an upcoming step

#### Scenario: Nothing left after the anchor falls back to the first gap
- **WHEN** the last lesson of the module is finished and opened last, and lessons 3–24 have no progress
- **THEN** the first unfinished lesson, step 3 when 1–2 are finished, is featured

#### Scenario: An untouched module features its first video
- **WHEN** no lesson in the module has any progress
- **THEN** step 1 is featured

#### Scenario: A partly watched current lesson offers to continue
- **WHEN** the current lesson has a stored position of 264 seconds against a 660-second duration
- **THEN** the card shows a bar at 40%, states 7 minutes left, and its action reads as continuing

#### Scenario: An unstarted current lesson offers to start
- **WHEN** the current lesson has no stored position
- **THEN** the card shows no progress bar and its action reads as starting the video

#### Scenario: A finished module features nothing
- **WHEN** every lesson in the module is finished
- **THEN** no step is expanded and every step shows the finished marker

### Requirement: The module states its progress in a panel

The module overview SHALL render a module progress panel stating the percentage of the
module's lessons finished, drawn as a ring with the percentage as text, the count as
`N of M videos`, and the watch time left in the module. Time left SHALL be the sum over
the module's video lessons of the unwatched part of each duration, where a finished
lesson contributes nothing.

When every lesson is finished, the panel SHALL state that the lesson (module) is
completed instead of the count, using the `course-vocabulary` term, and SHALL NOT state
time left.

On viewports at or above the `lg` breakpoint the panel SHALL sit in a side column beside
the route and stay in view while the route scrolls; below it, the panel SHALL render
above the route. The ring SHALL be decorative, with the progress exposed as text.

#### Scenario: The panel counts finished lessons
- **WHEN** 5 of a module's 17 lessons are finished
- **THEN** the panel shows 29%, 5 of 17 videos, and the remaining watch time

#### Scenario: Time left discounts partial progress
- **WHEN** a module holds two 600-second lessons, one finished and one watched to 240 seconds
- **THEN** the panel states 6 minutes left

#### Scenario: A finished module says so
- **WHEN** every lesson is finished
- **THEN** the panel shows 100% and the completed label, and no time left

#### Scenario: The panel follows the viewport
- **WHEN** the page renders at 1440px wide
- **THEN** the panel sits beside the route; **AND WHEN** it renders at 390px wide
- **THEN** the panel sits above the route and the page does not scroll horizontally

### Requirement: Progress-dependent parts wait for the learner's progress

The route SHALL render every step as upcoming with no featured card, and the progress
panel SHALL render without figures, until the browser has read both the learner's stored
progress and the continue-watching record, so the first frame never asserts progress
that may be false. The featured card SHALL NOT be shown from progress alone while the
record is still being read, so it never appears on one lesson and then moves to
another. Once both are read, the route and panel SHALL update to the derived state.

#### Scenario: The first frame asserts nothing
- **WHEN** the module overview is rendered on the server
- **THEN** no step shows the finished or current state, no card is featured, and the panel shows no percentage, count or time left

#### Scenario: Progress appears after hydration
- **WHEN** the page hydrates on a device holding progress for the module
- **THEN** the finished steps, the featured card and the panel figures appear
