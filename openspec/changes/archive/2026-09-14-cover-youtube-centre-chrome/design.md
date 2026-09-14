## Context

`LessonVideoPlayer` wraps a Vidstack `<MediaPlayer>` with the Default Video Layout. A
YouTube-sourced lesson runs through Vidstack's YouTube provider, which embeds the video in a
cross-origin `<iframe>` with `controls=0`, covers it with `.vds-blocker`, and stretches it to
1000 % of the provider so the embed's bottom bar falls outside the visible band. The embed's
**centre** chrome cannot be moved out that way — it sits on the video's centre, which is
the band's centre — and it cannot be styled or scripted from outside the frame.

Measured on 2026-09-14 with Playwright (WebKit + iPhone 13 UA, and desktop Chromium; the
harness served over `http://127.0.0.1`, since a top-level load now returns YouTube's
"Error 153" for a missing Referer), YouTube ships one embed skin to both engines:

| State                                       | Element YouTube paints                    | Box     |
| ------------------------------------------- | ----------------------------------------- | ------- |
| Cued, before the first play                 | `ytmCuedOverlayPlayButton` (red)          | 72 × 72 |
| ~0.6 s after `playVideo`, and on any stall  | `player-controls-spinner`                 | 36 × 36 |
| While YouTube shows its controls (~3 s after each play start) | `player-control-play-pause-icon` | 56 × 56 |

Over those the Player currently draws a 45 px disc at 60 % black (`VideoCenterPlayButton`
in the full chrome; the layout's own centre button in the compact chrome) and the Default
Layout's 96 px buffering ring, which is hollow. Both let YouTube's element show.

Relevant library facts, read from `@vidstack/react@1.15.6`:

- `<Poster>` with no `src` falls back to the media state's `inferredPoster` — the
  `i.ytimg.com` thumbnail the YouTube provider discovers — and sets `data-visible` until the
  player's `started` state, which the state manager sets on the first `playing`. It sets
  `data-hidden` (display: none) when there is no src, no poster, or a load error, so
  rendering it for a self-hosted lesson without a poster paints nothing.
- `data-buffering` on the player is `canLoad && (!canPlay || waiting)`, and the YouTube
  provider notifies `waiting` from the embed's `Buffering` state — the two spinners are
  driven by one signal.
- The Default Layout fills a `bufferingIndicator` slot in both the small and the large
  layout and in the load layout; a slot value of `null` renders nothing, a React element
  replaces the default. The small layout's centre play button is the `playButton` slot and
  is styled through `--video-sm-play-button-size` and `--video-sm-play-button-bg`, with a
  `translateY(25%)` heuristic to approximate the frame's centre.

## Goals / Non-Goals

**Goals:**

- Exactly one visible control at the frame's centre in every state of a YouTube lesson:
  before the first play, while buffering, and while the controls are shown.
- The visible control is always the Player's own, so the chrome stays localized, themed,
  and interactive (the embed's icon is behind the blocker and never acts).
- One geometry for the centre control across the full and the compact chrome.
- No behavioural change to gestures, control-bar timing, or the resume overlay.

**Non-Goals:**

- Hiding, moving, or reaching YouTube's chrome itself.
- Showing YouTube's chrome as the fallback control.
- Touching the gold title cover or the pre-boot skeleton.

## Decisions

### D1 — Render `<Poster>` unconditionally, and let the element decide

The `poster !== undefined` guard around `<Poster>` goes away. The element resolves its own
source (`src` prop → player `poster` → `inferredPoster`) and hides itself when none exists,
so the guard duplicated a rule the library already owns and, for YouTube lessons, got the
answer wrong: it withheld the one element that covers the embed's cued chrome.

*Alternative considered:* paint our own `<img>` from a thumbnail URL we build for the video
id. Rejected — the provider already probes `maxresdefault` → `sddefault` → … with WebP and
falls back correctly; duplicating that is a second source of truth for the same picture.

*Alternative considered:* hide the poster only for YouTube and keep the guard for MP4.
Rejected — a branch on source in the JSX contradicts the spec's "no second player
implementation for YouTube", and the element's own hidden state already makes the
unconditional render a no-op for a poster-less MP4.

Consequence for the cinema title cover: none. The cover's condition reads lesson data, not
the DOM, and the spec already says a YouTube lesson never gets the cover.

### D2 — Centre control geometry is one CSS rule set, applied to both chromes

`lesson-video-player.css` gains two custom properties on the player,
`--lesson-player-centre-control-size: 64px` and `--lesson-player-centre-control-bg: #000`,
and both centre controls read them:

- `.lesson-video-player__center-play-button` (the Player's own, full chrome): size, opaque
  background, centred with `top/left: 50%` and a negative margin of half the size.
- `.vds-video-layout[data-sm] .vds-controls .vds-play-button` (the layout's, compact
  chrome): the layout's `--video-sm-play-button-size` / `--video-sm-play-button-bg` are
  pointed at the same two properties, and the button is positioned absolutely at the frame's
  centre, replacing the `translateY(25%)` approximation. Its containing block is the middle
  `.vds-controls-group` (Vidstack makes every group `position: relative`), which sat 12 px
  above the frame's centre when measured — so that group, the column's third child (the
  selector Vidstack's own stylesheet uses for it), is stretched `inset: 0` over the frame
  with `pointer-events: none`, and the button takes the pointer back. Its hover transform is
  set to `none` so a fine pointer at compact width cannot nudge it off the icon.

64 px ≥ 56 px leaves a 4 px margin on every side for sub-pixel centring differences between
the provider's iframe and the player box. `#000` is chosen over a near-black token because
the frame's own background is black — the disc reads as a hole in the video, the same
treatment YouTube's app uses for its own centre controls.

*Alternative considered:* remove the compact chrome's button via `slots.smallLayout.playButton = null`
and let `VideoCenterPlayButton` serve both chromes. Rejected — the small layout has no
other play/pause button, so a fine pointer at compact width (a narrow desktop window)
would lose its only play control, since the Player's control correctly renders nothing on
a fine pointer.

*Alternative considered:* a translucent disc large enough to cover. Rejected — any alpha
below 1 shows a white ghost of the icon; the requirement is that one control is seen.

### D3 — A Player-owned buffering indicator in the `bufferingIndicator` slot

New component `VideoBufferingIndicator` in
`src/components/lesson-view/video-buffering-indicator/`, rendered into the Default Layout's
`bufferingIndicator` slot. It reproduces the layout's own markup — a `.vds-buffering-indicator`
holding `Spinner.Root/Track/TrackFill` with the `vds-buffering-*` classes, so every existing
token (`--media-brand`, sizes, transitions) keeps applying — and adds one element, the
**core**: a `.lesson-video-player__buffering-core` disc of 44 px, opaque `#000`, absolutely
centred inside the indicator. Its visibility follows the ring's exactly: opacity 0 by
default, 1 under `[data-media-player][data-buffering]`, with the same transition, all in
`lesson-video-player.css`.

The indicator is `aria-hidden` (the layout's own is decorative too; the announcer reports
buffering), and it renders for every source: the load, small and large layouts all fill
the same slot, and one treatment for both kinds of lesson is what the spec asks.

*Alternative considered:* `bufferingIndicator: null` for YouTube lessons and keep YouTube's
spinner. Rejected by the user as the last resort — it is unthemed, unlocalizable, and makes
the two kinds of lesson load differently.

*Alternative considered:* CSS only, painting the core as a `::before` on the default
indicator. Rejected — the default's spinner element is the direct child and a pseudo on
`.vds-buffering-indicator` would need `pointer-events` and stacking rules that fight the
library's `:where()` layers; a component we own is plainer to read and to test.

### D4 — Verification in the browser, plus the iOS simulator

Geometry and opacity are painted facts, so the e2e suite measures them against a YouTube
lesson: the centre control's box, its computed background alpha, and that its centre
matches the player's; the poster's `data-visible` state and `ytimg.com` source before
play; the buffering core's size and opacity rule. The user asked for a final check on the
iOS simulator as well, because the real iPhone reported the icon in states the desktop
engines did not (the 2026-09-10 note saw it while *paused*); the disc is drawn whenever
the controls are visible, which covers that case, but it is confirmed by eye.

## Risks / Trade-offs

- [YouTube changes the size or position of its centre chrome] → The margins (64 vs 56,
  44 vs 36) absorb small changes; a large one is a new measurement, and the numbers live in
  two custom properties, not scattered through rules.
- [The opaque disc hides 64 px of video while the controls are shown] → That is the
  requirement's trade: one control seen. It leaves with the controls after the idle delay,
  as before.
- [Poster stays over a YouTube video that never reaches `playing`] → Same behaviour as
  today's black frame for a broken embed, but with a thumbnail; the resume overlay and the
  control bar still render above it (poster is `pointer-events: none`).
- [Absolute centring of the compact button changes its position by a few pixels from
  today's heuristic] → Intended; the e2e test pins the new position to the frame's centre.
- [A `[data-buffering]` player before `canPlay` shows the core over the poster on MP4
  lessons] → The default ring already shows there; the core is the same duration and sits
  inside the ring.

## Testing strategy

| Behaviour | Layer | Where / pattern mirrored |
| --- | --- | --- |
| `<Poster>` is rendered for a YouTube lesson with no `poster`; still rendered with one; a self-hosted lesson without one renders it hidden | Vitest component + RTL | `lesson-video-player.test.tsx`, "GIVEN a lesson whose video lives on YouTube" — the existing `.vds-poster` queries, with the null assertion inverted |
| `VideoBufferingIndicator` renders the ring markup (`vds-buffering-spinner`, track, track-fill) plus the core, is decorative (`aria-hidden`) | Vitest component + RTL | new `video-buffering-indicator.test.tsx`, mirroring `video-center-play-button.test.tsx` (mocked `@vidstack/react` where needed) |
| The Player passes the indicator into the layout's `bufferingIndicator` slot | Vitest component + RTL | `lesson-video-player.test.tsx` — the layout renders nothing under jsdom, so this asserts the slot prop reaching `DefaultVideoLayout` via the existing module-mock pattern, or is delegated to e2e if the mock is not already in place |
| Centre control ≥ 64 px, opaque, centred on the frame (Player's own on iPhone landscape; layout's in the compact chrome) | Playwright e2e | `e2e/lesson-video-player.spec.ts`, "GIVEN Safari on an iPhone" — `boundingBox()` + `getComputedStyle` |
| Poster visible with a `ytimg.com` source before the first play on a YouTube lesson; gone after `playing` | Playwright e2e | same file, "GIVEN a YouTube-sourced lesson" |
| Buffering core exists at 44 px, opaque, and is transparent while the video plays | Playwright e2e | same file — the buffering state itself cannot be forced reliably, so the rule is asserted by toggling `data-buffering` on the player element and reading computed opacity |
| Stories: `VideoBufferingIndicator` (buffering and idle), `VideoCenterPlayButton` unchanged in logic | Storybook, reviewed with Playwright MCP | new `video-buffering-indicator.stories.tsx` under `LessonView/` |
| The real iPhone: one control at every state of a YouTube lesson | Manual, iOS simulator (Xcode) | per the user's request; recorded in tasks |
