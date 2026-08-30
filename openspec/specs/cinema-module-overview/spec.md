# Capability: cinema-module-overview

## Purpose

Define the Immersion Cinema presentation of the module overview route (`/[locale]/courses/[courseSlug]/modules/[moduleSlug]`). The module is presented as an episode list within a series: a hero `PosterCard` for the module with its episode number and short title, followed by an ordered list of episode rows — one per lesson — each showing a thumbnail/play affordance, an "Episode N" eyebrow, the lesson title, duration when known, and an "Open" action that links to the Lesson Page.

## Requirements

### Requirement: Module overview renders as an episode list with a hero poster

The module overview (`/[locale]/courses/[courseSlug]/modules/[moduleSlug]`) SHALL present a back link to the course, a hero `PosterCard` for the module (episode number + short title), an eyebrow ("N lessons · Module NN"), the module title, and an ordered list of episode rows. Each row SHALL show a thumbnail/play affordance, an "Episode N" eyebrow, the lesson title, its duration for video lessons, and an "Open" action linking to the Lesson Page. All copy SHALL be localized and links SHALL be locale-aware.

Each row's thumbnail SHALL render the lesson's `poster` artwork when the lesson has one, and SHALL fall back to the decorative gradient tile with a play affordance when it does not. The thumbnail SHALL navigate to the same lesson as that row's "Open" action when activated with a pointer. Because it duplicates a destination the row already exposes, the thumbnail SHALL be excluded from the accessibility tree and from the tab order, leaving the "Open" action as the row's single announced and tabbable control.

#### Scenario: Episode rows reflect real lessons in order
- **WHEN** the module resolves its lessons
- **THEN** rows render in `sequence` order, each labelled "Episode N" with the real lesson title, and "Open" links to that lesson for the active locale

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
- **WHEN** a screen reader or keyboard user traverses an episode row
- **THEN** exactly one link is announced and reachable for that row — the "Open" action — and the thumbnail is skipped, so a module's rows are never announced or tabbed through twice

### Requirement: Episode rows mark lessons the learner has already completed

In the module overview's episode list, a row whose lesson has been completed SHALL carry a completion indicator distinguishing it from lessons not yet taken, so a learner scanning a module can see how far they got. The indicator SHALL be perceivable without relying on colour alone and SHALL carry a localized accessible name.

The indicator SHALL NOT replace or suppress any existing part of the row: the "Episode N" eyebrow, the lesson title, the duration and the "Open" action all remain.

Because completion is read in the browser after hydration (see the `lesson-progress` capability) while the module overview is server-rendered, the completion indicator SHALL be the only client-rendered part of the row; the rest of the episode list SHALL continue to render on the server. No explicit "not completed" marker SHALL be rendered at any time.

#### Scenario: A completed lesson is distinguishable in the episode list
- **WHEN** the module overview renders a lesson the learner has completed
- **THEN** that row shows the completion indicator, and rows for lessons not completed show none

#### Scenario: The indicator does not displace the row's existing content
- **WHEN** a completed lesson's row renders
- **THEN** it still shows its "Episode N" eyebrow, title, duration where known, and a working "Open" action

#### Scenario: The episode list stays server-rendered
- **WHEN** the module overview is rendered
- **THEN** only the completion indicator is client-rendered; the rows, hero and back link are produced on the server as before

#### Scenario: The indicator is announced, not merely coloured
- **WHEN** a screen reader reaches a completed lesson's row
- **THEN** the completed state is announced through a localized accessible name, and the distinction does not depend on colour alone
