## Why

A YouTube-sourced lesson shows two controls where the learner expects one: the embed's own
centre chrome — a 72 px red play button before the first play, a 36 px spinner while it
buffers, a 56 px play/pause icon for a few seconds after every play start — paints through
the Player's chrome, and the Player draws its own 45 px translucent centre button and its
own 96 px buffering ring *around* them. Measured on 2026-09-14, YouTube now serves that one
skin to desktop and phone alike, so the doubled controls are visible on every device, not
only on iPhone. The embed is a cross-origin `<iframe>`, Vidstack already sends
`controls=0`, and the IFrame API offers nothing to hide the centre chrome: the only thing the
Player can do is make sure exactly one control is *seen*, by covering the embed's.

## What Changes

- **The Player's poster covers the embed before the first play.** Vidstack's `<Poster>` is
  rendered for every lesson, not only for lessons that declare a `poster`. With no `src` it
  paints the thumbnail the YouTube provider already discovers and stays until frames roll,
  so the embed's red cued button is never seen. A self-hosted lesson without a poster keeps
  its black idle frame (the element hides itself when it has nothing to paint).
- **The centre play/pause control is sized and painted to hide the embed's icon.** The
  Player's own centre control and the compact chrome's centre button share one geometry:
  centred exactly on the frame, at least 64 px, on an opaque disc, so the 56 px icon behind
  it never shows through or around it.
- **The buffering indicator gets an opaque core.** The Default Layout's `bufferingIndicator`
  slot is filled by a Player-owned indicator: the same brand-coloured ring, with an opaque
  disc at its centre at least 44 px wide that hides the embed's 36 px spinner. The Player's
  `waiting` state is derived from YouTube's own Buffering state, so the two indicators
  always coincide and the disc never shows over a video that is playing.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `lesson-page`: "The Player is the native HTML5 `<video controls>` element" — the Poster
  element is rendered for a YouTube lesson without a `poster` too, painting the provider's
  thumbnail over the embed until playback starts; "The Player draws a centre play/pause
  control on touch" — the control, and the compact chrome's centre button, are at least
  64 px, opaque, and centred exactly on the frame; a new requirement states that the
  buffering indicator hides the embed's own spinner behind an opaque core.

## Impact

- `src/components/lesson-view/lesson-video-player/lesson-video-player.tsx` — render
  `<Poster>` unconditionally; fill the `bufferingIndicator` slot.
- `src/components/lesson-view/lesson-video-player/lesson-video-player.css` — shared centre
  control geometry (size, opaque disc, exact centring) for the Player's control and the
  compact chrome's button; the buffering core's geometry and visibility.
- New `src/components/lesson-view/video-buffering-indicator/` (component, test, story,
  JSDoc).
- `lesson-video-player.test.tsx` — the "no Poster for a YouTube lesson" assertion inverts.
- `e2e/lesson-video-player.spec.ts` — geometry and opacity assertions on a YouTube lesson,
  desktop and iPhone emulation.
- No new dependencies, no message keys, no domain change.

## Non-goals

- Removing or reaching YouTube's own chrome (impossible from outside the frame).
- Falling back to YouTube's controls, spinner, or poster as the visible control — the
  Player's chrome stays the one the learner sees, on every source.
- Any change to what a tap or click does, to the seek run, the hold, or the control bar's
  idle timing.
- The gold title cover and its condition (`cinema-lesson-view`) — untouched.
- The pre-boot placeholder skeleton (`loading-skeletons`) — untouched.
