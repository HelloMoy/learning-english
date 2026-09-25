## ADDED Requirements

### Requirement: The iPad guide teaches every tap iPadOS actually requires

The application SHALL offer an iPad Safari learner a guide to adding the course to their home
screen, as the four taps iPadOS 26 requires, in order:

1. **Share** in Safari's top toolbar,
2. **View More** in the share popover, which opens collapsed,
3. **Add to Home Screen** in the list the popover then shows,
4. **Add** on the confirmation card.

The guide SHALL NOT present the flow as beginning at a «···» control. That is the iPhone's
bottom bar; iPad Safari carries the share glyph in its top toolbar, and sending an iPad learner
to look for «···» sends them to a control their device does not have.

The guide SHALL NOT present **Add to Home Screen** as reachable from the popover that Share
opens. That popover opens collapsed — a site header, an app row, and a row of round actions
ending in **View More** — and carries no list.

The guide SHALL state the reason as direct access: the course one tap from the home screen,
opening as an app.

#### Scenario: The steps are the four iPadOS requires, in order

- **WHEN** the iPad guide is rendered
- **THEN** it presents exactly four steps, in the order iPadOS presents them, the first naming
  the Share control and the last naming the confirmation's Add control

#### Scenario: The expanding tap comes between Share and Add to Home Screen

- **WHEN** the iPad guide is rendered
- **THEN** the step naming **View More** falls immediately after the step naming **Share** and
  immediately before the step naming **Add to Home Screen**

#### Scenario: No step names the iPhone's overflow control

- **WHEN** the iPad guide is rendered
- **THEN** no step names «···»

### Requirement: The macOS guide teaches every click Safari actually requires

The application SHALL offer a Safari-on-macOS learner a guide to adding the course to their
Dock, as the three clicks Safari 26 requires, in order:

1. **Share** in Safari's toolbar,
2. **Add to Dock** in the popover,
3. **Add** on the confirmation sheet.

The macOS popover opens with its whole list showing, and **Add to Dock** is on it. The guide
SHALL NOT teach a **View More** step here. That step exists on the iPhone and the iPad and not
on the Mac, and inventing it would send the learner looking for a control their popover does not
carry — the mirror image of the mistake this guide exists to prevent.

The guide SHALL speak of the **Dock**, never of a home screen: a Mac has no home screen, so
naming one names a place the learner cannot go and look at.

#### Scenario: The steps are the three Safari requires, in order

- **WHEN** the macOS guide is rendered
- **THEN** it presents exactly three steps, the first naming the Share control, the second
  naming **Add to Dock**, and the last naming the confirmation's Add control

#### Scenario: No step asks the learner to expand the popover

- **WHEN** the macOS guide is rendered
- **THEN** no step names **View More**

#### Scenario: The macOS copy never promises a home screen

- **WHEN** the macOS guide is rendered in any locale
- **THEN** none of its copy refers to a home screen

### Requirement: The depiction draws the Safari the learner is looking at

Each step SHALL be accompanied by a depiction of the Safari surface that step acts on, with that
step's target control distinguished from its surroundings, drawn in a wide browser-window frame
rather than a phone.

Both platforms SHALL share these rules, because both behave this way:

- the share sheet is a **popover anchored to the share control** in the toolbar, not a sheet
  spanning the surface;
- the page behind the popover **SHALL remain undimmed**;
- the page behind the **confirmation** SHALL be dimmed;
- controls the learner does not need SHALL be drawn as unlabelled placeholders at their real
  position and size.

The two platforms SHALL differ where Safari differs:

- **iPad** — the popover carries a site header, an app row and a row of round actions, and is
  depicted in **two states**: collapsed, whose round-action row ends in **View More** and which
  carries no list; and expanded, which is that same popover grown in place with the list beneath
  it. The two SHALL share their header, app row and action row, with the action row keeping the
  same controls in the same places. The last round action SHALL be named only on the collapsed
  state, because iPadOS relabels it **View Less** once expanded. The confirmation SHALL be drawn
  as a **light card centred over the page**, carrying its **Add** control at the **top trailing**
  corner and an **Open as Web App** switch shown already on.
- **macOS** — the popover is a **single flat list** with no round-action row and no second
  state, and **Add to Dock** SHALL sit at its true position in that list rather than first. The
  confirmation SHALL be drawn as a **sheet attached to the top of the window**, carrying
  **Cancel** and **Add** at the **bottom trailing** corner, and SHALL carry no Open as Web App
  switch, because Safari on macOS offers none.

Expanding SHALL grow the iPad popover in place rather than moving it up the surface, and the
expanded list SHALL be drawn complete, because it fits without scrolling.

The depiction is decorative: it SHALL be hidden from assistive technology, and every step SHALL
remain followable from its text alone.

#### Scenario: The share surface is anchored, not full width

- **WHEN** a step whose surface is the share popover is depicted
- **THEN** the popover is drawn against the share control it opened from, and does not span the
  frame

#### Scenario: The page is not dimmed behind the popover

- **WHEN** a step whose surface is the share popover is depicted
- **THEN** the page behind it is drawn at full contrast

#### Scenario: The page is dimmed behind the confirmation

- **WHEN** a step whose surface is the confirmation is depicted
- **THEN** the page behind it is drawn dimmed

#### Scenario: The iPad's collapsed popover offers no list

- **WHEN** the step naming **View More** is depicted
- **THEN** the popover drawn carries the round-action row with **View More** as its target, and
  carries no list of rows beneath it

#### Scenario: The iPad's expanded popover keeps the collapsed one's rows

- **WHEN** the step naming **Add to Home Screen** is depicted
- **THEN** the popover carries the same site header, app row and action row as the collapsed
  state, the action row holding the same controls in the same places, with the complete list
  beneath them

#### Scenario: The iPad's expanded popover does not name a control iPadOS has renamed

- **WHEN** the step naming **Add to Home Screen** is depicted
- **THEN** the last of the round actions carries no **View More** label

#### Scenario: The iPad confirmation carries the web app switch

- **WHEN** the iPad step naming **Add** is depicted
- **THEN** a card is drawn centred over the page, its target at the top trailing corner, showing
  an **Open as Web App** switch already on

#### Scenario: The macOS popover has one state and no round actions

- **WHEN** the macOS step naming **Add to Dock** is depicted
- **THEN** the popover drawn is a single flat list carrying the target among the other rows, with
  no row of round actions and no expanding control

#### Scenario: The macOS confirmation confirms from the bottom

- **WHEN** the macOS step naming **Add** is depicted
- **THEN** a sheet is drawn attached to the top of the window, its target at the bottom trailing
  corner beside a dismissing control, and it carries no web app switch

#### Scenario: The depiction is decorative

- **WHEN** either guide is rendered
- **THEN** the depiction contributes nothing to the accessible name of the step, and the step's
  text alone names the control to act on

### Requirement: Both guides play themselves the way the iPhone guide does

Each guide SHALL advance through its steps on a timer and wrap, SHALL report which step is on
screen and how many there are, SHALL count only the taps in that total, SHALL not advance on its
own under a reduced-motion preference, SHALL stop its timer when it leaves the screen, and SHALL
answer a horizontal gesture by moving one frame either way with both ends wrapping.

A gesture travelling further vertically than horizontally SHALL NOT move a guide.

A gesture SHALL NOT stop a guide playing itself, and the frame the learner moved to SHALL be
given a full interval before the guide advances again.

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

#### Scenario: A gesture moves it a frame

- **WHEN** the learner drags across a guide far enough to be a gesture
- **THEN** the guide moves one frame in the direction of travel, and still advances on its own
  afterwards

#### Scenario: The shared rules are shared

- **WHEN** the playback behaviour is changed
- **THEN** it is changed in one place, and every guide's behaviour changes with it

### Requirement: Each guide ends by showing what the steps bought

After the last step the iPad guide SHALL show the course's icon on the iPad home screen among
the learner's other apps, and the macOS guide SHALL show it in the Dock among the learner's
other applications.

The result SHALL NOT be counted as a step: the learner does nothing there, and numbering it
would overstate how much work the flow takes.

#### Scenario: The outcome follows the last step

- **WHEN** the last step of a guide has played
- **THEN** that platform's resting place for the icon is shown, carrying the course's icon

#### Scenario: The outcome is not numbered as a step

- **WHEN** the outcome is shown
- **THEN** it carries no step number, and the steps still count only the taps

### Requirement: An iPad is told apart from the Mac it claims to be

The application SHALL treat a browser as **iPad Safari** when its user agent is a Mac Safari
user agent **and** the device reports more than one touch point, and as **macOS Safari** when it
is a Mac Safari user agent reporting no touch points.

iPadOS 13 and later send a Macintosh user agent with no iPad token in it, so the user agent
alone cannot distinguish the two. `navigator.maxTouchPoints` can: a Mac reports `0` and an iPad
reports `5`. Getting this wrong serves one platform the other's guide, which would name controls
that are not on the learner's screen.

A Mac Safari user agent SHALL be one that carries Safari's own token and none of the tokens of
the Chromium and Gecko browsers that also claim to be Safari, nor the vendor tokens of the other
iOS browsers, none of which carries either flow.

A browser already running the app standalone SHALL NOT be treated as one that can still install.

Every signal here is a property of the browser, unknowable while rendering on the server, so the
decision SHALL be made after hydration and SHALL report nothing until then.

#### Scenario: An iPad is recognised despite its Mac user agent

- **WHEN** the user agent is Mac Safari and the device reports more than one touch point
- **THEN** the browser is treated as iPad Safari

#### Scenario: A Mac is not mistaken for an iPad

- **WHEN** the user agent is Mac Safari and the device reports no touch points
- **THEN** the browser is treated as macOS Safari

#### Scenario: A Chromium or Gecko browser on a Mac is neither

- **WHEN** the user agent carries a Chromium or Gecko token alongside Safari's
- **THEN** the browser is treated as neither iPad Safari nor macOS Safari

#### Scenario: Another iPad browser is not offered the flow

- **WHEN** the user agent carries another vendor's iOS token
- **THEN** the browser is treated as neither

#### Scenario: An installed app is not offered a guide

- **WHEN** the app is running in standalone display mode
- **THEN** the browser is treated as one that can no longer install

#### Scenario: It is not decided during hydration

- **WHEN** the application renders on the server or during the hydration pass
- **THEN** neither platform is reported, so the server and client markup agree

### Requirement: Both guides are localized down to the Safari label they name

All copy SHALL be read through `next-intl` and SHALL carry a translation in every locale the
application supports, including the names of the Safari controls themselves.

The iPad guide SHALL reuse the control labels the iPhone guide already defines — **Share**,
**View More**, **Add to Home Screen**, **Add**, **Open as Web App** — because iPadOS and iOS
name these controls identically. Reusing them is what stops the two guides ever disagreeing
about what a control is called.

The macOS guide SHALL define **Add to Dock**, which exists on no other platform.

The step sentences SHALL be each platform's own, because they describe positions the other
platforms' sentences get wrong.

The same localized label SHALL be used by a step's instruction and by the depiction that draws
it, so the two can never name different controls.

#### Scenario: The iPad reuses the iPhone's control labels

- **WHEN** the iPad guide names a control both devices carry
- **THEN** it reads the label the iPhone guide already defines for it

#### Scenario: The depiction names the control in the active locale

- **WHEN** a guide is rendered in a given locale
- **THEN** the target control drawn on the depiction carries that locale's label for it, and it
  is the same string the step's instruction uses

#### Scenario: Every locale writes every step

- **WHEN** the application's message files are compared against both step lists
- **THEN** every locale defines a sentence for each step of each platform
