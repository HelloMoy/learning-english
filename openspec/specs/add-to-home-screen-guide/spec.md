# add-to-home-screen-guide Specification

## Purpose
TBD - created by archiving change add-to-home-screen-guide. Update Purpose after archive.
## Requirements
### Requirement: Each step is localized down to the iOS label it names

All copy SHALL be read from the `Components.AddToHomeScreenGuide` namespace via `next-intl`,
and the namespace SHALL carry a translation in every locale the app supports.

This SHALL include the names of the iOS controls themselves. Safari renders its menus in the
device's language, so a guide that says "Share" to a learner whose phone shows «Compartir»
names a control that is not on their screen.

The same localized label SHALL be used by the instruction text and by the mock screen that
depicts it, so the two can never disagree.

#### Scenario: Copy is read from the component's own namespace

- **WHEN** the guide is rendered
- **THEN** its translations are read from `Components.AddToHomeScreenGuide`

#### Scenario: The mock screen names the control in the active locale

- **WHEN** the guide is rendered in a given locale
- **THEN** the target control drawn on the mock screen carries that locale's label for it,
  and it is the same string the step's instruction uses

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

### Requirement: The depiction moves the way the surface it depicts moves

The iPhone guide's depiction SHALL animate the way iOS itself does, because a step that is
merely swapped for the next reads as a slideshow of screenshots and leaves the learner to work
out what changed:

- sheets SHALL rise from the bottom of the screen rather than appear in place;
- the menu SHALL open out of the corner the «···» control sits in;
- the step's target SHALL carry a repeating tap indication, so the learner sees *where* the tap
  lands and not merely which control is outlined.

Changing step SHALL replay these entry animations, so every step arrives rather than appearing.

These motions describe iOS on an iPhone. Safari on an iPad and on a Mac moves differently — its
share popover is anchored to a toolbar control and grows in place rather than rising — so those
guides SHALL follow their own motion rules and SHALL NOT be held to the rising-sheet rule above.
What every guide SHALL share is the principle: the depiction moves the way the real surface
moves, and the target always shows where the tap lands.

Motion SHALL be expressed in CSS, so that the project's existing `prefers-reduced-motion` rule
neutralises all of it for a viewer who has asked for stillness, with no per-component handling.

#### Scenario: The step's target shows where the tap lands

- **WHEN** a step of any guide is depicted
- **THEN** its target carries both a pointer outline and a repeating tap indication

#### Scenario: Sheets arrive from the bottom edge

- **WHEN** a step of the iPhone guide whose surface is a sheet is depicted
- **THEN** that sheet carries the rising entry animation

#### Scenario: Moving to another step replays the arrival

- **WHEN** the depicted step changes
- **THEN** the new surface plays its entry animation rather than appearing already settled

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

### Requirement: Dismissal is the caller's to interpret

The guide SHALL offer a labelled dismiss control that notifies the caller and SHALL NOT
decide on its own whether the guide stays gone. Whether dismissal lasts a session or a device
is a property of where the guide is placed, so the guide SHALL NOT hold that state.

#### Scenario: Dismissing notifies the caller

- **WHEN** the learner activates the dismiss control
- **THEN** the caller is notified exactly once

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

### Requirement: The guide is reached from a header control, in a modal

The site header SHALL carry a control that opens a modal dialog, alongside the locale and theme
chips. Where the guide is the applicable path — see *The control exists only where the flow is
possible and useful* — that dialog SHALL contain the guide. The guide is a reference a learner
returns to, not a one-shot prompt, so it SHALL remain reachable rather than appearing once and
being gone.

The control SHALL NOT use a download glyph. Nothing is downloaded, and iOS marks this flow with
the add-to-home-screen glyph, so the control SHALL use that one and thereby teach the learner
the icon they are about to hunt for. It SHALL carry the same glyph on every platform: the
control means the same thing everywhere, and only what it opens differs.

The control's accessible name SHALL describe what activating it does on that platform, so that
a learner routed to the prompt is not told they are about to be shown instructions.

The dialog SHALL carry an accessible name and SHALL be dismissible by the dialog's own means;
closing it SHALL NOT be reported to anything as a decision to never show the guide again.

#### Scenario: The header control opens the guide

- **WHEN** the learner activates the header control on iPhone Safari
- **THEN** a modal dialog containing the guide is shown

#### Scenario: The control is named and glyph-marked

- **WHEN** the control is rendered
- **THEN** it carries a localized accessible name describing what it opens on that platform,
  and the add-to-home-screen glyph

### Requirement: The control exists only where the flow is possible and useful

The header control SHALL be rendered when the app is not already running from the home screen
and the browser offers **some** way to get it there. There are four such ways, and the control
SHALL route to the one that applies:

- **Safari on an iPhone**, which exposes no install API, SHALL reach the iPhone guide.
- **Safari on an iPad** SHALL reach the iPad guide.
- **Safari on macOS** SHALL reach the macOS guide, which ends at the Dock rather than a home
  screen.
- **A browser that has offered an install** — one that has fired `beforeinstallprompt` and whose
  event has not been spent — SHALL reach the install prompt, which confirms intent and hands off
  to the browser's own dialog.

The three guides are separate destinations because the three platforms require different taps on
differently shaped surfaces — see the `safari-install-guides` capability.

Where more than one holds the install prompt SHALL win, because performing the install beats
describing it. In practice they do not overlap: Safari fires no such event.

Where none holds — Firefox on any platform, Chrome on an iPad, any browser whose event has not
arrived — **no control SHALL be rendered**. A control that opens a guide for a flow the
application has not verified would teach a menu the learner may not have.

Every one of those is a property of the browser, unknowable while rendering on the server, so
the control SHALL be decided after hydration and SHALL render nothing until then. It SHALL NOT
cause the header's other controls to move when it appears.

An app already launched from the home screen SHALL NOT offer the control: the learner has
already done it.

#### Scenario: An iPhone Safari learner who has not installed sees the iPhone guide

- **WHEN** the browser is Safari on an iPhone and the app is not running standalone
- **THEN** the control is rendered, and activating it opens the iPhone guide

#### Scenario: An iPad Safari learner who has not installed sees the iPad guide

- **WHEN** the browser is Safari on an iPad and the app is not running standalone
- **THEN** the control is rendered, and activating it opens the iPad guide

#### Scenario: A macOS Safari learner who has not installed sees the macOS guide

- **WHEN** the browser is Safari on macOS and the app is not running standalone
- **THEN** the control is rendered, and activating it opens the macOS guide

#### Scenario: A browser that offered an install reaches the prompt

- **WHEN** the browser has fired `beforeinstallprompt`, its event is unspent, and the app is not
  running standalone
- **THEN** the control is rendered, and activating it opens the install prompt

#### Scenario: Everyone else does not

- **WHEN** the browser is none of iPhone Safari, iPad Safari, macOS Safari, or one that has
  offered an install, or the app is already running from the home screen
- **THEN** no control is rendered

#### Scenario: It is not decided during hydration

- **WHEN** the header renders on the server or during the hydration pass
- **THEN** no control is rendered, so the server and client markup agree

### Requirement: The guide fits the screen it is shown on

The guide SHALL fit within the viewport it is opened in, without scrolling. It is a set of
instructions someone follows on the phone in their hand, and instructions that run off the
bottom of that phone are instructions the learner has to hunt for while trying to follow them.

The mock phone SHALL shrink to fit rather than the guide gaining a scrollbar, because the
whole point of the depiction is seeing where a control sits on a whole screen.

#### Scenario: A short viewport still shows the whole guide

- **WHEN** the guide is shown on a viewport shorter than the depiction's natural height
- **THEN** the depiction is scaled down so the guide fits, and the guide does not scroll

### Requirement: The install control leads the header controls

The header control that opens the guide SHALL be the first of the header's controls, before
the locale and theme chips.

#### Scenario: It comes before the other chips

- **WHEN** the header's controls are rendered and the control is present
- **THEN** it precedes the locale and theme controls

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

