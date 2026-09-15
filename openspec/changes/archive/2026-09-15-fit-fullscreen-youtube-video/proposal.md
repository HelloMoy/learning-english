## Why

On screens wider than 16:9 — most Android phones held in landscape (19.5:9, 20:9), and
Chrome's mobile emulation — a YouTube-sourced lesson in the browser's own fullscreen
shows the video cropped at the top and the bottom, while the controls fit the screen
correctly. The side edges are fine. It does not happen on iPhone, because Safari has no
element Fullscreen API there and the Player's own enlarged mode is used instead, which
already keeps a 16:9 box.

The cause is the one the enlarged mode was designed around: the YouTube embed lays its
video out against the frame's **width** and the player shows only the middle band of an
oversized frame. In native fullscreen the provider takes the screen's own shape, so a
band shorter than `width × 9/16` cuts the video top and bottom.

## What Changes

- While the Player is in the browser's own fullscreen, the video area (the provider) is
  bounded to the largest 16:9 box that fits the screen and centred in it; the black
  player background fills the rest (pillarbox).
- The control bar, gestures and overlays keep spanning the whole screen, as they do today.
- Nothing changes in the page, in portrait fullscreen, or in the enlarged fallback mode.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `lesson-page`: adds a requirement that the video is fitted without cropping in the
  browser's own fullscreen, the same guarantee the enlarged fallback already gives.

## Non-goals

- Changing the enlarged fallback mode used on iPhone.
- Zoom-to-fill / crop-to-fill options for the learner.
- Letterboxing inside non-16:9 source videos (the embed already does that itself).
- Changing the control layout in fullscreen.

## Impact

- `src/components/lesson-view/lesson-video-player/lesson-video-player.css` — one rule
  scoped to `[data-media-player][data-fullscreen]`.
- `src/components/lesson-view/lesson-video-player/lesson-video-player.tsx` — JSDoc
  remarks updated to cover the fullscreen case.
- `e2e/lesson-video-player.spec.ts` — new guard for the fullscreen geometry.
