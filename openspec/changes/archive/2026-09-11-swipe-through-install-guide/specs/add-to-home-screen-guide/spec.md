## MODIFIED Requirements

### Requirement: The guide plays itself

The guide SHALL advance through the four steps on a timer and return to the first after the
last, so a learner has to do nothing but watch.

It SHALL say which step is on screen and how many there are, because a loop with no position
gives the learner no way to know whether they have seen the whole thing.

It SHALL respect a reduced-motion preference by not advancing on its own. The preference
cannot be known while rendering on the server, so the first step SHALL be shown either way
and only the movement SHALL be conditional.

It SHALL stop its timer when it leaves the screen.

**The learner SHALL be able to move the guide themselves, with a horizontal gesture.** A
gesture travelling right-to-left SHALL show the next frame and one travelling left-to-right
the previous frame, matching the axis the position dots are laid out on. The guide offers no
other way to move: this is a nudge on top of a guide that plays itself, not a mode the
learner switches into.

**Both ends SHALL wrap**, in both directions. Moving forward from the result SHALL show the
first tap, as the timer already does, and moving back from the first tap SHALL show the
result. A learner who overshoots the frame they wanted SHALL reach it by reversing, and SHALL
NOT have to travel the whole loop.

**A gesture SHALL NOT stop the guide playing itself.** After a manual move the guide SHALL
keep advancing on the same timer, and the frame the learner moved to SHALL be given a full
interval before the guide advances again. A frame that is taken away early punishes the
learner for the moment their gesture happened to land in, rather than for what they asked
for.

**The gesture SHALL work under a reduced-motion preference**, which is the one case where it
is not an enhancement: the timer does not run there, so without it every frame but the first
is unreachable. The preference suppresses movement the learner did not ask for, and a gesture
is the opposite of that.

**A gesture that travels further vertically than horizontally SHALL NOT move the guide.** The
guide is a tall panel, and a gesture aimed at scrolling — the page's, or the guide's own,
wherever the guide is placed — must not be taken for a frame change. The dialog it is shown
in today happens to lock the page's scroll, and the guide SHALL NOT depend on that.

#### Scenario: It advances on its own

- **WHEN** the guide is rendered and its interval elapses
- **THEN** the next step is shown

#### Scenario: It returns to the beginning

- **WHEN** the last step has played
- **THEN** the first step is shown again

#### Scenario: It reports position in the sequence

- **WHEN** the guide is rendered
- **THEN** it exposes the current step number and the total

#### Scenario: It holds still when motion is not wanted

- **WHEN** the viewer prefers reduced motion
- **THEN** the guide does not advance on its own

#### Scenario: It does not keep running once gone

- **WHEN** the guide is taken off screen
- **THEN** its timer is stopped

#### Scenario: A gesture towards the left advances the guide

- **WHEN** the learner drags across the guide from right to left, far enough to be a gesture
- **THEN** the next frame is shown

#### Scenario: A gesture towards the right goes back

- **WHEN** the learner drags across the guide from left to right, far enough to be a gesture
- **THEN** the previous frame is shown

#### Scenario: Going back from the first frame reaches the last

- **WHEN** the first step is shown and the learner gestures backwards
- **THEN** the result is shown

#### Scenario: The chosen frame is given its full time

- **WHEN** the learner moves the guide by a gesture
- **THEN** the frame they moved to remains until a full interval has elapsed, and the guide
  then advances on its own as before

#### Scenario: A learner who asked for stillness can still move it

- **WHEN** the viewer prefers reduced motion and gestures across the guide
- **THEN** the guide moves one frame, and still does not advance on its own

#### Scenario: A gesture along the page's axis is not a frame change

- **WHEN** a drag across the guide travels further vertically than horizontally
- **THEN** the guide stays on the frame it was showing

### Requirement: The guide instructs and never claims to install

iOS exposes no API by which a page can add itself to the home screen. The guide SHALL NOT
present a control that suggests it can perform the install, and SHALL NOT be built on
`beforeinstallprompt`, which Safari does not fire.

The only control the guide SHALL offer is the one that dismisses it. The gesture specified by
*The guide plays itself* is not a control: it adds no element to the guide, nothing announces
it, and every frame it reaches is reached anyway by a learner who does nothing.

#### Scenario: Nothing offers to install the app

- **WHEN** the guide is rendered
- **THEN** the only control it exposes dismisses the guide
