## ADDED Requirements

### Requirement: The seek keys seek by the learner's step and draw the seek indicator

A press of one of the Player's **seek keys** SHALL seek the video by one **seek step** in
that key's direction: the step the learner chose, as governed by "The learner chooses how
far a double tap seeks". The seek keys are the left and right arrow keys, and the letter
pair the Player's shortcut table binds to the same two actions. The keys SHALL NOT seek
by any other amount, and no place SHALL spell a number of seconds for them.

A seek key SHALL start a **seek run** in its direction, or extend the run that is active,
exactly as a tap on that edge does under "A double tap on an edge seeks in visible,
repeatable steps": the same anchor arithmetic, the same lapse window, the same step
carried for the run's whole life, and a press in the opposite direction SHALL start a new
run anchored at the target of the run it replaces. A run started by a key and a run
started by a tap SHALL be the same run — a tap on an edge SHALL extend a run a key began,
and a key SHALL extend a run a tap began.

A seek key SHALL be answered by the **seek indicator** that requirement describes, on the
side the video moved, with its label counting the seconds the run has seeked so far. The
Player SHALL NOT draw any other indicator for a seek key; in particular the keyboard
display the layout draws for its other shortcuts SHALL NOT appear for one.

A key **held down** SHALL keep seeking: every repeat the platform delivers SHALL add one
step to the run, as a further press does.

The keys SHALL be the Player's only while **keyboard focus is inside the Player**. There
they SHALL be left to a focused element that uses them itself — a text field, an item of
an open menu, a slider other than the time slider — and SHALL be left to the browser when
a modifier that makes them a browser command is held. Focus resting on the **time
slider** SHALL NOT keep them from the run, since that is where a click on the timeline
leaves it. Holding `Shift` SHALL NOT change the step.

A seek key SHALL NOT seek and SHALL draw nothing when any of the following is true:

- the Player's keyboard shortcuts are suppressed, as they are while the resume offer is
  open;
- the video cannot be seeked;
- a hold from "Pressing and holding the video runs it at double speed" is active.

The keys SHALL NOT scroll the page while they act on the Player.

#### Scenario: The right arrow seeks one step forward and says so
- **WHEN** a lesson is at 0:00, the step is the five-second default, the Player has
  keyboard focus, and the learner presses the right arrow key
- **THEN** the video seeks to 0:05 and an indicator on the right half shows forward
  chevrons and the label "5 seconds"

#### Scenario: The left arrow seeks one step backward and says so
- **WHEN** a lesson is at 0:30, the step is the five-second default, the Player has
  keyboard focus, and the learner presses the left arrow key
- **THEN** the video seeks to 0:25 and an indicator on the left half shows backward
  chevrons and the label "5 seconds"

#### Scenario: The chosen step governs the keys
- **WHEN** the learner has chosen a ten-second step, a lesson is at 0:00, and the learner
  presses the right arrow key
- **THEN** the video seeks to 0:10 and the label reads "10 seconds"

#### Scenario: A second press adds a step
- **WHEN** the forward indicator is up after one right-arrow press from 0:00 at a
  five-second step and the learner presses the right arrow again
- **THEN** the video seeks to 0:10 and the label reads "10 seconds"

#### Scenario: A held key keeps seeking
- **WHEN** the learner holds the right arrow key long enough for the platform to repeat
  it twice at a five-second step
- **THEN** the run has asked for three steps and the label reads "15 seconds"

#### Scenario: The other arrow turns the run around
- **WHEN** the forward indicator reads "10 seconds" after a run from 0:00 at a
  five-second step and the learner presses the left arrow key
- **THEN** the video seeks to 0:05, the indicator moves to the left half with backward
  chevrons, and the label reads "5 seconds"

#### Scenario: A tap extends a run the keyboard started
- **WHEN** the forward indicator is up after one right-arrow press and the learner taps
  the right fifth of the video once
- **THEN** the run counts two steps and the label reads the total

#### Scenario: The layout's keyboard display stays away
- **WHEN** the learner presses a seek key
- **THEN** the seek indicator is the only thing drawn in answer, and the keyboard display
  the layout shows for its other shortcuts is not shown

#### Scenario: The other shortcuts keep their display
- **WHEN** the learner presses the Player's mute key
- **THEN** the layout's keyboard display answers as it did before

#### Scenario: The letter keys do the same
- **WHEN** the learner presses the letter the Player's shortcut table binds to seeking
  forward
- **THEN** the video seeks one step forward and the seek indicator says so

#### Scenario: Focus on the timeline does not keep the arrows
- **WHEN** the learner clicks the time slider, leaving keyboard focus on it, and presses
  the right arrow key
- **THEN** the video seeks one step of the learner's choosing and the seek indicator says
  so

#### Scenario: The volume slider keeps the arrows
- **WHEN** the volume slider has keyboard focus and the learner presses the right arrow
  key
- **THEN** the volume changes, the video does not seek, and no seek indicator appears

#### Scenario: A browser shortcut is left alone
- **WHEN** the learner presses an arrow key together with a modifier that makes it a
  browser command
- **THEN** the Player does not seek and the browser receives the key

#### Scenario: Suppressed shortcuts silence the keys
- **WHEN** the resume offer is open over the Player and the learner presses an arrow key
- **THEN** the video does not seek and no indicator appears

#### Scenario: A video that cannot be seeked shows nothing
- **WHEN** the video cannot be seeked and the learner presses an arrow key
- **THEN** no seek is requested and neither the seek indicator nor the layout's keyboard
  display appears

#### Scenario: A hold blocks the keys
- **WHEN** a speed hold is active and the learner presses an arrow key
- **THEN** the video does not seek, the hold keeps running, and no seek indicator appears

## MODIFIED Requirements

### Requirement: The learner chooses how far a double tap seeks

The Player SHALL offer the learner a **seek step** setting with exactly three values —
**3, 5 and 10 seconds**, listed shortest first — and SHALL apply the chosen one to every
seek the Player performs in steps: the double-tap gesture described by "A double tap on
an edge seeks in visible, repeatable steps", and the seek keys described by "The seek
keys seek by the learner's step and draw the seek indicator". **Five seconds SHALL be the
default**, applied to a learner who has never chosen.

The setting SHALL be reachable from the Player's own **settings menu** — the control the
layout already opens from its gear button — as a submenu whose button names the setting
and whose hint shows the value in force, alongside the menu's existing entries. Its
options SHALL be a single-choice group in which exactly one option is marked selected at
a time. Choosing an option SHALL take effect immediately, without reloading the page and
without interrupting playback.

The setting SHALL be available in **both of the Player's layouts** — the large one a
desktop browser gets and the small one a phone gets — and SHALL remain reachable while
the video fills the viewport, since that is where the gesture is most used.

The chosen value SHALL be **persisted in the browser's `localStorage`** under this app's
own key namespace, SHALL survive a reload and a navigation to another lesson, and SHALL
apply to every lesson rather than to the one it was chosen on. A stored value that is
absent, unreadable, or not one of the three offered — an interval the Player once
offered included — SHALL be treated as "never chosen"
and SHALL resolve to the default, without throwing and without clearing the rest of the
app's storage. A browser that denies `localStorage` SHALL still play lessons and still
seek, at the default step.

The Player's first paint SHALL agree with the server-rendered markup: the stored value
SHALL NOT be read in a way that makes the hydration render differ from the server's.

The setting's copy — its name and the label of each option — SHALL come from `next-intl`
for every supported locale, and SHALL never be an untranslated English string.

#### Scenario: The setting is in the player's settings menu
- **WHEN** the learner opens the Player's settings menu
- **THEN** an entry for the seek step is listed among the menu's items, showing the
  value currently in force

#### Scenario: Five seconds is what a new learner gets
- **WHEN** a learner who has never chosen a step opens the setting
- **THEN** the five-second option is the selected one, and a double tap on an edge seeks
  five seconds

#### Scenario: Choosing a step applies at once
- **WHEN** the learner selects the ten-second option while a lesson is playing
- **THEN** playback is not interrupted and the next double tap on an edge seeks ten
  seconds

#### Scenario: One step governs the tap and the keys
- **WHEN** the learner selects the three-second option
- **THEN** the next double tap on an edge and the next press of a seek key each seek
  three seconds

#### Scenario: The choice survives a reload
- **WHEN** the learner chooses ten seconds and reloads the lesson
- **THEN** the setting still shows ten seconds and a double tap seeks ten seconds

#### Scenario: The choice follows the learner to another lesson
- **WHEN** the learner chooses ten seconds on one lesson and opens a different lesson
- **THEN** the setting shows ten seconds there too

#### Scenario: A corrupt stored value falls back to the default
- **WHEN** the stored value is missing, unparseable, or a number outside the three
  offered options
- **THEN** the setting shows five seconds, a double tap seeks five seconds, and nothing
  throws

#### Scenario: The setting is reachable on a phone
- **WHEN** a lesson is open in Safari on an iPhone, in the page and again with the video
  enlarged, and the learner opens the Player's settings menu
- **THEN** the seek step entry is listed and an option can be chosen

#### Scenario: The setting is localized
- **WHEN** the setting renders in each supported locale
- **THEN** its name and its option labels are that locale's copy, with no English
  fallback text
