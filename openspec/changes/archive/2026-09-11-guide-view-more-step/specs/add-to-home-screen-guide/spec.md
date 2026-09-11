## RENAMED Requirements

- FROM: `### Requirement: The guide teaches the four taps iOS actually requires`
- TO: `### Requirement: The guide teaches every tap iOS actually requires`

## MODIFIED Requirements

### Requirement: The guide teaches every tap iOS actually requires

The app SHALL offer a guide that instructs an iPhone Safari learner how to add the course to
their home screen, as the five steps iOS 26 requires, in order:

1. the **«···»** control in Safari's bottom bar,
2. **Share** in the menu that opens,
3. **View More** in the share sheet, which opens collapsed,
4. **Add to Home Screen** in the list the sheet then shows,
5. **Add** on the confirmation screen.

The guide SHALL NOT present the flow as beginning at a share glyph in the toolbar; iOS 26
Safari's bottom bar does not have one.

The guide SHALL NOT present **Add to Home Screen** as reachable from the sheet that Share
opens. That sheet opens collapsed — a header, an app row, and a row of round actions ending
in **View More** — and carries no list to scroll. Sending the learner to scroll a list that
is not on their screen is the same failure as sending them to a share glyph that is not on
their toolbar.

The guide SHALL state the reason as direct access — the course one tap from the home screen,
opening as an app — and SHALL NOT justify the flow by the browser toolbar in the video
player, which is a side effect and not why a learner would do this.

#### Scenario: The steps are the five iOS requires, in order

- **WHEN** the guide is rendered
- **THEN** it presents exactly five steps, in the order iOS presents them, the first naming
  the «···» control and the last naming the confirmation's Add control

#### Scenario: The expanding tap comes between Share and Add to Home Screen

- **WHEN** the guide is rendered
- **THEN** the step naming **View More** falls immediately after the step naming **Share**
  and immediately before the step naming **Add to Home Screen**

#### Scenario: The guide sells access, not chrome

- **WHEN** the guide is rendered
- **THEN** it carries the localized reason, which speaks of reaching the course directly
  rather than of the browser's toolbar

### Requirement: The mock screen shows the step's target in place

Each step SHALL be accompanied by a depiction of the iOS surface that step acts on, with that
step's target control distinguished from its surroundings.

The share sheet SHALL be depicted in **two distinct states**, because the learner sees two:

- the **collapsed** sheet the Share tap opens, which covers only the lower part of the
  screen — the page SHALL remain visible above it — whose round-action row ends in **View
  More**, and which has no list beneath it;
- the **expanded** sheet the View More tap produces, which is that same sheet reaching up the
  screen with the list containing **Add to Home Screen** below it.

The two SHALL share their header, app row and action row, and the action row SHALL keep the
same number of controls in the same places, so that moving between them reads as the one
sheet growing rather than as two unrelated screens.

The last of those actions SHALL be named only on the collapsed sheet. iOS relabels it **View
Less** once the sheet is open, so carrying the **View More** label onto the expanded sheet
would put a word on the depiction that the learner's phone does not show — the same failure
as naming any other control they cannot find. On the expanded sheet it SHALL therefore be
drawn as an unlabelled control in its true position, as every other control the learner does
not need is.

Controls the learner does not need SHALL be drawn as unlabelled placeholders occupying their
real position and size. Omitting them entirely SHALL NOT be done, because the target's
position on the real screen is what the learner is being taught to find.

The depiction is decorative: it SHALL be hidden from assistive technology, and every step
SHALL remain followable from its text alone.

#### Scenario: The collapsed sheet offers no list

- **WHEN** the step naming **View More** is depicted
- **THEN** the sheet drawn carries the round-action row with **View More** as its target, and
  carries no list of rows beneath it

#### Scenario: The collapsed sheet leaves the page showing

- **WHEN** the step naming **View More** is depicted
- **THEN** the sheet occupies only as much of the screen as its own rows need, and the page
  it rose over is still visible above it

#### Scenario: The expanded sheet keeps the collapsed sheet's rows

- **WHEN** the step naming **Add to Home Screen** is depicted
- **THEN** the sheet drawn carries the same header, app row and action row as the collapsed
  sheet, the action row holding the same controls in the same places, with the list
  containing the target beneath them

#### Scenario: The expanded sheet does not name a control iOS has renamed

- **WHEN** the step naming **Add to Home Screen** is depicted
- **THEN** the last of the round actions carries no **View More** label

#### Scenario: The depiction is decorative

- **WHEN** the guide is rendered
- **THEN** the mock screen contributes nothing to the accessible name of the step, and the
  step's text alone names the control to tap

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
- **THEN** it exposes the current step number and the total, the total being the number of
  taps the flow requires

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

### Requirement: The guide ends by showing the result

After the last tap the guide SHALL show the outcome: the course's icon sitting on the home
screen among the learner's other apps. The taps are the cost; this is what they buy, and a
guide that stops at the confirmation screen asks for effort without ever showing the payoff.

The result SHALL NOT be counted as a step. It is not something the learner does, so numbering
it would misstate how much work the flow takes.

#### Scenario: The outcome follows the last tap

- **WHEN** the last step has played
- **THEN** the home screen carrying the course's icon is shown

#### Scenario: The outcome is not numbered as a step

- **WHEN** the outcome is shown
- **THEN** it carries no step number, and the steps still count only the taps
