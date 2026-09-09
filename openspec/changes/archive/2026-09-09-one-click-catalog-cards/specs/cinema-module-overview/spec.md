## ADDED Requirements

### Requirement: A video row is clickable across its whole area

A video row is one object — a full-width band holding one lesson's thumbnail, ordinal, title, progress and duration — so a pointer landing anywhere in the row SHALL navigate to that lesson's page, not only a pointer landing on the trailing action.

The extended hit area SHALL be an extension of that trailing action, not a new control. The row SHALL therefore continue to expose exactly one announced and tabbable link, and its accessible name SHALL remain the action's own label rather than the row's whole text.

The row SHALL show a pointer-driven hover treatment, so the area that responds to a click is the area that looks like it will.

#### Scenario: Clicking the row body opens the lesson
- **WHEN** the user clicks the row's title, its ordinal, its progress bar or its duration
- **THEN** they navigate to that row's lesson for the active locale — the same destination as the row's trailing action

#### Scenario: The row still exposes exactly one control
- **WHEN** a screen reader or keyboard user traverses a video row
- **THEN** exactly one link is announced and reachable for that row, as before the hit area was extended, and the row itself is not announced as a link

#### Scenario: The row shows it is clickable
- **WHEN** the pointer moves over any part of a row
- **THEN** the row shows a hover treatment covering the whole band rather than only under the trailing action

## MODIFIED Requirements

### Requirement: Video rows mark lessons the learner has already completed

In the module overview's video list, a row whose lesson has been completed SHALL carry
a completion indicator distinguishing it from lessons not yet taken, so a learner
scanning a module can see how far they got. The indicator SHALL be perceivable without
relying on colour alone and SHALL carry a localized accessible name.

A row whose lesson has been partly watched SHALL additionally carry a **watch progress
bar** with its percentage label, as specified by the `watch-progress` capability,
positioned within the row's central column beneath the lesson title so it spans the
row's open middle rather than crowding the eyebrow, the duration or the action. A
completed row SHALL show the bar full.

Neither indicator SHALL replace or suppress any existing part of the row: the
`Video N` eyebrow, the lesson title, the duration and the trailing action all remain,
and the row SHALL keep its existing single tabbable control — neither indicator is
interactive.

Because completion and playback position are read in the browser after hydration (see
the `lesson-progress` and `watch-progress` capabilities) while the module overview is
server-rendered, the completion indicator and the progress bar SHALL be the only
client-rendered parts of the row; the rest of the video list SHALL continue to render
on the server. No explicit "not completed" marker SHALL be rendered at any time, and a
row with nothing watched SHALL render no bar.

#### Scenario: A completed lesson is distinguishable in the video list
- **WHEN** the module overview renders a lesson the learner has completed
- **THEN** that row shows the completion indicator and a full progress bar, and rows for lessons never opened show neither

#### Scenario: A partly watched lesson shows how far it got
- **WHEN** the module overview renders a lesson with a stored position of 240 seconds against a 600-second duration
- **THEN** that row shows a progress bar filled to 40% with its percentage label, and no completion mark

#### Scenario: The indicators do not displace the row's existing content
- **WHEN** a watched lesson's row renders
- **THEN** it still shows its `Video N` eyebrow, title, duration where known, and a working trailing action

#### Scenario: The row keeps one control
- **WHEN** a row carrying a progress bar is reached by keyboard
- **THEN** the trailing action remains the row's single tab stop; the bar is not focusable

#### Scenario: The video list stays server-rendered
- **WHEN** the module overview is rendered
- **THEN** only the completion indicator and the progress bar are client-rendered; the rows, header and back link are produced on the server as before

#### Scenario: The indicator is announced, not merely coloured
- **WHEN** a screen reader reaches a completed lesson's row
- **THEN** the completed state is announced through a localized accessible name, and the distinction does not depend on colour alone

#### Scenario: A reading lesson's row carries no bar
- **WHEN** a row renders for a lesson with no duration
- **THEN** it shows no progress bar, and its completion mark still reflects the manual button

### Requirement: Module overview renders as a video list

The module overview (`/[locale]/courses/[courseSlug]/modules/[moduleSlug]`) SHALL present a back link to the course, an eyebrow stating how many videos the module holds and its ordinal (`N videos · Lesson NN`), the module title, and an ordered list of video rows. Each row SHALL show a thumbnail/play affordance, a `Video N` eyebrow, the lesson title, its duration for video lessons, and a trailing action linking to the Lesson Page. All copy SHALL be localized and links SHALL be locale-aware.

The trailing action SHALL be labelled with what it does — watch this lesson's video — rather than with the generic `Open`. Every row on the page carries the same label, so a word that names no destination tells the learner nothing about which of the two things on the page (the module, the video) they are about to reach.

The header SHALL NOT render a decorative hero tile for the module. A `Module` carries no artwork, so such a tile could only repeat the ordinal the eyebrow already states and a truncation of the title beneath it, while displacing the video list.

Rows SHALL NOT be labelled `Episode N`. The term `Episode` previously denoted a `Module` on the course overview and a `Lesson` here, so a learner who opened "episode 3" landed on a list restarting at "Episode 1"; the `course-vocabulary` capability fixes each term to one level.

Each row's thumbnail SHALL render the lesson's `poster` artwork when the lesson has one, and SHALL fall back to the decorative gradient tile with a play affordance when it does not. The thumbnail SHALL navigate to the same lesson as that row's trailing action when activated with a pointer. Because it duplicates a destination the row already exposes, the thumbnail SHALL be excluded from the accessibility tree and from the tab order, leaving the trailing action as the row's single announced and tabbable control.

#### Scenario: The header carries no decorative hero tile
- **WHEN** the module overview renders
- **THEN** the header shows the back link, the eyebrow and the module title only, and no gradient tile repeating the module ordinal or the first word of its title

#### Scenario: Video rows reflect real lessons in order
- **WHEN** the module resolves its lessons
- **THEN** rows render in `sequence` order, each labelled `Video N` with the real lesson title, and the trailing action links to that lesson for the active locale

#### Scenario: The trailing action names the video
- **WHEN** a video row renders in any supported locale
- **THEN** its trailing action reads as an invitation to watch that lesson's video, and no row is labelled `Open`

#### Scenario: Duration shown only when known
- **WHEN** a lesson is a video with a duration
- **THEN** the row shows a minute label; **AND WHEN** the lesson is a reading lesson
- **THEN** the duration is omitted rather than shown as zero

#### Scenario: Back link returns to the course overview
- **WHEN** the user activates the back link
- **THEN** they navigate to the course overview for the active locale

#### Scenario: A lesson with artwork shows it in its row
- **WHEN** a row renders for a lesson that has a `poster`
- **THEN** the thumbnail displays that poster image, so rows are visually distinguishable from one another rather than repeating one placeholder

#### Scenario: A lesson without artwork keeps the placeholder tile
- **WHEN** a row renders for a lesson that has no `poster` — including any reading lesson, whose schema has no such field
- **THEN** the thumbnail shows the decorative gradient tile with its play affordance, and no broken or empty image is rendered

#### Scenario: Clicking the thumbnail opens the lesson
- **WHEN** the user clicks a row's thumbnail
- **THEN** they navigate to that row's lesson — the same destination as the row's trailing action

#### Scenario: The thumbnail does not duplicate the row's control for assistive technology
- **WHEN** a screen reader or keyboard user traverses a video row
- **THEN** exactly one link is announced and reachable for that row — the trailing action — and the thumbnail is skipped, so a module's rows are never announced or tabbed through twice

#### Scenario: Retired vocabulary is absent
- **WHEN** the module overview renders in any supported locale
- **THEN** no row or eyebrow is labelled with an episode or season term

### Requirement: Video row titles stay legible on narrow viewports

In the module overview's video list, a lesson title too long for the space available SHALL remain legible rather than being cut to a prefix. On narrow viewports the title SHALL wrap onto as many lines as it needs; the single-line treatment is reserved for rows wide enough to show a title that distinguishes it from its neighbours.

This exists because these lesson titles share long prefixes. In the largest module every
title begins `Exercise N Pronunciation Step By Step Lesson`; truncated to the width of a
phone they all read `Exercise 1 Pronunciati…`, `Exercise 2 Pronunciati…`, and the list
stops being a way to choose a lesson. Truncation is only safe where enough of the title
survives to tell one row from the next.

Wrapping a title SHALL NOT change the row's other contents or their order — the eyebrow,
the completion mark, and the trailing action stay as they are; the row simply grows taller.

#### Scenario: A long title wraps rather than truncates on a phone
- **WHEN** the module overview renders at a 320px or 390px viewport width for a module whose lesson titles exceed one line
- **THEN** each title wraps across multiple lines and is readable in full, with no ellipsis

#### Scenario: Rows with shared prefixes stay distinguishable
- **WHEN** a module's lesson titles share a long common prefix and the list renders on a phone
- **THEN** the part of each title that differs from its neighbours is visible, so a learner can tell the rows apart

#### Scenario: The row keeps its structure when a title wraps
- **WHEN** a title wraps onto several lines
- **THEN** the row still shows its `Video N` eyebrow, its completion mark when the lesson is complete, and its trailing action, and that action remains fully within the viewport
