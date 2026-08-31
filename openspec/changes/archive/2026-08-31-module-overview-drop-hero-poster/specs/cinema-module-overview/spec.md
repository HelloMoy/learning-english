## REMOVED Requirements

### Requirement: Module overview renders as an episode list with a hero poster

**Reason**: The hero tile is decorative only — the `Module` entity has no artwork, so
the tile could never show more than a gradient, an ordinal the eyebrow already states,
and the first word of the title below it. Replaced by the requirement below, which is
the same requirement with the hero clause dropped.

**Migration**: Every other clause is carried over verbatim into "Module overview
renders as a video list". No behaviour other than the tile changes.

## ADDED Requirements

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
