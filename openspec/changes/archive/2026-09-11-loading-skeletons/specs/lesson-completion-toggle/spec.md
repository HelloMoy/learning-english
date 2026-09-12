## MODIFIED Requirements

### Requirement: The completion control has two states and says which one it is in

The Lesson Page's completion control SHALL render one of exactly two states, chosen by
whether the lesson is recorded complete on this device:

- **Incomplete** — a localized invitation to finish the lesson and move on, followed by
  the primary "Mark as complete" button.
- **Complete** — a localized "Lesson completed" statement, followed by the un-mark
  action described below. The invitation SHALL NOT be shown in this state, and the
  status line that repeated the button's own label SHALL NOT be rendered at all: the
  state is stated once.

The statement SHALL be announced to assistive technology when it replaces the
invitation, so a learner who does not see the change is told the lesson is now complete.

Completion is recorded in `localStorage`, which the server cannot read, so on the server
and during hydration neither state is known. The control SHALL therefore render a third,
**unknown** state until completion can be determined: a placeholder occupying the
control's own dimensions, carrying neither the invitation nor the statement. Rendering the
incomplete state during that window tells a learner who already finished the lesson
something false about their own progress, and it does so in the page's closing call to
action, where it is least likely to go unnoticed. The unknown state SHALL NOT be
announced, SHALL NOT be focusable, and SHALL be replaced by one of the two real states as
soon as completion is known.

#### Scenario: An incomplete lesson invites the learner to finish it
- **WHEN** a lesson that is not recorded complete renders
- **THEN** the control shows the invitation copy and the primary "Mark as complete" button

#### Scenario: A completed lesson states its state once
- **WHEN** a lesson recorded complete renders
- **THEN** the control shows the "Lesson completed" statement, does not show the invitation copy, and shows no separate status line repeating it

#### Scenario: Marking a lesson swaps the state in place
- **WHEN** the learner activates "Mark as complete"
- **THEN** the invitation and the primary button are replaced by the "Lesson completed" statement and the un-mark action, without a reload, and the change is announced

#### Scenario: Completion that is not yet known asserts neither state
- **WHEN** the control renders on the server, or during hydration, before completion can be read
- **THEN** it shows a placeholder of the control's dimensions, and neither the invitation nor the "Lesson completed" statement is present

#### Scenario: A completed lesson never shows the invitation first
- **WHEN** a lesson recorded complete is opened and hydration resolves
- **THEN** the control moves from the placeholder to the complete state, having shown the invitation at no point

#### Scenario: The unknown state is silent
- **WHEN** the control is in the unknown state
- **THEN** nothing is announced to assistive technology and no control in it can receive focus
