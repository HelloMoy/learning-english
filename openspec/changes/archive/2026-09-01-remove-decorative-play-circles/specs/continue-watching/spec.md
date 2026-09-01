## MODIFIED Requirements

### Requirement: The home offers to continue the last lesson

The home SHALL render a `Continue watching` section above the course ladder when, and only when, a stored location resolves to a live lesson. The section SHALL show the course and module the lesson belongs to, the lesson title, and a primary action that navigates to that lesson.

That action SHALL be the section's only playback affordance. The section SHALL NOT render a decorative play control alongside it — an inert circle bearing a play glyph invites a click it cannot answer, and next to a working `Resume` action it makes the panel appear to offer two ways in when it offers one.

When the lesson is a video lesson with a saved playback position, the section SHALL additionally show how far through it the learner is and how much is left. When there is no saved position, or the lesson has no duration, the progress indicator SHALL be omitted rather than rendered at zero.

All copy SHALL be localized (en/es/pt) and the link SHALL be locale-aware.

#### Scenario: Nothing to continue renders nothing
- **WHEN** no location is stored, or the stored location no longer resolves
- **THEN** the home renders no `Continue watching` section, and no error message in its place

#### Scenario: A stored location renders the panel
- **WHEN** a location resolves to a live lesson
- **THEN** the section shows the course title, the module title, the lesson title, and an action that navigates to that lesson for the active locale

#### Scenario: The panel offers one way in
- **WHEN** the section renders for a resolved lesson
- **THEN** the action that navigates to the lesson is the only playback affordance present, and no decorative play control renders beside it

#### Scenario: A video lesson with a saved position shows progress
- **WHEN** the resolved lesson is a video lesson and a playback position is saved for it
- **THEN** the section shows the elapsed proportion and the remaining time, derived from that position and the lesson's `durationSeconds`

#### Scenario: A reading lesson shows no progress bar
- **WHEN** the resolved lesson is a reading lesson
- **THEN** the section renders without a progress indicator and still offers the action

#### Scenario: The section resolves after hydration without asserting a false state
- **WHEN** the home is server-rendered, before `localStorage` can be read
- **THEN** no `Continue watching` section is shown, and it appears only once the client has read the record
