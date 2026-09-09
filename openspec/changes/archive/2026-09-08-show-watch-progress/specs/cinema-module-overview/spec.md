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
`Video N` eyebrow, the lesson title, the duration and the "Open" action all remain,
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
- **THEN** it still shows its `Video N` eyebrow, title, duration where known, and a working "Open" action

#### Scenario: The row keeps one control
- **WHEN** a row carrying a progress bar is reached by keyboard
- **THEN** the "Open" action remains the row's single tab stop; the bar is not focusable

#### Scenario: The video list stays server-rendered
- **WHEN** the module overview is rendered
- **THEN** only the completion indicator and the progress bar are client-rendered; the rows, header and back link are produced on the server as before

#### Scenario: The indicator is announced, not merely coloured
- **WHEN** a screen reader reaches a completed lesson's row
- **THEN** the completed state is announced through a localized accessible name, and the distinction does not depend on colour alone

#### Scenario: A reading lesson's row carries no bar
- **WHEN** a row renders for a lesson with no duration
- **THEN** it shows no progress bar, and its completion mark still reflects the manual button
