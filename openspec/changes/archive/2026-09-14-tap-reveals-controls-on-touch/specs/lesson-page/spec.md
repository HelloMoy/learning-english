## ADDED Requirements

### Requirement: The Player draws a centre play/pause control on touch

Whenever the Player's control bar is visible on a **coarse pointer**, the Player SHALL
draw a **play/pause control at the centre of the video frame**, over the video, in the
Player's compact and full chrome alike and both while the video is in the page and while
it fills the viewport. Activating it SHALL toggle playback.

The control exists because the tap no longer toggles playback on touch, and because a
YouTube-sourced Lesson on a phone paints the embed's own centre play/pause icon through
the Player's chrome. It SHALL be placed over the region where that icon is drawn, so a
learner reaching for the icon lands on a control that acts. The Player's full chrome
draws no centre control of its own, which is why the one place the leaked icon used to
be alone — the video filling the viewport in landscape — is covered by this requirement.

Exactly one centre play/pause control SHALL ever be on screen: where the Player's own
layout already draws one, as its compact chrome does, the Player SHALL NOT draw a second.

The control SHALL take the pointer, and a tap on it SHALL NOT also toggle the control
bar. It SHALL leave with the control bar, so a learner watching an uninterrupted lesson
sees nothing drawn over the video. It SHALL NOT be drawn on a fine pointer, where a
click on the frame already toggles playback.

Its hit area SHALL be at least 44 by 44 CSS pixels. Its accessible name SHALL name the
action it performs — play while paused, pause while playing — and SHALL come from
`next-intl` for every supported locale.

#### Scenario: The centre control appears with the controls
- **WHEN** a lesson is playing on a phone in the Player's full chrome and the learner
  taps the video once, revealing the control bar
- **THEN** a play/pause control is drawn at the centre of the frame

#### Scenario: Tapping it pauses the lesson
- **WHEN** that control is on screen and the learner taps it
- **THEN** the video pauses and the control bar stays visible

#### Scenario: It leaves with the controls
- **WHEN** the control bar hides again
- **THEN** no centre control is drawn over the video

#### Scenario: The compact chrome is not given two
- **WHEN** the Player renders its compact chrome on a phone, which draws a centre
  play/pause button of its own, and the controls are visible
- **THEN** exactly one centre play/pause control is on screen

#### Scenario: A mouse gets no centre control
- **WHEN** a lesson is watched with a mouse and the control bar is visible
- **THEN** no centre control is drawn, and a click on the frame toggles playback

#### Scenario: It covers the embed's own icon
- **WHEN** a YouTube-sourced lesson fills the viewport on an iPhone held in landscape,
  the controls are visible, and the learner taps the icon the embed paints at the centre
- **THEN** the Player's own centre control receives the tap and playback toggles

#### Scenario: Its name is localized
- **WHEN** the control renders in each supported locale
- **THEN** its accessible name is that locale's word for the action it performs, with no
  English fallback text

## MODIFIED Requirements

### Requirement: A single tap on the video acts by pointer type

A single tap or click on the video area of the Player SHALL act according to the pointer
that made it.

**On a fine pointer** — a mouse, a trackpad, a pen — a click SHALL toggle between
playing and paused, in the Player's compact and full chrome alike, and both while the
video is in the page and while it fills the viewport. That is the desktop convention and
is unchanged.

**On a coarse pointer** — a finger — a tap SHALL reveal the control bar when it is
hidden, SHALL hide it when it is visible, and SHALL NOT toggle playback. A control bar
brought in by that tap over a playing video SHALL leave on its own after the Player's
usual idle delay, as it does after any other touch; over a paused video it SHALL stay in
view. Playback on
touch SHALL be toggled by a play/pause control alone: the control bar's own, or the
centre control stated by "The Player draws a centre play/pause control on touch". That
is the convention of every video app the learner already uses on a phone, and a tap that
paused the lesson cost them their place whenever they reached for the scrubber.

The Player SHALL NOT let the tap through to the embed — the embed's overlay carries
links that leave the Lesson. A YouTube-sourced Lesson on a phone shows the embed's own
centre play/pause icon through the Player's chrome: the mobile YouTube skin draws it even
with the embed's controls disabled, and the icon cannot be hidden from outside a
cross-origin frame. The answer to that icon SHALL be a control of the Player's own drawn
over it, as "The Player draws a centre play/pause control on touch" requires — never the
tap's meaning, and never letting the pointer reach the embed.

A tap here means a press that ends **before** the threshold named by "Pressing and
holding the video runs it at double speed". A press held past that threshold is a hold,
and the release that ends it SHALL NOT toggle playback, fullscreen or the control bar.

A double tap or double click on the middle band of the frame SHALL keep toggling the
browser's fullscreen. A double tap on the left or right fifth of the frame seeks, as
stated by "A double tap on an edge seeks in visible, repeatable steps"; while a seek run
from that requirement is active, a tap on the video SHALL NOT toggle playback,
fullscreen or the control bar.

A tap on an element drawn over the video that takes the pointer — the control bar, the
centre play/pause control, the in-player resume overlay, the scroll hint's dismiss
control — SHALL NOT toggle playback or the control bar.

#### Scenario: A tap reveals the controls on a phone
- **WHEN** a YouTube-sourced lesson is playing in Safari on an iPhone with the control
  bar hidden and the learner taps once on the video, away from any control
- **THEN** the control bar appears and the video keeps playing

#### Scenario: Controls brought in by a tap leave on their own
- **WHEN** a tap has brought the control bar in over a playing video and the learner
  does nothing more
- **THEN** the control bar leaves after the Player's usual idle delay and the video
  keeps playing

#### Scenario: A second tap hides them again
- **WHEN** the control bar is visible and the learner taps the video again, away from
  any control
- **THEN** the control bar hides and the video keeps playing

#### Scenario: Only a control pauses the video on touch
- **WHEN** the control bar is visible and the learner taps the centre play/pause control
  or the control bar's play/pause button
- **THEN** the video pauses

#### Scenario: A click on a mouse keeps toggling playback
- **WHEN** a lesson is playing in a desktop browser and the learner clicks once on the
  video
- **THEN** the video pauses, as it did before this requirement was rewritten

#### Scenario: The tap acts while the video fills the viewport
- **WHEN** the video is enlarged on an iPhone held in landscape, so the embed's own
  centre icon is the only thing drawn at the centre, and the learner taps it
- **THEN** the control bar appears, together with the Player's own centre play/pause
  control, and a second tap on that control toggles playback

#### Scenario: A middle double tap still toggles fullscreen
- **WHEN** no seek run is active and the learner double-taps the middle band of the
  video
- **THEN** the browser's fullscreen is toggled

#### Scenario: A released hold changes nothing
- **WHEN** the learner presses the video, holds past the speed-up threshold, and lifts
- **THEN** the video keeps playing and neither playback, nor fullscreen, nor the control
  bar is toggled

#### Scenario: Overlays that take the pointer do not toggle the controls
- **WHEN** the learner taps a control in the control bar, a button of the resume
  overlay, or the scroll hint's dismiss control
- **THEN** that control acts, playback is not toggled by the tap, and the control bar
  does not hide

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
absorbed: it SHALL NOT toggle playback, SHALL NOT toggle fullscreen, SHALL NOT toggle
the control bar, and SHALL NOT seek.

A run SHALL end on its own a short, fixed time after its last tap — long enough to
chain taps at a natural pace, short enough that the next deliberate tap after a pause is
a fresh single tap. When it ends the indicator SHALL leave, and the next tap SHALL mean
what "A single tap on the video acts by pointer type" says.

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
- **THEN** playback does not toggle, fullscreen does not toggle, the control bar does
  not toggle, and the video does not seek

#### Scenario: The run ends and the single tap is back
- **WHEN** the learner stops tapping after a run and the run's window elapses
- **THEN** the indicator is no longer shown and a single tap on the video means what "A single tap on the video acts by pointer type" says — the control bar on a touch device, playback on a mouse

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

### Requirement: Pressing and holding the video runs it at double speed

A press held on the video area of the Player past a short, fixed threshold SHALL run
playback at **double speed** for as long as the press lasts, and SHALL restore the rate
that was in force when the press began the moment it ends. The rate applied SHALL be
double speed absolutely, not double the rate already in force, and SHALL reach the
player and the indicator's label from one source; no place SHALL spell a rate of its
own.

The threshold SHALL be long enough that an ordinary tap never reaches it and short
enough that the gesture answers within about half a second, matching the convention of
the video app whose single tap and edge seeks this Player already follows.

While the hold is active the Player SHALL draw a **speed indicator** over the frame
naming the rate, with the direction carried by a glyph in the markup rather than by a
CSS transform, and the indicator SHALL NOT take the pointer.

The hold SHALL NOT begin when any of the following is true, and in each case the press
SHALL keep the meaning it has today:

- the video is paused — a hold SHALL never start playback;
- a seek run from "A double tap on an edge seeks in visible, repeatable steps" is
  active;
- the provider cannot have its playback rate set;
- the press began on an element drawn over the video that takes the pointer — the
  control bar, the in-player resume overlay, the scroll hint's dismiss control;
- the press was not made with the primary pointer button.

A press that **moves** past a small distance before the threshold elapses SHALL NOT
begin a hold. This SHALL keep the swipe that hides the browser's toolbar, which travels
through the pinned player while the video fills the viewport, from being read as a hold.
A hold already under way SHALL end when the browser cancels the pointer, as it does when
it takes the touch over for a scroll, and the rate SHALL be restored then as on a normal
release.

The press that became a hold SHALL NOT also toggle playback, fullscreen or the control
bar when it ends.
Releasing a hold SHALL leave the video playing.

The gesture SHALL work in the Player's compact and full chrome alike, both while the
video is in the page and while it fills the viewport, and on every pointer type — a held
mouse button behaves as a held finger does.

**The Player's play/pause key SHALL carry the same gesture.** Holding that key past the
same threshold SHALL run the video at double speed for as long as it is held, under the
same conditions as a held pointer, and SHALL restore the rate when it is released.
Releasing it before the threshold SHALL toggle playback, which is what that key does
today; a key held past the threshold SHALL NOT toggle playback when it is released, and
a key repeat SHALL NOT be read as a second press. The key SHALL NOT scroll the page
while it is held, and SHALL keep its own meaning for a focused control that wants it —
a button with keyboard focus SHALL still be activated by it.

A press long enough to become a hold SHALL NOT raise the browser's context menu or the
platform's long-press callout over the video.

The indicator's copy SHALL come from `next-intl` for every supported locale, SHALL pass
the rate as a number so each locale renders its own digits and decimal mark, and SHALL
be exposed to assistive technology as a status whose text names the speed in words, with
the visible label hidden from it so the rate is not read twice.

#### Scenario: Holding the video speeds it up
- **WHEN** a lesson is playing and the learner presses the video and keeps the finger
  down past the threshold
- **THEN** the video runs at double speed and the speed indicator names that rate

#### Scenario: Releasing restores the speed and keeps playing
- **WHEN** the learner lifts the finger after such a hold
- **THEN** the video returns to the rate it had before the press, the indicator leaves,
  and the video is still playing

#### Scenario: The rate the learner had chosen is what comes back
- **WHEN** the video is playing at a rate other than normal and the learner holds and
  then releases
- **THEN** the video runs at double speed during the hold and returns to that other
  rate, not to normal speed

#### Scenario: A short tap keeps the meaning a tap has
- **WHEN** the learner presses and lifts before the threshold
- **THEN** the tap means exactly what "A single tap on the video acts by pointer type" says — the control bar on a touch device,
  playback on a mouse — and the rate never changes

#### Scenario: A hold never pauses the video
- **WHEN** the learner holds past the threshold and then releases
- **THEN** the video is not paused by that release

#### Scenario: A swipe through the video is not a hold
- **WHEN** the video fills the viewport on an iPhone and the learner swipes up through
  the player to hide the browser's toolbar, with the finger resting briefly before it
  moves
- **THEN** the page scrolls, no speed indicator appears, and the rate never changes

#### Scenario: A hold does not start a paused video
- **WHEN** the video is paused and the learner presses the video and holds
- **THEN** the video stays paused, no indicator appears, and the rate never changes

#### Scenario: A seek run blocks the hold
- **WHEN** a seek run is active and the learner presses and holds the video
- **THEN** the rate never changes and the run keeps the behaviour its own requirement
  states

#### Scenario: A held mouse button speeds the video up
- **WHEN** a lesson is playing in a desktop browser and the learner presses and holds the
  primary mouse button on the video
- **THEN** the video runs at double speed until the button is released, and no context
  menu appears

#### Scenario: A press on an overlay is not a hold
- **WHEN** the learner presses and holds a control in the control bar, a button of the
  resume overlay, or the scroll hint's dismiss control
- **THEN** that control keeps its own behaviour and the rate never changes

#### Scenario: A provider that cannot change rate shows nothing
- **WHEN** the Player's provider reports that its playback rate cannot be set and the
  learner holds the video
- **THEN** no indicator appears and no rate change is requested

#### Scenario: Holding the play/pause key speeds the video up
- **WHEN** a lesson is playing, the Player has keyboard focus, and the learner holds the
  play/pause key past the threshold
- **THEN** the video runs at double speed and the speed indicator names that rate

#### Scenario: Releasing the held key restores the speed without pausing
- **WHEN** the learner releases that key after such a hold
- **THEN** the video returns to its previous rate, the indicator leaves, and the video is
  still playing

#### Scenario: A short press of that key still toggles playback
- **WHEN** the learner presses and releases the play/pause key before the threshold
- **THEN** playback toggles and the rate never changes

#### Scenario: The key's own repeat is not a second press
- **WHEN** the learner holds the key long enough for the platform to repeat it
- **THEN** one hold runs, uninterrupted, until the key is released

#### Scenario: A focused control keeps the key
- **WHEN** a control in the Player's chrome has keyboard focus and the learner presses
  the key
- **THEN** that control is activated and no hold begins

#### Scenario: The indicator is localized
- **WHEN** the indicator renders in each supported locale
- **THEN** its label is that locale's copy, with no English fallback text

## RENAMED Requirements

- FROM: `### Requirement: A single tap on the video toggles playback`
- TO: `### Requirement: A single tap on the video acts by pointer type`
