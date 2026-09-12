## ADDED Requirements

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

#### Scenario: An incomplete lesson invites the learner to finish it
- **WHEN** a lesson that is not recorded complete renders
- **THEN** the control shows the invitation copy and the primary "Mark as complete" button

#### Scenario: A completed lesson states its state once
- **WHEN** a lesson recorded complete renders
- **THEN** the control shows the "Lesson completed" statement, does not show the invitation copy, and shows no separate status line repeating it

#### Scenario: Marking a lesson swaps the state in place
- **WHEN** the learner activates "Mark as complete"
- **THEN** the invitation and the primary button are replaced by the "Lesson completed" statement and the un-mark action, without a reload, and the change is announced

### Requirement: A completed lesson can be un-marked from a discreet, reachable action

In the complete state the control SHALL offer an un-mark action that is:

- **not** a disabled control — the learner can always activate it;
- **not** styled as a primary action — no filled primary surface. It SHALL read as a
  quiet text action beside the statement;
- a real control with an accessible name saying what it does (un-mark this lesson), not
  a bare icon;
- at least 44px tall in its activatable area, so it stays tappable on a phone despite
  its quiet styling.

The primary "Mark as complete" button SHALL NOT be rendered in the complete state, and
no control on the page SHALL be left disabled to express completion.

#### Scenario: The completed state offers an enabled, non-primary action
- **WHEN** a lesson recorded complete renders
- **THEN** the un-mark action is present, enabled, named for what it does, and carries no primary-button styling

#### Scenario: The action stays tappable on a phone
- **WHEN** the completed control renders at a 390px viewport width
- **THEN** the un-mark action's activatable area is at least 44px tall

### Requirement: Un-marking is confirmed in a dialog that names its consequences

Activating the un-mark action SHALL NOT change any stored state on its own. It SHALL
open a modal dialog that:

- names what is about to happen ("un-mark this lesson");
- states the consequences in the learner's language: the lesson counts as pending
  again, the course and module progress meters go down, and its completion mark
  disappears from the outline and the lesson lists;
- states that watching the lesson to the end again will record it complete once more,
  because playback crossing the finish threshold is a second producer of completion;
- states that the saved playback position is **not** erased;
- offers two actions: confirm the un-mark, and cancel.

The dialog SHALL be built on the project's `Dialog` primitive, shown imperatively
through the project's modal manager, and SHALL be localized in every supported locale.
It SHALL be dismissible by the keyboard, and dismissing it SHALL count as cancelling.

Only confirming SHALL clear the completion. Cancelling or dismissing SHALL leave the
lesson complete and the control in its complete state.

#### Scenario: Activating the un-mark action opens the dialog and changes nothing yet
- **WHEN** the learner activates the un-mark action
- **THEN** the confirmation dialog opens and the lesson is still recorded complete

#### Scenario: The dialog names the consequences
- **WHEN** the confirmation dialog is open
- **THEN** it states that progress meters go down and the mark disappears, that watching to the end again re-marks the lesson, and that the saved playback position is kept

#### Scenario: Confirming un-marks the lesson
- **WHEN** the learner confirms in the dialog
- **THEN** the lesson is no longer recorded complete, the control returns to its incomplete state with the invitation and the primary button, and the dialog closes

#### Scenario: Cancelling leaves the lesson complete
- **WHEN** the learner cancels or dismisses the dialog
- **THEN** the lesson is still recorded complete and the control is unchanged

#### Scenario: Every surface follows the un-mark
- **WHEN** a lesson is un-marked while the outline and a completion indicator for it are rendered
- **THEN** both stop showing the lesson as complete without a reload, through the same shared snapshot that marking already updates

### Requirement: Un-marking writes through the same two paths marking does

Confirming an un-mark SHALL clear the lesson's completion in the browser
`ProgressTracker` and SHALL call the `unmarkLessonComplete` use case through a Server
Action, mirroring the dual write the mark already performs. Neither write SHALL be
skipped, so the browser store and the server's tracker cannot drift apart.

A rejected Server Action (validation failure) SHALL leave the browser store untouched
and the lesson complete, exactly as a rejected mark leaves it incomplete.

#### Scenario: A confirmed un-mark reaches both trackers
- **WHEN** the learner confirms the un-mark
- **THEN** the Server Action is called with the lesson id and the browser store's mark for that lesson is cleared

#### Scenario: A rejected Server Action leaves the lesson complete
- **WHEN** the Server Action resolves without `data` (its input was rejected)
- **THEN** the browser store still reports the lesson complete and the control stays in its complete state

### Requirement: The completion control's copy is localized in every supported locale

Every string the control and its dialog render SHALL resolve through `next-intl` and
SHALL be present in `en`, `es` and `pt` — the invitation, the "Lesson completed"
statement, the un-mark action's label, and the dialog's title, body, confirm and cancel
labels.
No string SHALL be hardcoded in a component.

#### Scenario: The completed state is translated in every locale
- **WHEN** the Lesson Page renders a completed lesson in `en`, `es` and `pt`
- **THEN** the statement, the un-mark action and the dialog render in that locale, and no message key is rendered raw
