## MODIFIED Requirements

### Requirement: A double tap on an edge seeks in visible, repeatable steps

A double tap or double click on the right fifth of the video SHALL seek the video
forward by one **seek step**, and on the left fifth backward by one step. The step SHALL
be the learner's chosen one, as governed by "The learner chooses how far a double tap
seeks"; where no choice has been stored it SHALL be the default that requirement names.
The step SHALL reach the gesture actions, the seek targets and the indicator's label
from that one source; no place SHALL spell a number of seconds of its own.

The double tap SHALL start a **seek run** on that side. While a run is active the Player
SHALL draw a **seek indicator** over the tapped half of the frame: a translucent shape
on that side, chevrons pointing the way the video moved, and a label naming the seconds
the run has seeked so far. The direction SHALL be carried by the glyphs in the markup —
a left-pointing glyph for backward, a right-pointing glyph for forward — never by a CSS
transform of one glyph, so a device holding a stale stylesheet cannot draw the wrong
direction. The indicator SHALL NOT take the pointer.

Every further single tap on the **same edge** while the run is active SHALL seek one
more step and SHALL update the label to the run's total, so three taps at a five-second
step read "15 seconds". Every seek in a run SHALL target `anchor ± steps × step`, where
the anchor is the playback position when the run started, so a seek the provider has not
finished applying never makes the next one lose a step. The provider's own bounds apply
to the target; the label counts the steps requested.

A run SHALL carry the step it started with for its whole life. A step chosen while a run
is in flight SHALL NOT change the seconds that run counts or targets; it SHALL govern
the next run instead, so the indicator can never contradict a seek it already claimed.

A single tap on the **opposite edge** while a run is active SHALL start a new run in
that direction, anchored at the target of the run it replaces, with its label starting
again at one step. A single tap on the **middle band** while a run is active SHALL be
absorbed: it SHALL NOT toggle playback, SHALL NOT toggle fullscreen, and SHALL NOT seek.

A run SHALL end on its own a short, fixed time after its last tap — long enough to
chain taps at a natural pace, short enough that the next deliberate tap after a pause is
a fresh single tap. When it ends the indicator SHALL leave, and the next tap SHALL mean
what "A single tap on the video toggles playback" says.

The indicator's copy SHALL come from `next-intl` for every locale, SHALL be
plural-aware through an ICU plural, and SHALL be exposed to assistive technology as a
status whose text carries the direction in words, with the visible label hidden from it
so the seconds are not read twice. Under `prefers-reduced-motion` the indicator SHALL
not pulse.

#### Scenario: A double tap on the right edge seeks forward and says so
- **WHEN** a lesson is at 0:00, the step is the five-second default, and the learner
  double-taps the right fifth of the video
- **THEN** the video seeks to 0:05 and an indicator on the right half shows forward
  chevrons and the label "5 seconds"

#### Scenario: A double tap on the left edge seeks backward and says so
- **WHEN** a lesson is at 0:30, the step is the five-second default, and the learner
  double-taps the left fifth of the video
- **THEN** the video seeks to 0:25 and an indicator on the left half shows backward
  chevrons and the label "5 seconds"

#### Scenario: A third tap on the same edge adds a step
- **WHEN** the forward indicator is up after a double tap from 0:00 at a five-second
  step and the learner taps the right fifth once more
- **THEN** the video seeks to 0:10 and the label reads "10 seconds"

#### Scenario: A longer step moves the video further
- **WHEN** the learner has chosen a ten-second step, a lesson is at 0:00, and the
  learner double-taps the right fifth
- **THEN** the video seeks to 0:10 and the label reads "10 seconds"

#### Scenario: The shortest step moves the video less
- **WHEN** the learner has chosen a three-second step, a lesson is at 0:30, and the
  learner double-taps the left fifth
- **THEN** the video seeks to 0:27 and the label reads "3 seconds"

#### Scenario: A pending seek does not lose a step
- **WHEN** a run started at 0:00 at a five-second step has requested two forward steps
  and the provider has not yet reported the first one applied, and the learner taps the
  right fifth again
- **THEN** the third request targets 0:15, not five seconds past whatever the provider
  currently reports

#### Scenario: A tap on the opposite edge starts a run the other way
- **WHEN** the forward indicator reads "10 seconds" after a run from 0:00 at a
  five-second step and the learner taps the left fifth once
- **THEN** the video seeks to 0:05, the indicator moves to the left half with backward
  chevrons, and the label reads "5 seconds"

#### Scenario: A run in flight keeps the step it started with
- **WHEN** a forward run at a five-second step reads "10 seconds", the step is changed
  to ten seconds, and the learner taps the same edge once more before the run lapses
- **THEN** the label reads "15 seconds" and the video targets fifteen seconds past the
  run's anchor

#### Scenario: A middle tap during a run is absorbed
- **WHEN** an indicator is up and the learner taps the middle band of the video once
- **THEN** playback does not toggle, fullscreen does not toggle, and the video does not
  seek

#### Scenario: The run ends and the single tap is back
- **WHEN** the learner stops tapping after a run and the run's window elapses
- **THEN** the indicator is no longer shown and a single tap on the video toggles
  playback

#### Scenario: The step is read from one source
- **WHEN** the learner's step changes
- **THEN** the gesture actions, the seek targets and the indicator's label all follow,
  with no other edit

#### Scenario: The indicator is localized and plural-aware
- **WHEN** the indicator renders in each supported locale
- **THEN** its label is that locale's phrasing for the seconds, with the singular form
  for one second and the plural otherwise

#### Scenario: Reduced motion stills the chevrons
- **WHEN** the device prefers reduced motion and an indicator is shown
- **THEN** the chevrons are drawn without their pulse and the indicator still shows the
  direction and the label

## ADDED Requirements

### Requirement: The learner chooses how far a double tap seeks

The Player SHALL offer the learner a **seek step** setting with exactly three values —
**3, 5 and 10 seconds**, listed shortest first — and SHALL apply the chosen one to the double-tap gesture
described by "A double tap on an edge seeks in visible, repeatable steps". **Five
seconds SHALL be the default**, applied to a learner who has never chosen.

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
