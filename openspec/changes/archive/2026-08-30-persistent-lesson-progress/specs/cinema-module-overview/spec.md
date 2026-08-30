## ADDED Requirements

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
