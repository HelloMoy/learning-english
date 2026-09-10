## Context

The lesson player is a Vidstack `<MediaPlayer>` with the Default Video Layout
(`lesson-video-player.tsx`). A YouTube-sourced lesson is served through Vidstack's
YouTube provider: an `<iframe>` with the embed's controls disabled, stretched to 1000%
so the embed's bottom bar falls outside the visible band, and covered by a `.vds-blocker`
so no pointer event reaches the embed. Over that the layout draws its own chrome and a
set of transparent gesture elements.

Measured on the iOS 26.5 simulator on 2026-09-10 (real lesson page and a lab page with
the exact embed parameters Vidstack builds — `controls=0`, `playsinline=1`,
`iv_load_policy=3`, `disablekb=1`, `enablejsapi=1`):

| What                                                             | Desktop skin (Mac) | Mobile skin (iPhone Safari)              |
| ---------------------------------------------------------------- | ------------------ | ---------------------------------------- |
| Centre play icon while paused, with `controls=0`                 | none               | white circle + triangle, permanent       |
| Centre pause icon after `playVideo`                              | none               | shown ~3 s, then hidden                  |
| Title, avatar, "Watch on YouTube", share                         | none               | drawn while the icon is                  |
| Tap on that icon without the blocker (lab page)                  | —                  | resumes playback (`playerState` 2 → 1)   |
| Tap on that icon in the app (blocker + gestures)                 | —                  | control bar toggles, playback unchanged  |

How Vidstack's gestures decide what a tap does (`Gesture` in the core, and
`layouts/video.css`):

- Every `Gesture` listens on the **provider** element, not on itself — `touchend` for a
  coarse pointer, `pointerup` otherwise — and checks the event's coordinates against its
  own box. Its element is `pointer-events: none`; it is a region, not a target.
- The Default Layout renders five: `pointerup → toggle:paused`,
  `pointerup → toggle:controls`, `dblpointerup → toggle:fullscreen`, and two 20%-wide
  edge regions `dblpointerup → seek:-10` / `seek:10`.
- Its stylesheet hides `toggle:paused` under `@media (pointer: coarse)` and hides
  `toggle:controls` under `@media not (pointer: coarse)`. On a phone a tap therefore only
  toggles the control bar; on a mouse a click toggles playback.
- When several gestures fire for one event, the one with the highest computed `z-index`
  wins (`#isTopLayer`). The edge seek regions carry `z-index: 1`.

Which centre button is on screen depends on the layout width. Below 576px
(`smallLayoutWhen`) the small layout draws a 45px dark play button in the middle of the
control bar, over YouTube's; that is portrait, and landscape while Safari's toolbar is on
screen (the enlarged box is `100dvh × 16/9` = 519px wide at 292pt). Once the toolbar
hides, the box is 714px wide, the large layout takes over, and it has no centre button —
YouTube's white one is the only thing there. That is the "enlarged and landscape" of the
report; the leak is the same in portrait, just hidden behind our own button until the
control bar auto-hides.

The controls' visibility is not affected by which gesture acts: `MediaControls` shows the
bar on every `pause`, shows-then-hides it on every `play`, and on a coarse pointer
restarts its idle timer on every `touchend` on the player.

## Goals / Non-Goals

**Goals:**

- A single tap on the video toggles play/pause on a touch device, in the page and
  enlarged, in the small and the large layout — so the icon YouTube draws does what it
  looks like it does.
- A click on a fine pointer keeps toggling play/pause; double-tap/double-click seeking
  and fullscreen are unchanged.
- No change to the player's identity, the enlarge control, the scroll hint, the resume
  overlay, or the position writes.

**Non-Goals:**

- Hiding or reaching YouTube's own overlay.
- A centre play button of our own in the large layout.
- Changing the control bar's auto-hide timing.

## Decisions

### 1. Replace the layout's gesture set instead of adding to it

`DefaultVideoLayout` gets `noGestures`, and `LessonVideoPlayer` renders its own four
`<Gesture>` elements as direct children of `<MediaPlayer>`:

| event          | action              | region      |
| -------------- | ------------------- | ----------- |
| `pointerup`    | `toggle:paused`     | whole box   |
| `dblpointerup` | `toggle:fullscreen` | whole box   |
| `dblpointerup` | `seek:-10`          | left 20%    |
| `dblpointerup` | `seek:10`           | right 20%   |

That is the Default Layout's set minus `toggle:controls`, with the coarse-pointer
`display: none` on `toggle:paused` not reproduced. The control bar still appears on every
tap, because `MediaControls` shows it on `pause` and on `play` and restarts its idle timer
on `touchend`; the difference is that the tap also acts.

*Alternatives considered.* Adding a sixth gesture over the layout's five and letting it
win on `z-index` leaves the layout's dead `toggle:controls` in the tree and depends on
the tie-break of an internal sort. Overriding the layout's stylesheet
(`.vds-gesture[action='toggle:paused'] { display: block }` under `pointer: coarse`) is a
fight with a `:where()` rule inside a media query in a third-party file, invisible to
anyone reading the component; and the `toggle:controls` gesture would still fire on the
same tap, so the tie-break problem returns. Replacing the set states the whole behaviour
in one place.

### 2. Gestures live in the player component, with geometry in its stylesheet

The four elements are a private helper in `lesson-video-player.tsx` — used once, not
exported, no folder of its own per the project's folder rule. They keep Vidstack's
`vds-gesture` class so the markup reads as what it is, and `lesson-video-player.css`
gives them the geometry the layout's stylesheet would have given them inside
`.vds-video-layout`: absolutely positioned over the whole player box, with the two seek
regions 20% wide, pinned to their edges, at `z-index: 1` so they beat the fullscreen
gesture on a double-tap at the edges. No visual output — the elements are transparent and
`pointer-events: none` (set by the component itself).

*Alternative considered.* A `LessonVideoGestures` component in its own folder, with the
stories, tests and copy the component rules ask for. It renders nothing visible and has no
copy; a story would need a whole player to show anything. Not worth a folder.

### 3. The tap-to-pause rule is not gated on the pointer type

The Default Layout's gating exists to give phones the YouTube-app convention
(tap = reveal controls). Here that convention is exactly the trap: the embed draws an icon
we cannot remove that promises the other convention. The rule is stated once for every
pointer — a click already toggles playback on a mouse — so there is no media-query branch
to keep in step with the stylesheet, and no `(pointer: coarse)` reading in the component.

## Risks / Trade-offs

- **A learner who taps to *see* the scrubber pauses the video.** → The bar appears in the
  same tap, so what they wanted is on screen; a second tap resumes. This is the Vimeo /
  Netflix mobile convention, and it is what the visible icon already promises.
- **A tap on the scroll hint's text pauses the video.** → The hint's wrapper is
  `pointer-events: none` by design, so the tap reaches the provider. The pill is small,
  sits at the top edge, and its dismiss button is the only thing a learner is asked to
  tap; acceptable.
- **A tap on the resume overlay must not toggle playback.** → The overlay is
  `absolute inset-0 z-20` and takes the pointer, so `touchend` fires on the overlay, not
  on the provider; the gestures never see it. Same for the control bar.
- **Two gestures triggered by one event rely on Vidstack's `z-index` tie-break.** → The
  edge regions carry an explicit `z-index: 1` and the whole-box ones an explicit `0`, so
  the comparison is between numbers, never `auto`.
- **`toggle:fullscreen` on double-tap does nothing on an iPhone.** → Unchanged from
  today; the enlarge control is the affordance there.
- **The iOS skin itself cannot be automated.** → Playwright under iPhone emulation
  drives the gesture path (`hasTouch` → coarse pointer → `touchend`); the icon and the
  perceived fix are verified by hand on the iOS 26.5 simulator.

## Testing strategy

| Behavior                                                                          | Layer                        | Where / pattern mirrored                                                                                     |
| --------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| The player renders a `pointerup → toggle:paused` gesture and no `toggle:controls`  | Vitest + RTL                 | `lesson-video-player.test.tsx` — a new `describe`; gestures are `MediaPlayer` children, so unlike the layout they mount under jsdom (like `Poster` does) |
| The seek and fullscreen double-tap gestures are present                            | Vitest + RTL                 | same describe                                                                                                |
| A tap on the video pauses and a second tap resumes, under iPhone emulation         | Playwright (webkit, `IPHONE`) | `e2e/lesson-video-player.spec.ts` — the existing "GIVEN Safari on an iPhone" describe; `revealControls` starts playback, then `[data-media-provider]` is tapped and `[data-media-player][data-paused]` asserted |
| The same tap acts while enlarged                                                   | Playwright (webkit, `IPHONE`) | same describe, after pressing the enlarge control                                                             |
| A click still toggles playback on a fine pointer                                   | Playwright (chromium)        | same file, desktop describe — click the provider, assert `data-paused`                                        |
| No `toggle:controls` gesture in the rendered layout                                | Playwright                   | same file — `.vds-gesture[action="toggle:controls"]` count is 0                                               |
| YouTube's centre icon responds in enlarged landscape                               | Manual, iOS 26.5 simulator   | tap the icon while paused → plays; tap while the pause icon shows → pauses; recorded in the verification notes |

Each test is written red first. The first red is the component test asserting a
`toggle:paused` gesture exists as a player child — today the player has none of its own —
and the e2e tap test, which today toggles the bar and leaves `data-paused` absent.
