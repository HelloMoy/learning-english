## Why

On an iPhone the enlarged, landscape lesson video shows a play/pause icon in the middle
of the frame that does nothing when tapped. That icon is not ours: Safari on iPhone gets
YouTube's *mobile* player skin, and even with the embed's controls disabled that skin
draws a centred play button while paused (and a pause button for a few seconds after
play starts). Vidstack covers the embed with a blocker and its gesture layer, and on a
touch device its tap gesture only shows or hides the control bar — the `toggle:paused`
gesture is switched off for coarse pointers — so the icon YouTube draws never receives
the tap. In the enlarged landscape mode with Safari's toolbar hidden the player is wide
enough for Vidstack's large layout, which has no centre play button of its own, so
YouTube's is the only one on screen and it is dead. Reproduced on the iOS 26.5
simulator on 2026-09-10; a lab page with the same embed parameters and no blocker shows
the same icon and it does resume playback when tapped.

The icon cannot be hidden (it lives inside a cross-origin `<iframe>` and YouTube offers
no parameter for it), so the fix is to make the tap do what the icon promises.

## What Changes

- A single tap on the video area toggles play/pause on touch devices, instead of only
  toggling the control bar. Vidstack shows the controls on pause and after a play
  anyway, so the bar still appears on every tap; what changes is that the tap also acts.
- Mouse behaviour is unchanged: a click already toggles play/pause on a fine pointer.
  Double-tap to seek on the edges and double-tap for fullscreen are kept as they are.
- The Default Layout's built-in gesture set is replaced by the Player's own, so the
  behaviour is the same in the large and the small layout, in the page and enlarged.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `lesson-page`: the Player gains a requirement that a single tap on the video toggles
  playback on a touch device, in every layout and in the enlarged mode, while a click
  on a fine pointer keeps doing the same.

## Impact

- `src/components/lesson-view/lesson-video-player/lesson-video-player.tsx` — passes
  `noGestures` to the Default Layout and renders its own gesture set inside the player.
- `src/components/lesson-view/lesson-video-player/lesson-video-player.css` — geometry
  for the gestures, which live outside the layout and so miss the layout's own rules.
- `src/components/lesson-view/lesson-video-player/lesson-video-player.test.tsx` — the
  gesture contract (which gestures exist, which do not).
- `e2e/lesson-video-player.spec.ts` — a tap on the video pauses and resumes playback
  under iPhone emulation; no `toggle:controls` gesture is rendered.
- Manual verification on the iOS 26.5 simulator, enlarged and in landscape.
- No dependency, configuration, copy, or domain changes.

## Non-goals

- Hiding YouTube's own icon, title, or "Watch on YouTube" affordances — impossible from
  outside the embed.
- Letting taps through to the embed. YouTube's overlay also carries links that would
  navigate the learner away from the lesson.
- Drawing a centre play button of our own in the large layout. It would cover YouTube's
  play icon while paused but not the transient pause icon, and a tap that acts covers
  both.
- Any change to keyboard shortcuts, the enlarge control, the scroll hint, or the resume
  overlay.
- Android or other touch engines beyond keeping the rule generic (`pointer: coarse`);
  only iPhone Safari was measured and is verified by hand.
