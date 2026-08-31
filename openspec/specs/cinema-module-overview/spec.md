# Capability: cinema-module-overview

## Purpose

Define the Immersion Cinema presentation of the module overview route (`/[locale]/courses/[courseSlug]/modules/[moduleSlug]`). The module is presented as a video list: a header carrying the back link, the module's video count and ordinal, and its title, followed by an ordered list of video rows — one per lesson — each showing a thumbnail/play affordance, a "Video N" eyebrow, the lesson title, duration when known, and an "Open" action that links to the Lesson Page.
## Requirements
### Requirement: Video rows mark lessons the learner has already completed

In the module overview's video list, a row whose lesson has been completed SHALL carry a completion indicator distinguishing it from lessons not yet taken, so a learner scanning a module can see how far they got. The indicator SHALL be perceivable without relying on colour alone and SHALL carry a localized accessible name.

The indicator SHALL NOT replace or suppress any existing part of the row: the `Video N` eyebrow, the lesson title, the duration and the "Open" action all remain.

Because completion is read in the browser after hydration (see the `lesson-progress` capability) while the module overview is server-rendered, the completion indicator SHALL be the only client-rendered part of the row; the rest of the video list SHALL continue to render on the server. No explicit "not completed" marker SHALL be rendered at any time.

#### Scenario: A completed lesson is distinguishable in the video list
- **WHEN** the module overview renders a lesson the learner has completed
- **THEN** that row shows the completion indicator, and rows for lessons not completed show none

#### Scenario: The indicator does not displace the row's existing content
- **WHEN** a completed lesson's row renders
- **THEN** it still shows its `Video N` eyebrow, title, duration where known, and a working "Open" action

#### Scenario: The video list stays server-rendered
- **WHEN** the module overview is rendered
- **THEN** only the completion indicator is client-rendered; the rows, hero and back link are produced on the server as before

#### Scenario: The indicator is announced, not merely coloured
- **WHEN** a screen reader reaches a completed lesson's row
- **THEN** the completed state is announced through a localized accessible name, and the distinction does not depend on colour alone

### Requirement: Module overview renders as a video list

The module overview (`/[locale]/courses/[courseSlug]/modules/[moduleSlug]`) SHALL present a back link to the course, an eyebrow stating how many videos the module holds and its ordinal (`N videos · Lesson NN`), the module title, and an ordered list of video rows. Each row SHALL show a thumbnail/play affordance, a `Video N` eyebrow, the lesson title, its duration for video lessons, and an "Open" action linking to the Lesson Page. All copy SHALL be localized and links SHALL be locale-aware.

The header SHALL NOT render a decorative hero tile for the module. A `Module` carries no artwork, so such a tile could only repeat the ordinal the eyebrow already states and a truncation of the title beneath it, while displacing the video list.

Rows SHALL NOT be labelled `Episode N`. The term `Episode` previously denoted a `Module` on the course overview and a `Lesson` here, so a learner who opened "episode 3" landed on a list restarting at "Episode 1"; the `course-vocabulary` capability fixes each term to one level.

Each row's thumbnail SHALL render the lesson's `poster` artwork when the lesson has one, and SHALL fall back to the decorative gradient tile with a play affordance when it does not. The thumbnail SHALL navigate to the same lesson as that row's "Open" action when activated with a pointer. Because it duplicates a destination the row already exposes, the thumbnail SHALL be excluded from the accessibility tree and from the tab order, leaving the "Open" action as the row's single announced and tabbable control.

#### Scenario: The header carries no decorative hero tile
- **WHEN** the module overview renders
- **THEN** the header shows the back link, the eyebrow and the module title only, and no gradient tile repeating the module ordinal or the first word of its title

#### Scenario: Video rows reflect real lessons in order
- **WHEN** the module resolves its lessons
- **THEN** rows render in `sequence` order, each labelled `Video N` with the real lesson title, and "Open" links to that lesson for the active locale

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
- **THEN** they navigate to that row's lesson — the same destination as the row's "Open" action

#### Scenario: The thumbnail does not duplicate the row's control for assistive technology
- **WHEN** a screen reader or keyboard user traverses a video row
- **THEN** exactly one link is announced and reachable for that row — the "Open" action — and the thumbnail is skipped, so a module's rows are never announced or tabbed through twice

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
the completion mark, and the "Open" action stay as they are; the row simply grows taller.

#### Scenario: A long title wraps rather than truncates on a phone
- **WHEN** the module overview renders at a 320px or 390px viewport width for a module whose lesson titles exceed one line
- **THEN** each title wraps across multiple lines and is readable in full, with no ellipsis

#### Scenario: Rows with shared prefixes stay distinguishable
- **WHEN** a module's lesson titles share a long common prefix and the list renders on a phone
- **THEN** the part of each title that differs from its neighbours is visible, so a learner can tell the rows apart

#### Scenario: The row keeps its structure when a title wraps
- **WHEN** a title wraps onto several lines
- **THEN** the row still shows its `Video N` eyebrow, its completion mark when the lesson is complete, and its "Open" action, and the "Open" action remains fully within the viewport

