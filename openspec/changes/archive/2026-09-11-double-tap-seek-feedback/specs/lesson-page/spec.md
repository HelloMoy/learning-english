## MODIFIED Requirements

### Requirement: A single tap on the video toggles playback

A single tap or click on the video area of the Player SHALL toggle between playing and
paused, on every pointer type, in the Player's compact and full chrome alike, and both
while the video is in the page and while it fills the viewport.

The rule exists because a YouTube-sourced Lesson on a phone shows the embed's own centre
play/pause icon through the Player's chrome: the mobile YouTube skin draws it even with
the embed's controls disabled, the Player deliberately lets no pointer event reach the
embed, and the icon cannot be hidden from outside a cross-origin frame. The Player SHALL
NOT let the tap through to the embed — the embed's overlay also carries links that leave
the Lesson — and SHALL NOT rely on the pointer type to decide whether the tap acts. A tap
on a touch device that only reveals the control bar SHALL NOT be the Player's behaviour.

The Player's control bar SHALL still become visible on that tap, so a learner who tapped
to reach the scrubber finds it on screen.

A double tap or double click on the middle band of the frame SHALL keep toggling the
browser's fullscreen. A double tap on the left or right fifth of the frame seeks, as
stated by "A double tap on an edge seeks in visible, repeatable steps"; while a seek run
from that requirement is active, a tap on the video SHALL NOT toggle playback or
fullscreen.

A tap on an element drawn over the video that takes the pointer — the control bar, the
in-player resume overlay, the scroll hint's dismiss control — SHALL NOT toggle playback.

#### Scenario: A tap pauses the video on a phone
- **WHEN** a YouTube-sourced lesson is playing in Safari on an iPhone and the learner
  taps once on the video, away from the control bar
- **THEN** the video pauses and the control bar is shown

#### Scenario: A second tap resumes it
- **WHEN** the video is paused after such a tap and the learner taps the video again
- **THEN** the video resumes playing

#### Scenario: The tap acts while the video fills the viewport
- **WHEN** the video is enlarged on an iPhone held in landscape, so the embed's own
  centre icon is the only one on screen, and the learner taps that icon
- **THEN** playback toggles exactly as it would in the page

#### Scenario: A click on a mouse keeps toggling playback
- **WHEN** a lesson is playing in a desktop browser and the learner clicks once on the
  video
- **THEN** the video pauses, as before this requirement existed

#### Scenario: No tap merely reveals the controls
- **WHEN** the Player's chrome renders on any device
- **THEN** it carries no gesture whose only effect is to show or hide the control bar

#### Scenario: A middle double tap still toggles fullscreen
- **WHEN** no seek run is active and the learner double-taps the middle band of the
  video
- **THEN** the browser's fullscreen is toggled

#### Scenario: Overlays that take the pointer do not toggle playback
- **WHEN** the learner taps a control in the control bar, a button of the resume
  overlay, or the scroll hint's dismiss control
- **THEN** that control acts and playback is not toggled by the tap

## ADDED Requirements

### Requirement: A double tap on an edge seeks in visible, repeatable steps

A double tap or double click on the right fifth of the video SHALL seek the video
forward by one **seek step**, and on the left fifth backward by one step. The step
SHALL be ten seconds and SHALL be declared once, as a single named constant, that the
gesture actions, the seek targets and the indicator's label all read; no other place
SHALL spell the number.

The double tap SHALL start a **seek run** on that side. While a run is active the Player
SHALL draw a **seek indicator** over the tapped half of the frame: a translucent shape
on that side, chevrons pointing the way the video moved, and a label naming the seconds
the run has seeked so far. The direction SHALL be carried by the glyphs in the markup —
a left-pointing glyph for backward, a right-pointing glyph for forward — never by a CSS
transform of one glyph, so a device holding a stale stylesheet cannot draw the wrong
direction. The indicator SHALL NOT take the pointer.

Every further single tap on the **same edge** while the run is active SHALL seek one
more step and SHALL update the label to the run's total, so three taps read "30
seconds". Every seek in a run SHALL target `anchor ± steps × step`, where the anchor is
the playback position when the run started, so a seek the provider has not finished
applying never makes the next one lose a step. The provider's own bounds apply to the
target; the label counts the steps requested.

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
- **WHEN** a lesson is at 0:00 and the learner double-taps the right fifth of the video
- **THEN** the video seeks to 0:10 and an indicator on the right half shows forward
  chevrons and the label "10 seconds"

#### Scenario: A double tap on the left edge seeks backward and says so
- **WHEN** a lesson is at 0:30 and the learner double-taps the left fifth of the video
- **THEN** the video seeks to 0:20 and an indicator on the left half shows backward
  chevrons and the label "10 seconds"

#### Scenario: A third tap on the same edge adds a step
- **WHEN** the forward indicator is up after a double tap from 0:00 and the learner taps
  the right fifth once more
- **THEN** the video seeks to 0:20 and the label reads "20 seconds"

#### Scenario: A pending seek does not lose a step
- **WHEN** a run started at 0:00 has requested two forward steps and the provider has
  not yet reported the first one applied, and the learner taps the right fifth again
- **THEN** the third request targets 0:30, not ten seconds past whatever the provider
  currently reports

#### Scenario: A tap on the opposite edge starts a run the other way
- **WHEN** the forward indicator reads "20 seconds" after a run from 0:00 and the learner
  taps the left fifth once
- **THEN** the video seeks to 0:10, the indicator moves to the left half with backward
  chevrons, and the label reads "10 seconds"

#### Scenario: A middle tap during a run is absorbed
- **WHEN** an indicator is up and the learner taps the middle band of the video once
- **THEN** playback does not toggle, fullscreen does not toggle, and the video does not
  seek

#### Scenario: The run ends and the single tap is back
- **WHEN** the learner stops tapping after a run and the run's window elapses
- **THEN** the indicator is no longer shown and a single tap on the video toggles
  playback

#### Scenario: The step is declared once
- **WHEN** the seek step is changed in its constant
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
