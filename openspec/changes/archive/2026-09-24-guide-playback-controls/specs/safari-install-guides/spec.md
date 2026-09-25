## MODIFIED Requirements

### Requirement: Both guides play themselves the way the iPhone guide does

Each guide SHALL advance through its steps on a timer and wrap, SHALL report which step is on
screen and how many there are, SHALL count only the taps in that total, SHALL not advance on its
own under a reduced-motion preference, and SHALL stop its timer when it leaves the screen.

Each SHALL offer the same visible controls the iPhone guide offers — previous, next, and one per
frame — carrying localized accessible names and reachable by keyboard, and SHALL show how long
the frame on screen has left before it advances.

A horizontal gesture SHALL keep working as an unannounced shortcut for the same moves. A gesture
travelling further vertically than horizontally SHALL NOT move a guide.

**The visible controls matter more here than on a phone.** A horizontal drag on a card is not a
gesture anyone performs with a mouse, so on a Mac the gesture reaches nobody; without the
controls, a learner who missed a step could only wait out the whole loop.

Moving by hand SHALL NOT stop a guide playing itself, and the frame the learner moved to SHALL
be given a full interval before the guide advances again.

These rules SHALL be expressed in one place that every guide reads from, so that the three
cannot drift apart on behaviour they are all specified to share.

#### Scenario: It advances on its own

- **WHEN** a guide is rendered and its interval elapses
- **THEN** the next step is shown

#### Scenario: It reports position in the sequence

- **WHEN** a guide is rendered
- **THEN** it exposes the current step number and the total, the total being the number of taps
  that platform's flow requires

#### Scenario: It holds still when motion is not wanted

- **WHEN** the viewer prefers reduced motion
- **THEN** the guide does not advance on its own

#### Scenario: The learner can see that the guide can be moved

- **WHEN** a guide is rendered
- **THEN** it offers a control for the previous frame, one for the next, and one per frame, each
  carrying a localized accessible name

#### Scenario: A mouse can move the guide

- **WHEN** the learner is on a Mac and activates the next control
- **THEN** the next frame is shown, without any gesture being required

#### Scenario: The frame on screen shows how long it has left

- **WHEN** a guide is playing
- **THEN** the control for the frame on screen indicates the time remaining before the guide
  advances

#### Scenario: A gesture moves it a frame

- **WHEN** the learner drags across a guide far enough to be a gesture
- **THEN** the guide moves one frame in the direction of travel, and still advances on its own
  afterwards

#### Scenario: The shared rules are shared

- **WHEN** the playback behaviour is changed
- **THEN** it is changed in one place, and every guide's behaviour changes with it
