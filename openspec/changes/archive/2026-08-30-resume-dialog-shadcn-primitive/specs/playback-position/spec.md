## MODIFIED Requirements

### Requirement: The Lesson Page offers to resume from the saved position when within sensible bounds

The Lesson Page SHALL decide whether to open a "Resume" modal dialog based on
the lesson's `durationSeconds` when the wrapping player mounts with a
stored position for the current lesson. The decision SHALL follow the
following rules:

- If the stored position is `null`, the player SHALL start at `0` and no
  dialog SHALL be opened.
- If the stored position is less than `30` seconds, the player SHALL start
  at `0` and no dialog SHALL be opened (the user effectively hasn't
  watched anything).
- If the stored position is greater than or equal to `durationSeconds - 10`
  (i.e. within the last 10 seconds of the lesson), the player SHALL start at
  `0` and no dialog SHALL be opened (the user effectively finished).
- Otherwise, a modal dialog SHALL be opened with two actions: a primary
  "Resume from `MM:SS`" action that sets `currentTime` to the stored
  position, and a secondary "Restart from beginning" action that sets
  `currentTime` to `0`.

The dialog SHALL be built from the project's `Dialog` primitive and triggered
imperatively through `NiceModal.show(...)`, per the `ui-dialog-primitive`
capability. It SHALL be modal: rendered over a full-viewport backdrop, with
keyboard focus trapped inside it while open. The player SHALL NOT render the
dialog as a child element of its own subtree.

The threshold decision SHALL be made by a pure, separately testable predicate
so the player can gate on it without importing modal or component code.

#### Scenario: No stored position skips the dialog
- **WHEN** `getPosition(lessonId)` returns `null`
- **THEN** the player starts at `0` and no dialog is opened

#### Scenario: A trivial saved position skips the dialog
- **WHEN** `getPosition(lessonId)` returns `5` seconds and the lesson is
  600 seconds long
- **THEN** the player starts at `0` and no dialog is opened

#### Scenario: A position near completion skips the dialog
- **WHEN** `getPosition(lessonId)` returns `595` seconds and the lesson is
  600 seconds long
- **THEN** the player starts at `0` and no dialog is opened

#### Scenario: A position in the middle opens the dialog
- **WHEN** `getPosition(lessonId)` returns `180` seconds and the lesson is
  600 seconds long
- **THEN** a modal dialog appears with "Resume from 03:00" and a "Restart
  from beginning" alternative; clicking Resume sets `currentTime` to `180`

#### Scenario: The dialog traps focus and is dismissible by keyboard
- **WHEN** the resume dialog is open
- **THEN** the rest of the page is marked `aria-hidden="true"`, keyboard focus
  is confined to the dialog, and pressing `Escape` closes it

## ADDED Requirements

### Requirement: Dismissing the resume dialog restarts from the beginning

Closing the resume dialog without choosing an action — `Escape`, a click on the
backdrop, or the close button — SHALL be treated as "Restart from beginning":
the video's `currentTime` SHALL be `0` and playback SHALL NOT jump to the stored
position. The stored position SHALL NOT be erased by the dismissal itself; it is
overwritten only by the normal write cadence once the learner interacts with the
video.

The dialog SHALL be opened at most once per player mount. A dismissed dialog
SHALL NOT reopen while the learner stays on the lesson.

#### Scenario: Escape leaves the video at the beginning
- **WHEN** the resume dialog is open for a stored position of `180` seconds and
  the learner presses `Escape`
- **THEN** the dialog closes and the video's `currentTime` is `0`

#### Scenario: Backdrop click leaves the video at the beginning
- **WHEN** the resume dialog is open and the learner clicks the backdrop
- **THEN** the dialog closes and the video's `currentTime` is `0`

#### Scenario: A dismissed dialog does not reopen
- **WHEN** the learner dismisses the resume dialog and then plays and pauses
  the video
- **THEN** the resume dialog does not appear again for the remainder of the
  page visit
