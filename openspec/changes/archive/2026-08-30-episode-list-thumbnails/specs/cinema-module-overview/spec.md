## MODIFIED Requirements

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
