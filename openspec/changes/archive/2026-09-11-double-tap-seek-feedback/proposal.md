## Why

A double tap on the left or right fifth of the lesson video already seeks ten seconds,
but nothing on screen says so: no arrows, no "10 seconds" label, only a scrubber that
moved. And the gesture stops at one step. Vidstack's double-tap gesture resets its press
counter after it fires, so a learner who keeps tapping the way the YouTube app taught
them gets a *single* tap on the third press, which pauses the video 250 ms later instead
of adding another ten seconds. The one place the gesture is documented for learners —
their thumbs — currently promises the YouTube behaviour and delivers a pause.

## What Changes

- A double tap on either edge of the video shows a **seek indicator** on that side:
  a translucent half-disc with pulsing chevrons pointing the way the video moved and a
  localized, plural-aware "10 seconds" label. It leaves on its own shortly after the
  last tap.
- Consecutive taps on the same edge, made while the indicator is up, **each add another
  step** and the label counts up (20 seconds, 30 seconds…). Every seek in the run
  targets `anchor ± steps × interval`, so a still-pending seek never makes the next one
  lose a step.
- A tap on the **opposite edge** while the indicator is up starts a run in that
  direction from where the video now is; a tap in the middle band while it is up is
  absorbed, so a learner mid-run never pauses the video by accident.
- The single tap keeps toggling playback and the middle double tap keeps toggling
  fullscreen, before a run and after it lapses.
- The **ten-second interval** becomes one named constant that the gesture actions, the
  seek targets and the label all read from; today it is the literal `10` inside two
  action strings.
- The `lesson-page` spec's "single tap toggles playback" requirement is updated where it
  describes the double tap, and a new requirement states the seek run.

## Capabilities

### New Capabilities

_None._ The seek run is a requirement on the Player, which `lesson-page` already
specifies.

### Modified Capabilities

- `lesson-page`: the requirement "A single tap on the video toggles playback" has its
  double-tap paragraph and scenario rewritten to defer to a new requirement, "A double
  tap on an edge seeks in visible, repeatable steps", which states the indicator, the
  accumulation, the absorption of middle taps during a run, and the single interval
  constant.

## Impact

- `src/components/lesson-view/lesson-video-player/` — the private gesture helper grows a
  seek run: the four Vidstack gestures are disabled while a run is active, the seek
  gestures hand their double tap to the run instead of seeking themselves, and a
  listener on the player handles the run's further taps. Its stylesheet and tests change
  with it.
- New `src/lib/seek-run/` (pure run arithmetic: start, extend, target time, label
  seconds, and the interval constant) and `src/hooks/use-seek-run/` (the run's state and
  its lapse timer).
- New `src/components/lesson-view/seek-feedback/` — the indicator, with stories, tests,
  JSDoc, and `Components.SeekFeedback` copy in `en`, `es` and `pt`.
- `src/app/globals.css` — one keyframe for the chevron pulse, next to `arrow-drop`.
- `e2e/lesson-video-player.spec.ts` — double-tap scenarios under iPhone emulation.
- No dependency changes. Vidstack's `Gesture` stays the tap detector, so its guards
  (scroll, pinch, open menu, pointer button) are not reimplemented.

## Non-goals

- A settings control for the interval. It stays ten seconds; the constant exists so a
  future setting has one place to write.
- Reproducing YouTube's exact artwork or timing; the shape is the app's own.
- Changing what a single tap or a middle double tap does.
- Keyboard seeking (arrow keys) and the control bar's seek buttons — untouched.
- Hiding the control bar during a run.
