## ADDED Requirements

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

The press that became a hold SHALL NOT also toggle playback or fullscreen when it ends.
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

#### Scenario: A short tap still toggles playback
- **WHEN** the learner presses and lifts before the threshold
- **THEN** playback toggles, exactly as "A single tap on the video toggles playback"
  says, and the rate never changes

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

A tap here means a press that ends **before** the threshold named by "Pressing and
holding the video runs it at double speed". A press held past that threshold is a hold,
and the release that ends it SHALL NOT toggle playback or fullscreen.

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

#### Scenario: A released hold does not toggle playback
- **WHEN** the learner presses the video, holds past the speed-up threshold, and lifts
- **THEN** the video keeps playing and neither playback nor fullscreen is toggled

#### Scenario: Overlays that take the pointer do not toggle playback
- **WHEN** the learner taps a control in the control bar, a button of the resume
  overlay, or the scroll hint's dismiss control
- **THEN** that control acts and playback is not toggled by the tap
