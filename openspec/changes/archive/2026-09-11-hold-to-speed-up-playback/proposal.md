## Why

A learner re-watching a lesson has no way to skim a passage they already know. The
Player's only fast way through the video is the double-tap seek, which jumps blind: it
skips the audio entirely, so the learner overshoots and taps back. The YouTube app
solved this with a gesture our learners already know — hold a finger on the video and it
runs at double speed until the finger lifts — and this Player is already built on that
app's conventions for the single tap and the edge seeks.

## What Changes

- Pressing and holding the video for a short, fixed moment SHALL run playback at **2×**
  for as long as the press lasts, and restore the previous rate the moment it ends.
- **Holding the play/pause key** — `Space` or `K`, the keys the Player already binds —
  SHALL do the same, as the desktop web player the learner knows does. A short press of
  that key SHALL keep toggling playback.
- A **speed indicator** appears over the video while the hold is active, naming the rate,
  in the manner of the existing seek indicator.
- The press that triggered a hold SHALL NOT also toggle playback when the finger lifts —
  the single-tap gesture keeps its meaning only for presses shorter than the threshold.
- The hold SHALL NOT start while a seek run is active, and SHALL NOT start unless the
  video is playing and the provider can set a playback rate.
- The new copy is added to every locale's message file.

## Capabilities

### New Capabilities

_None._ The gesture belongs to the Player, whose behaviour the Lesson Page spec already
governs alongside the single tap and the double-tap seek.

### Modified Capabilities

- `lesson-page`: a new requirement for the press-and-hold speed-up gesture, and an
  amendment to "A single tap on the video toggles playback" so a press long enough to
  trigger a hold no longer toggles playback when it ends.

## Non-goals

- **Adjustable speed while holding.** The YouTube app lets the learner slide sideways to
  pick a rate; here the rate is fixed at 2×.
- **A slow-down gesture.** Holding to run at 0.5× would serve listening practice, but it
  needs its own trigger and its own answer to what a hold on each side means; it is a
  separate change.
- **A persisted speed setting.** The rate this gesture applies lives only for the press.
  The layout's own speed menu, and whether this app should offer one, are untouched.
- **Any keyboard key but the play/pause one.** `Space` and `K` gain the hold; no other
  shortcut of the Player's changes.
- **Changing the double-tap seek or the seek step setting.** Both keep their behaviour.

## Impact

- `src/components/lesson-view/lesson-video-player/playback-gestures.tsx` — the gesture set
  gains the hold; the single tap learns to stand down after one.
- `src/components/lesson-view/lesson-video-player/lesson-video-player.tsx` — the player's
  key shortcuts hand the play/pause key to the gesture.
- A new hook for the hold's lifetime and a new indicator component, colocated per the
  folder-per-entity rule.
- `src/messages/{en,es,pt}.json` — a namespace for the indicator's copy.
- No domain, adapter, or persistence code is touched; no new dependency.
