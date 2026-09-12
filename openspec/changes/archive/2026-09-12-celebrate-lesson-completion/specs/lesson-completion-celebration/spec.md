## ADDED Requirements

### Requirement: Completing a lesson is celebrated with confetti

The application SHALL fire a confetti burst over the page at the moment a lesson becomes
complete, drawn with the `canvas-confetti` library.

Both producers of completion SHALL celebrate, because they are the same moment to the
learner:

- the manual **Mark as complete** action, once the write is confirmed;
- playback crossing the lesson's finish threshold, at the point the finish rule records
  the lesson.

The celebration SHALL be fired from one shared place rather than drawn twice, so the two
paths cannot drift apart in look or timing.

The burst SHALL be transient and non-blocking: it SHALL NOT take over the screen, block
a control, capture focus, or require dismissing. The completion state SHALL be shown
exactly as it is today whether or not the animation runs.

#### Scenario: Marking a lesson complete celebrates
- **WHEN** the learner activates "Mark as complete" and the write is confirmed
- **THEN** a confetti burst is fired

#### Scenario: Watching a lesson to the end celebrates
- **WHEN** playback crosses the lesson's finish threshold and the finish rule marks the lesson
- **THEN** a confetti burst is fired, the same one the manual action fires

#### Scenario: The celebration never blocks the page
- **WHEN** the burst is running
- **THEN** every control stays operable, focus is unchanged, and nothing has to be dismissed

### Requirement: The celebration fires only on the transition into completion

The celebration SHALL fire only when a lesson goes from incomplete to complete. It SHALL
NOT fire:

- when a page loads showing a lesson that was already complete;
- when the Server Action rejects the write, so nothing was recorded;
- when the finish rule has already marked the lesson in this session and playback
  continues past the threshold;
- when the learner un-marks a lesson.

#### Scenario: Opening an already-completed lesson is silent
- **WHEN** a lesson recorded complete on a previous visit is opened
- **THEN** no confetti is fired

#### Scenario: A rejected write is not celebrated
- **WHEN** the mark's Server Action resolves without `data`, so nothing was recorded
- **THEN** no confetti is fired

#### Scenario: Playing past the threshold celebrates once
- **WHEN** playback crosses the finish threshold and keeps running, firing further progress events
- **THEN** the confetti is fired once, not on every event

#### Scenario: Un-marking is not a celebration
- **WHEN** the learner confirms un-marking a lesson
- **THEN** no confetti is fired

### Requirement: The celebration honours a reduced-motion preference

When the viewer's system asks for reduced motion, the celebration SHALL NOT animate.
Completion SHALL still be recorded and still be shown in full: the learner loses the
animation, never the information.

#### Scenario: A reduced-motion learner completes a lesson
- **WHEN** a learner whose system reports `prefers-reduced-motion: reduce` completes a lesson
- **THEN** no confetti animation plays, and the completed state renders exactly as it does otherwise

### Requirement: The confetti library is loaded only when it is needed

`canvas-confetti` SHALL be loaded on demand at the moment of a celebration, not
statically imported into the page's bundle, so that every route that never celebrates
anything does not carry it.

A failure to load or to draw SHALL NOT break the page or the completion write: the
celebration is decoration over an action that has already succeeded.

#### Scenario: The library is absent from the initial page bundle
- **WHEN** the Lesson Page loads
- **THEN** the confetti library has not been fetched

#### Scenario: A failed celebration does not break completion
- **WHEN** the library fails to load or the burst throws
- **THEN** the lesson is still recorded complete and the page keeps working
