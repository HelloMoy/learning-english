## ADDED Requirements

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

A double tap or double click SHALL keep its existing meaning: seeking ten seconds on the
left and right fifth of the frame, and toggling the browser's fullscreen elsewhere.

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

#### Scenario: Double tap still seeks and toggles fullscreen
- **WHEN** the learner double-taps the left or right fifth of the video, or its middle
- **THEN** the video seeks ten seconds back or forward, or the browser's fullscreen is
  toggled, respectively

#### Scenario: Overlays that take the pointer do not toggle playback
- **WHEN** the learner taps a control in the control bar, a button of the resume
  overlay, or the scroll hint's dismiss control
- **THEN** that control acts and playback is not toggled by the tap
