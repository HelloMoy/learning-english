## ADDED Requirements

### Requirement: Module overview renders as an episode list with a hero poster

The module overview (`/[locale]/courses/[courseSlug]/modules/[moduleSlug]`) SHALL present a back link to the course, a hero `PosterCard` for the module (episode number + short title), an eyebrow ("N lessons · Module NN"), the module title, and an ordered list of episode rows. Each row SHALL show a thumbnail/play affordance, an "Episode N" eyebrow, the lesson title, its duration for video lessons, and an "Open" action linking to the Lesson Page. All copy SHALL be localized and links SHALL be locale-aware.

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
