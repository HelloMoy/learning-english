## MODIFIED Requirements

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
