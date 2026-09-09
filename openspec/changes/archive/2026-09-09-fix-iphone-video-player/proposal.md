## Why

On iPhone Safari the lesson player is broken in two ways that make a video lesson
close to unusable, and both were reproduced and measured on a real iOS 26.5 device:

1. **The player box grows to roughly five times its height.** Vidstack hides YouTube's
   own chrome by stretching the embed `<iframe>` to `height: 1000%` and clipping it with
   `overflow: hidden` on the provider. iOS Safari clips the *painting* but still sizes
   the outer box from the overflowing in-flow iframe, so the lesson's player wrapper
   measures **1198px instead of ~220px**. The learner sees a 16:9 video followed by a
   huge black slab and has to scroll through it to reach the title, the notes and the
   Mark-as-complete action.
2. **There is no fullscreen control.** iPhone Safari exposes no element Fullscreen API
   at all (`document.fullscreenEnabled` and `document.webkitFullscreenEnabled` are both
   `undefined`); the only fullscreen entry point is `webkitEnterFullscreen()` on a
   `<video>` element. Every lesson in the catalog is YouTube-sourced, so the provider is
   an `<iframe>` and there is no `<video>` to call it on. Vidstack marks its fullscreen
   button unsupported and its own stylesheet hides it. No learner on an iPhone can
   enlarge a lesson.

Android and desktop are unaffected, which is why this went unnoticed.

## What Changes

- The embed `<iframe>` is taken **out of the layout flow** so that the provider's
  `overflow: hidden` bounds the player's height on iOS the same way it already does
  everywhere else. The 16:9 frame, the hidden YouTube chrome, and the desktop rendering
  are unchanged.
- The Player gains a **fullscreen affordance that does not depend on the Fullscreen
  API**: a pseudo-fullscreen mode that pins the player to the viewport
  (`position: fixed; inset: 0`). It is the single fullscreen path on every browser, so
  there is no second behavior to maintain.
- Pseudo-fullscreen keeps the player's own chrome, the in-player resume overlay, and the
  playback-position writes intact, because the player element and its subtree are the
  same in both modes.
- Exiting is reachable by the same control, by `Escape`, and by the browser's own back
  gesture, so a learner cannot be trapped in the mode.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lesson-page`: the Player requirement currently promises "a 16:9 box that fills the
  width of the center column" and a Default Layout that provides "fullscreen". Both
  promises are silently broken on iPhone Safari. The requirement is amended to state
  the height bound as a guarantee that holds on iOS, and to define fullscreen as a
  viewport-filling mode the Player provides itself rather than one delegated to the
  browser's Fullscreen API.

## Impact

- `src/components/lesson-view/lesson-video-player/lesson-video-player.css` — the iframe
  layout override.
- `src/components/lesson-view/lesson-video-player/lesson-video-player.tsx` — the
  fullscreen control and the mode's state.
- `src/messages/{en,es,pt}.json` — the control's accessible name under
  `Components.VideoPlayer`.
- Colocated Vitest tests and Storybook stories for the player.
- No domain, adapter, or content changes; no new dependency.

## Non-goals

- **Native iOS fullscreen.** Reaching iOS's system video player would mean handing the
  lesson over to YouTube's own chrome on iPhone, losing the app's controls and its
  localized labels. That trade was considered and rejected.
- **Replacing Vidstack or the YouTube provider.** The 1000% trick is the library's, and
  this change works with it rather than forking it.
- **Screen-orientation locking.** Rotating the phone is the learner's choice; the mode
  simply fills whatever viewport it is given.
- **Self-hosted MP4 lessons.** The catalog is entirely YouTube today. The fix must not
  regress them, but no MP4-specific behavior is added.
- **Any other iOS Safari rendering difference** not named above.
