## Why

On a phone, a tap anywhere on the lesson video pauses it. Every video app the learner
already uses — YouTube, the iOS player, Netflix — answers that tap by revealing the
control bar, and reserves play/pause for the play/pause button itself. The learner taps
to reach the scrubber and loses their place in the lesson instead.

The Player behaves this way on purpose: "A single tap on the video toggles playback"
(`openspec/specs/lesson-page/spec.md`) was written because Safari on iPhone paints the
YouTube embed's own centre play/pause icon through the Player's chrome, and the Player
lets no pointer reach the embed — so before that rule, the one icon on screen in enlarged
landscape was dead. Restoring the platform convention means answering that trap a second
time, with a control of this Player's own rather than with the tap.

## What Changes

- **BREAKING** — on a **coarse pointer** (touch), a single tap on the video area no longer
  toggles playback. It toggles the control bar: hidden controls appear, visible controls
  hide. On a **fine pointer** (mouse, trackpad), a click keeps toggling playback exactly
  as it does today.
- The Player draws its **own centre play/pause button** over the video whenever the
  controls are visible on a coarse pointer — including the full chrome used in the
  enlarged landscape mode, where the layout has no centre button of its own and the
  YouTube icon is otherwise the only one on screen. Tapping it toggles playback; it is the
  target the leaked icon sits behind, so the icon stops reading as dead.
- Everything else the frame answers is unchanged: a double tap in the middle toggles
  fullscreen, a double tap on an edge starts a seek run and every further tap on that edge
  seeks one step, a press held on the frame runs the lesson at double speed, and overlays
  that take the pointer (control bar, resume overlay, scroll hint) still act on their own.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `lesson-page`: "A single tap on the video toggles playback" is rewritten — the tap's
  meaning now depends on the pointer type, and a new requirement covers the Player's own
  centre play/pause button on touch.

## Non-goals

- Changing what a **mouse** click does. Click-to-pause is the desktop convention and stays.
- Hiding, reaching, or styling the YouTube embed's leaked icon. It is inside a
  cross-origin frame; the answer stays "draw our own control over it".
- Auto-hide timing, the control bar's own appearance, or which controls it carries.
- The double tap, the seek run, the speed hold, and the keyboard shortcuts.
- The enlarged-video mode's geometry and the scroll hint.

## Impact

- `src/components/lesson-view/lesson-video-player/playback-gestures.tsx` — the tap gesture
  becomes pointer-type aware.
- A new `src/components/lesson-view/video-center-play-button/` component (+ stories,
  tests, JSDoc, `Components.*` translations in `en`, `es`, `pt`).
- `src/components/lesson-view/lesson-video-player/lesson-video-player.tsx` and its
  stylesheet — render and place the centre button, and keep it off where the layout
  already draws one.
- `src/components/lesson-view/lesson-video-player/lesson-video-player.test.tsx` and the
  player's story — the tap expectations invert on touch.
- `openspec/specs/lesson-page/spec.md` via this change's delta.
- Verified by hand on the iOS simulator, since the behaviour only exists on a coarse
  pointer.
