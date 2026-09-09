## Context

The enlarged mode shipped in `2026-09-09-fix-iphone-video-player` pins the Vidstack player
to the viewport with a class and locks the page behind it with
`document.body.style.overflow = "hidden"` (`useEnlargedVideo`). The lock was carried over
from the modal idiom; it was never needed for the picture, because the backdrop already
hides the page.

On an iPhone that lock is the bug. Measured on the iOS 26.5 simulator on 2026-09-09, with
a throwaway lab page and then the real lesson page:

| Landscape, Safari toolbar on screen                     | Toolbar hides? | Viewport height |
| ------------------------------------------------------- | -------------- | --------------- |
| `Element.requestFullscreen` / `webkitRequestFullscreen` | not defined    | —               |
| `window.scrollTo(0, 400)`                               | no             | 292 of 402      |
| `scrollTo({ behavior: "smooth" })`, `scrollIntoView`    | no             | 292 of 402      |
| real upward swipe over a `position: fixed; inset: 0` box | **yes**        | **402 of 402**  |
| real upward swipe over the Vidstack YouTube player      | **yes**        | **402 of 402**  |
| real upward swipe with `body { overflow: hidden }`      | no             | 292 of 402      |

So: Safari hides its toolbar only for a real scroll gesture on the document; that gesture
passes straight through a fixed element to the document beneath it; and `overflow: hidden`
on `body` is the one thing that stops it. Rotation always brings the toolbar back, which is
why "enlarge, then rotate" gets stuck at 292pt while "rotate, swipe, then enlarge" — the
sequence the user found by hand — reaches the whole screen. `100lvh` reports 402 in both
states; `innerHeight`, `visualViewport.height` and `100dvh` follow the toolbar.

`screen.orientation.lock` is also undefined on iPhone, and `src/app/manifest.ts` already
declares `display: "standalone"`, so a Home Screen install is toolbar-free by itself.

## Goals / Non-Goals

**Goals:**

- The swipe that hides Safari's toolbar works while the video is enlarged, in either
  order of rotating and enlarging.
- A touch learner in landscape is told to swipe up while the toolbar still takes part of
  the screen, and is not nagged once it is gone.
- Leaving the mode puts the page back where the learner left it.
- No change to browsers with a real Fullscreen API, and no change to the player's
  identity, playback, resume overlay, or position writes.

**Non-Goals:**

- Hiding the toolbar programmatically, locking orientation, or any native fullscreen path
  (none exists for a YouTube `<iframe>` on iPhone).
- Changing the enlarged box's 16:9 fit.
- Promoting "Add to Home Screen".
- Verifying Android or other engines beyond keeping the hint's condition generic.

## Decisions

### 1. Remove the scroll lock rather than replace it

`useEnlargedVideo` stops touching `document.body.style.overflow` altogether. The page
behind the pinned player is covered by the fixed backdrop, so its scrolling is invisible
and harmless; what the lock bought was nothing, and what it cost is the gesture.

*Alternatives considered.* Locking everywhere except iOS was rejected: sniffing the OS is
what the previous change refused to do for the button, and the lock protects nothing on
any engine. Keeping the lock and toggling it off only while the toolbar is visible was
rejected as a state machine for a benefit nobody can see. A "spacer" that keeps the page
scrollable while locked is a contradiction.

### 2. Capture the scroll offset on entry and restore it on exit

Without the lock, a swipe made to hide the toolbar moves the page by 100–250px. On exit
the player would return to a box now partly under the sticky header. The hook records
`window.scrollY` when the mode is entered and calls `window.scrollTo` back to it when the
mode is left. It does **not** restore on unmount: an unmount mid-mode is a navigation,
and scrolling the *next* page to the old offset would be wrong. (Programmatic scrolling is
fine here — it is the toolbar-hiding that needs a real gesture, and after exit the
learner is back in the page where a visible toolbar is normal.)

*Alternative considered.* `player.scrollIntoView()` on exit needs the element in the hook
and lands the player somewhere new rather than where it was.

### 3. The hint's condition is a viewport-vs-screen inference, in its own hook

`useBrowserChromeVisible()` returns `true` when all of:

- `matchMedia("(pointer: coarse)").matches` — the primary pointer is a finger, so "swipe"
  is a real instruction. Measured during implementation: under Playwright's `hasTouch`
  emulation `(pointer: coarse)` is `true` in all three engines, whereas
  `navigator.maxTouchPoints` stays `0` in WebKit and Firefox (only Chromium reports `1`),
  so the media query is both the semantic signal and the one a test can drive.
- `matchMedia("(orientation: landscape)").matches` — portrait letterboxes the video
  anyway and Safari's portrait bar only collapses partially.
- `window.innerHeight < Math.min(screen.width, screen.height)` — the layout viewport is
  shorter than the screen's short side, which in landscape is the full height. iOS keeps
  `screen` in portrait terms whatever the orientation, other engines swap; `min` is
  correct for both. `innerHeight` is the value that follows the toolbar (`100dvh` does
  too, `100lvh` does not).

It is a `useSyncExternalStore` over `resize` and `orientationchange` (and
`visualViewport`'s `resize`, which fires on iOS when the toolbar animates), with a `false`
server snapshot so SSR and hydration agree. It lives in `src/hooks/use-browser-chrome-visible/`
because it is a reusable viewport fact, not a player fact.

*Alternative considered.* Measuring `100lvh` with a probe element gives the same answer
with a DOM node; `screen` is enough. Gating on the OS was rejected for the reason in the
previous change.

### 4. The hint is a small `SwipeUpHint` component inside the player box

`LessonVideoPlayer` already owns `isEnlarged`; it renders `<SwipeUpHint>` as a child of
`<MediaPlayer>` while `isEnlarged && useBrowserChromeVisible()`, absolutely positioned at
the top of the box (`absolute inset-x-0 top-3 z-20`), so it paints over the video and
above Vidstack's layout like the resume overlay does, and moves with the player without a
portal. The wrapper is `pointer-events-none` so the swipe it asks for lands on the player
and reaches the document; only its dismiss button is interactive. It is `role="status"`,
so assistive technology hears it without focus moving off the player.

Dismissal is local state inside the component's lifetime: the hint unmounts when the mode
ends, so the next enlarged session starts fresh. That is the cheapest reading of
"dismissible for the rest of that enlarged session" and needs no store.

Copy lives under `Components.SwipeUpHint` (`message`, `dismiss`) in every locale, per the
component naming convention; it is not player vocabulary, so it does not join
`Components.VideoPlayer`. The dismiss glyph is `lucide-react`'s `X`, like the resume
overlay's — this is app chrome, not a Vidstack control.

*Alternative considered.* Rendering the hint as a sibling of the backdrop with a higher
z-index would need `z-60` above the player and its own viewport maths; inside the box it
is already where the video is.

### 5. Existing docs move with the behaviour

The JSDoc of `useEnlargedVideo` and the "Enlarged, the player is pinned…" paragraph of
`LessonVideoPlayer` describe the scroll lock; both are rewritten to describe the gesture
pass-through and the scroll restore. The spec's own "the page behind it SHALL NOT scroll"
sentence is inverted in the delta.

## Risks / Trade-offs

- **A swipe *down* over the video brings the toolbar back and shrinks the box.** → That is
  Safari's standard behaviour on every page and is also how a learner reaches the URL bar;
  a swipe up hides it again, and the hint reappears while it is visible.
- **The page underneath scrolls while the learner watches.** → Invisible behind the
  backdrop; the offset is restored on exit. Keyboard scrolling (space, arrows) is captured
  by the player while it has focus, as before.
- **The hint's condition could fire on a touch laptop in a landscape window.** → Only
  while the *fallback* mode is active, which such a browser never enters because it has a
  Fullscreen API.
- **A page shorter than the viewport cannot be scrolled, so the swipe does nothing.** →
  Every lesson page carries notes below the player and is far taller than a phone's
  landscape viewport.
- **`screen` and `innerHeight` are read on the client only.** → `useSyncExternalStore`
  with a `false` server snapshot; the hint never renders on the server.
- **The iOS behaviour itself cannot be automated here.** → Playwright emulates the
  *inputs* (`hasTouch`, a landscape viewport shorter than an emulated `screen`) so the
  show/hide rule is asserted; the toolbar itself is verified by hand on the iOS 26.5
  simulator in both orderings and recorded in the verification notes.

## Testing strategy

| Behavior                                                                 | Layer                          | Where / pattern mirrored                                                                          |
| ------------------------------------------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------- |
| Entering the mode leaves `body` overflow untouched                       | Vitest (hook)                  | `use-enlarged-video.test.ts` — replaces the "page does not scroll" block                          |
| Scroll offset captured on entry, restored on exit, not restored on unmount | Vitest (hook, `scrollTo` spy)  | same file                                                                                         |
| `useBrowserChromeVisible` truth table and reactivity on `resize`         | Vitest (hook, jsdom stubs)     | `use-browser-chrome-visible.test.ts` — mirrors `use-is-hydrated` for `useSyncExternalStore`      |
| Hint renders localized copy, `role="status"`, dismiss hides it           | Vitest + RTL                   | `swipe-up-hint.test.tsx` — mirrors `video-enlarge-button.test.tsx` (mocked `next-intl`)          |
| Hint is absent while the video is in the page                            | Vitest + RTL                   | `lesson-video-player.test.tsx`                                                                    |
| Enlarging keeps the document scrollable (`body` has no overflow lock)    | Playwright (all engines)       | `e2e/lesson-video-player.spec.ts` — the inverted "page stops scrolling" test                      |
| Leaving the mode restores the scroll offset                              | Playwright                     | same file: scroll by script while enlarged, exit, assert `scrollY`                                |
| Hint shows on touch + landscape + short viewport, hides when the viewport grows, dismisses | Playwright (`hasTouch`, `screen` emulation, `setViewportSize`) | same file, new describe with `test.use({ ...IPHONE, viewport: 874×292, contextOptions: { screen: 402×874 } })` — `screen` is a context option, not a test option |
| Toolbar hides after a swipe in both orderings; the box reaches 402pt     | Manual, iOS 26.5 simulator     | recorded in the change's verification notes (rotate via `key code 123`, swipe via `cliclick`)     |
| Hint in `en`/`es`/`pt`                                                   | Storybook + Playwright MCP     | `swipe-up-hint.stories.tsx` under `LessonView/SwipeUpHint`                                       |

Each test is written red first, per the project's TDD rule. The first red is the inverted
e2e assertion and the hook test asserting `body` overflow stays `""` — both fail today.
