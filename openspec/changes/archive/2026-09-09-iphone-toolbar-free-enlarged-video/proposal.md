## Why

On an iPhone the enlarged lesson video only fills the whole screen when the learner
happens to rotate the phone, swipe Safari's toolbar away, and *then* tap the enlarge
control. In the natural order — enlarge first, rotate second — Safari re-shows its toolbar
on rotation and the video stays wedged into the 292 of 402 points that remain, with no
way out: the mode locks the page's scroll, and a real scroll gesture is the only thing
that hides Safari's toolbar. There is no programmatic path around this (iPhone Safari has
no element Fullscreen API and ignores programmatic scrolling for toolbar purposes, both
measured on iOS 26.5), so the fix is to stop blocking the gesture that works and to tell
the learner about it.

## What Changes

- The enlarged mode no longer locks the document's scroll. The page behind the pinned
  player stays scrollable (it is hidden behind the backdrop anyway), so a swipe over the
  video reaches Safari's scroll-driven toolbar hiding in either order: rotate-then-enlarge
  or enlarge-then-rotate.
- The scroll position the page had when the mode was entered is restored when the mode
  is left, so a swipe made to hide the toolbar does not leave the player scrolled out of
  view once the learner returns to the page.
- A dismissible "swipe up" hint is drawn over the enlarged video on a touch device in
  landscape while the browser's chrome still takes part of the screen (the viewport is
  shorter than the screen's short side). It disappears on its own once the viewport
  reaches the full height, and can be closed by hand.
- The hint's copy is added to every locale under `Components.SwipeUpHint`.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `lesson-page`: the requirement "The Player enlarges to fill the viewport without the
  Fullscreen API" changes from "while the mode is active, the page behind it SHALL NOT
  scroll" to "the page behind it SHALL remain scrollable and its position SHALL be
  restored on exit", and gains the landscape "swipe up" hint with its show/hide rule.

## Impact

- `src/hooks/use-enlarged-video/` — drops the `body` overflow lock; captures and restores
  the page's scroll offset across the mode.
- New hook `src/hooks/use-browser-chrome-visible/` — the viewport-vs-screen inference the
  hint is gated on.
- New component `src/components/lesson-view/swipe-up-hint/` (+ stories, tests, JSDoc).
- `src/components/lesson-view/lesson-video-player/lesson-video-player.tsx` — renders the
  hint inside the player box while enlarged.
- `src/messages/{en,es,pt}.json` — `Components.SwipeUpHint.*`.
- `e2e/lesson-video-player.spec.ts` — the "page stops scrolling" assertion inverts; a
  touch-landscape scenario covers the hint's show/hide rule.
- Manual verification on the iOS 26.5 simulator for the two orderings; no dependency or
  configuration changes.

## Non-goals

- Any attempt to hide Safari's toolbar programmatically, lock the orientation, or use a
  native fullscreen entry point. None exists for a YouTube-sourced lesson on an iPhone.
- Stretching the enlarged box beyond 16:9. The black side bands in landscape are the
  price of not cropping the YouTube embed and stay as they are.
- Promoting "Add to Home Screen" (the manifest already declares `display: standalone`,
  which gives a toolbar-free app) — a separate, product-level change.
- Behaviour of the browser's own fullscreen where the Fullscreen API exists; nothing
  changes there.
- Android or any other engine's toolbar behaviour: the hint's condition is generic, but
  only iPhone Safari was measured and is verified by hand.
