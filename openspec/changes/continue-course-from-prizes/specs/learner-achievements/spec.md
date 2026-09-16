## ADDED Requirements

### Requirement: The Achievements page offers the way back into the course

The Achievements page SHALL offer an action that takes the learner back into the course, using the
device's continue-watching record to decide where.

While the record is being resolved, the action SHALL be reserved — present in the page's shape but
naming no destination — so the learner is never offered a target that changes.

The action SHALL name the course rather than the lesson, so its size does not follow the title it
carries: continuing the course when the record resolves to a lesson in the catalog, and starting the
course when there is no record or it no longer resolves — the learner is told which of the two they are
being offered, not which lesson it happens to be.

When the record resolves to a lesson in the catalog, the action SHALL open that lesson. When there is
no record, or the record no longer resolves to a lesson in the catalog, the action SHALL offer the first
lesson of the first course, so the page is never a dead end.

The action SHALL NOT navigate on the learner's behalf, and its copy SHALL be localized in `en`, `es`
and `pt`.

#### Scenario: Continuing where they left off
- **WHEN** the device's record resolves to `The schwa /ə/` and the learner opens the Achievements page
- **THEN** the page offers an action to continue the course, which opens that lesson

#### Scenario: Nothing started yet
- **WHEN** a learner who has started no lesson opens the Achievements page
- **THEN** the action offers to start the course, and opens the first lesson of the first course

#### Scenario: A record that no longer resolves
- **WHEN** the stored record names a lesson that is no longer in the catalog
- **THEN** the action offers the first lesson of the first course rather than failing

#### Scenario: While the record resolves
- **WHEN** the record exists and the round-trip that resolves it has not answered
- **THEN** the action is reserved and names no lesson

#### Scenario: Nothing moves on its own
- **WHEN** the learner opens the Achievements page and activates nothing
- **THEN** they stay on the page

### Requirement: The prize reveal offers continuing the course

The dialog that reveals a claimed prize SHALL offer, beside the control that closes it, a control that
opens the same destination the Achievements page offers. Activating it SHALL settle the dialog and open
that lesson.

The closing control SHALL remain the dialog's primary action, and closing SHALL continue to leave the
learner on the counter with focus returned to the prize that was revealed. Both controls SHALL have
accessible names, and the dialog SHALL still close on Escape.

#### Scenario: Continuing from the reveal
- **WHEN** the learner claims the `Vowels` prize and activates the control that continues the course
- **THEN** the dialog settles and the lesson they left off in opens

#### Scenario: Closing still stays on the counter
- **WHEN** the learner closes the reveal instead
- **THEN** they remain on the Achievements page with focus on the revealed prize

#### Scenario: Continuing with nothing started
- **WHEN** a learner who has started no lesson claims a prize and continues the course
- **THEN** the first lesson of the first course opens

#### Scenario: Both ways out are named
- **WHEN** assistive technology reads the reveal dialog
- **THEN** it hears a named control that closes it and a named control that continues the course
