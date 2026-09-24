## MODIFIED Requirements

### Requirement: The guide plays itself

The guide SHALL advance through the steps on a timer and return to the first after the last,
so a learner has to do nothing but watch.

It SHALL say which step is on screen and how many there are, because a loop with no position
gives the learner no way to know whether they have seen the whole thing. The total it reports
SHALL be the number of taps the flow requires, so that adding or removing a tap moves the
total with it rather than leaving the guide counting to a number it no longer reaches.

It SHALL respect a reduced-motion preference by not advancing on its own. The preference
cannot be known while rendering on the server, so the first step SHALL be shown either way
and only the movement SHALL be conditional.

It SHALL stop its timer when it leaves the screen.

**The learner SHALL be able to move the guide themselves, and SHALL be able to see that they
can.** The guide SHALL offer visible controls: one that shows the previous frame, one that
shows the next, and one per frame that goes straight to it. Every one of them SHALL carry a
localized accessible name saying where it leads, and SHALL be reachable by keyboard.

**A horizontal gesture SHALL keep working**, unannounced, as a shortcut for the same moves. A
gesture travelling right-to-left SHALL show the next frame and one travelling left-to-right the
previous frame, matching the axis the frame controls are laid out on. It is no longer the only
way in: a learner who never discovers it loses nothing, which is what the visible controls buy.

**The guide SHALL show how long the frame on screen has left** before it advances, so a learner
reading an instruction can tell whether there is time to finish. That indication is motion
describing a timer, so where the timer does not run — under a reduced-motion preference — the
indication SHALL be absent rather than frozen, which would show a countdown that never counts.

**Both ends SHALL wrap**, in both directions, however the learner moves. Moving forward from the
result SHALL show the first tap, as the timer already does, and moving back from the first tap
SHALL show the result. A learner who overshoots the frame they wanted SHALL reach it by
reversing, and SHALL NOT have to travel the whole loop.

**Moving by hand SHALL NOT stop the guide playing itself.** After a manual move the guide SHALL
keep advancing on the same timer, and the frame the learner moved to SHALL be given a full
interval before the guide advances again. A frame that is taken away early punishes the learner
for the moment their move happened to land in, rather than for what they asked for.

**Every way of moving SHALL work under a reduced-motion preference**, which is the one case
where they are not an enhancement: the timer does not run there, so without them every frame but
the first is unreachable. The preference suppresses movement the learner did not ask for, and a
move they made is the opposite of that.

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
- **THEN** it exposes the current step number and the total, the total being the number of
  taps the flow requires

#### Scenario: It holds still when motion is not wanted

- **WHEN** the viewer prefers reduced motion
- **THEN** the guide does not advance on its own

#### Scenario: It does not keep running once gone

- **WHEN** the guide is taken off screen
- **THEN** its timer is stopped

#### Scenario: The learner can see that the guide can be moved

- **WHEN** the guide is rendered
- **THEN** it offers a control for the previous frame, one for the next, and one per frame, each
  carrying a localized accessible name

#### Scenario: A frame control goes straight to its frame

- **WHEN** the learner activates the control for a given frame
- **THEN** that frame is shown

#### Scenario: The frame on screen shows how long it has left

- **WHEN** the guide is playing
- **THEN** the control for the frame on screen indicates the time remaining before the guide
  advances

#### Scenario: No countdown is shown where the timer does not run

- **WHEN** the viewer prefers reduced motion
- **THEN** no time-remaining indication is shown

#### Scenario: A gesture towards the left advances the guide

- **WHEN** the learner drags across the guide from right to left, far enough to be a gesture
- **THEN** the next frame is shown

#### Scenario: A gesture towards the right goes back

- **WHEN** the learner drags across the guide from left to right, far enough to be a gesture
- **THEN** the previous frame is shown

#### Scenario: Going back from the first frame reaches the last

- **WHEN** the first step is shown and the learner moves backwards, by any means
- **THEN** the result is shown

#### Scenario: The chosen frame is given its full time

- **WHEN** the learner moves the guide by hand, by any means
- **THEN** the frame they moved to remains until a full interval has elapsed, and the guide
  then advances on its own as before

#### Scenario: A learner who asked for stillness can still move it

- **WHEN** the viewer prefers reduced motion and moves the guide by any means
- **THEN** the guide moves one frame, and still does not advance on its own

#### Scenario: A gesture along the page's axis is not a frame change

- **WHEN** a drag across the guide travels further vertically than horizontally
- **THEN** the guide stays on the frame it was showing

### Requirement: The guide instructs and never claims to install

iOS exposes no API by which a page can add itself to the home screen. The guide SHALL NOT
present a control that suggests it can perform the install, and SHALL NOT be built on
`beforeinstallprompt`, which Safari does not fire.

Every control the guide offers SHALL do one of two things: dismiss the guide, or move it to
another frame. No control SHALL act on the learner's device, and none SHALL report that anything
was installed. The horizontal gesture specified by *The guide plays itself* adds no element and
nothing announces it, so it is not a control for this purpose.

#### Scenario: Nothing offers to install the app

- **WHEN** the guide is rendered
- **THEN** every control it exposes either dismisses the guide or moves it to another frame, and
  none of them offers to install anything
