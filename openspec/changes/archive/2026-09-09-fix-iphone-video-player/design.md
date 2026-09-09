## Context

Every lesson in the catalog is YouTube-sourced (48 of 48 in `src/content/basic-course.json`),
so `LessonVideoPlayer` always resolves to Vidstack's **YouTube provider**, which renders an
`<iframe>` rather than a `<video>`. Two consequences of that were never exercised on an
iPhone.

**The height.** Vidstack hides YouTube's own chrome with a stretch-and-clip trick in its
own stylesheet:

```css
iframe.vds-youtube[data-no-controls] { height: 1000%; }
[data-media-provider]                { overflow: hidden; height: 100%; }
```

The iframe is `position: static` — in flow. Measured on iOS 26.5 Safari at a 390px
viewport, against the same page in desktop WebKit:

| box                                        | desktop WebKit | iOS Safari |
| ------------------------------------------ | -------------- | ---------- |
| wrapper (`lesson-view.tsx:103`, `bg-black`) | 220            | **1198**   |
| `[data-media-player]`                       | 202            | 216        |
| `[data-media-provider]` (`overflow:hidden`) | 200            | 216        |
| `iframe.vds-youtube`                        | 2003           | 2163       |

The player and the provider are correct on both engines. Only the wrapper differs: on
WebKit for iOS, `overflow: hidden` clips the painting but the in-flow iframe still
contributes to the height of boxes *above* the clipping ancestor. 216 + (2163 − 216)/2
= 1189 ≈ the 1194px measured. That is the black slab in the bug report.

**The fullscreen control.** On the same device, `document.fullscreenEnabled` and
`document.webkitFullscreenEnabled` are both `undefined`; the only fullscreen entry point
is `webkitEnterFullscreen()` on a `<video>` element, and the YouTube provider has none.
Vidstack's `FullscreenButton` resolves `target: "prefer-media"` to nothing supported,
omits `data-supported`, and the library's own rule
`.media-button:not([data-supported]) { display: none }` hides it. The button is in the
DOM and invisible — confirmed in Playwright WebKit, which reports the same absent
Fullscreen API.

Both findings were reproduced end to end: in the real app on an iOS 26.5 simulator, and
in an isolated page replicating only Vidstack's DOM and stylesheet, which ruled out this
project's own CSS as a factor.

## Goals / Non-Goals

**Goals:**

- Bound the Player's contribution to page height by its 16:9 box on WebKit for iOS,
  without changing what the learner sees on any other engine.
- Give every browser one enlarge affordance that does not consult the Fullscreen API.
- Keep the player element and its subtree identical across the transition, so playback,
  the resume overlay, and the position writes are untouched.
- Stay inside this project's files: no fork of Vidstack, no patch of its stylesheet.

**Non-Goals:**

- Native iOS fullscreen (would mean surrendering to YouTube's chrome on iPhone).
- Orientation locking.
- Any change to provider selection, position persistence, or completion tracking.

## Decisions

### 1. Take the embed iframe out of flow rather than shrinking it

`lesson-video-player.css` already exists to map Vidstack onto this project's tokens; the
override lands there, scoped to the embed iframe the trick applies to:

```css
[data-media-provider] iframe.vds-youtube {
  position: absolute;
  top: 0;
  left: 0;
}

[data-media-provider] iframe.vds-youtube[data-no-controls] {
  top: -450%; /* -450% + 1000%/2 = 50% */
}
```

`[data-media-provider]` is already `position: relative` in Vidstack's theme, so it is the
containing block. Out of flow, the iframe no longer contributes to any ancestor's height,
and the offset reproduces the vertical centring that `align-items: center` gave it — so
the same middle band of the embed stays visible and YouTube's chrome stays outside the
frame. The 1000% height is untouched: this tells the browser where the oversized element
lives, not how big it is.

**Both offsets are percentages of the provider, and there is no transform.** The first
version centred with `top: 50%` + `translateY(-50%)` and had to be replaced: a transform
percentage resolves against the element's *own used height*, and WebKit for iOS sizes an
iframe from its content rather than from its CSS height. The two agree until the embed
re-lays itself out — after a resume seek, say — and then the visible band slides off the
video and YouTube's own chrome drifts into frame. It shipped to a real iPhone before that
surfaced. Percentages of the containing block cannot drift that way, and the second rule
is scoped to `[data-no-controls]` because without it the frame is only 100% tall and
belongs at `top: 0`.

Measured on iOS 26.5 with this geometry: wrapper **224px**, player 216px.

*Alternatives considered.* Dropping the trick (`height: 100%`) also measured 224px on
iOS, but it puts YouTube's own chrome back inside the frame, which contradicts the
`lesson-page` scenario "A YouTube lecture's controls are the app's, localized the same
way". Patching Vidstack's stylesheet or pinning a fork was rejected as unmaintainable for
a three-line override.

### 2. Add a fallback control beside the library's, gated on the capability

`DefaultVideoLayout` accepts `slots`, and `fullscreenButton` is one of the documented
slot names (`DefaultLayoutSlotName` in `@vidstack/react`), so any name may be prefixed
`before` or `after`. The fallback goes in **`afterFullscreenButton`**, which leaves the
library's own button in place:

```tsx
<DefaultVideoLayout slots={{ afterFullscreenButton: <VideoEnlargeButton … /> }} … />
```

Replacing the slot instead would take the browser's fullscreen away from every browser
that has it. Sitting after it costs nothing, because exactly one of the two ever paints:
the library's button hides itself through `.media-button:not([data-supported])` wherever
the Fullscreen API reports no support, and the fallback renders `null` wherever it does.

**The gate is the capability, not the platform.** `useMediaState("canFullscreen")` is
Vidstack's own answer to "can this player go fullscreen", resolved from the provider that
actually loaded. Sniffing iOS would be wrong in both directions: a self-hosted `<video>`
lesson on an iPhone *can* use `webkitEnterFullscreen` and would be robbed of it, and any
engine that drops element fullscreen later would need a code change to be served. The
condition is also read from inside the player, so the button needs no ref plumbing — it
is rendered within `<MediaPlayer>` by construction, being a layout slot.

*Alternatives considered.* Rendering the button as a `children` overlay (the slot the
resume overlay uses) would float it over the video instead of seating it in the control
bar, and would have to re-solve hiding it while the controls are hidden. Keeping the
library button and forcing `data-supported` with CSS was rejected: the attribute reports
a real capability, and overriding it would leave the button wired to an API that throws.

### 3. Pseudo-fullscreen is a class on the existing player element, not a portal

While enlarged, the player element itself is pinned to the viewport at a z-index above
the page, behind a black backdrop, and the element is never moved in the tree.

**The enlarged box stays 16:9**, which is not a stylistic choice. The 1000% trick means
the embed lays its video out against the iframe's *width* and centres it, and the player
shows only the middle band; the video is fully visible exactly when that band is
`width × 9/16` tall. Stretch the player to a landscape viewport and the band becomes
shorter than the video, which crops it top and bottom — the very thing the spec forbids.
So the enlarged player is the largest 16:9 box that fits the viewport
(`fixed inset-0 m-auto w-dvw max-w-[calc(100dvh*16/9)]`, keeping `aspect-video`),
centred by `inset: 0` + `margin: auto`, with the backdrop filling what it does not.

This is the decision that protects everything built on top of the player. Portalling the
player into a new container would unmount and remount the `<iframe>`, which reloads the
YouTube embed, resets `currentTime`, and would fire the position-persistence hooks with a
cold `0`. Toggling a class costs none of that.

### 4. The mode's state, its `Escape` key, and the scroll lock live in one hook

`useEnlargedVideo` owns the boolean, the `Escape` listener, and the `document.body`
scroll lock, and returns `{ isEnlarged, toggle, exit }`. `LessonVideoPlayer` stays
composition, the way `PlaybackPositionedVideoPlayer` is: the rule about how the mode
behaves is testable without rendering a media player.

`Escape` is handled by the hook rather than by Vidstack's own keyboard shortcuts, which
are already suppressed through `keyDisabled` whenever an overlay owns the keyboard.

### 5. Copy lives under `Components.VideoPlayer`

The player's translations already sit in that namespace and reach the layout through
`buildVideoPlayerTranslations`. **No new keys were needed**: `enter-fullscreen` and
`exit-fullscreen` are already there and already translated for `en`, `es` and `pt`,
because Vidstack's own button uses the same two words. Reusing them keeps one name for
the action across the app and leaves no locale rendering a raw key.

## Risks / Trade-offs

- **Pseudo-fullscreen in portrait is a letterbox, not a filled screen.** → It is a real
  limitation of not owning the system player. Rotating the phone fills the viewport, and
  the alternative (YouTube's chrome) costs the app's own controls and localization. The
  user chose this trade explicitly.
- **`transform` on the iframe creates a containing block for its descendants.** → The
  iframe has no positioned descendants in this document; its content is a separate
  browsing context. Nothing in the player subtree positions against the iframe.
- **A future Vidstack release could change `iframe.vds-youtube[data-no-controls]`.** →
  The selector is pinned to a behavior we assert in a test that reads computed style, so
  a rename surfaces as a failing test rather than as a silent return of the black slab.
  `@vidstack/react` is already pinned to an exact version (`1.15.6`).
- **The iOS layout bug itself is not reproducible in any automatable browser here.** →
  See the testing strategy: the automated guard asserts the *mechanism* (the iframe is
  out of flow), which is engine-independent, and the *symptom* is verified by hand on the
  iOS Simulator, where it has already been reproduced and measured.
- **Two enlarge affordances now exist, and a bug in the gate would show both or
  neither.** → They are mutually exclusive by construction rather than by a shared
  condition: the library's button hides on `:not([data-supported])`, the fallback returns
  `null` on `canFullscreen`. Both branches are asserted in the e2e spec, which happens to
  run engines on either side of the split — chromium and firefox report fullscreen
  support, Playwright's WebKit exposes no Fullscreen API at all.
- **`canFullscreen` is false before the provider finishes loading**, so the fallback
  could appear for a moment on a browser that will turn out to support fullscreen. → The
  layout renders no controls at all until the player can play, which is after the
  provider is set up, so there is no window in which the wrong button is on screen.

## Testing strategy

| Behavior                                                        | Layer                                | Where                                                                        |
| --------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| Control's accessible name is localized and announces its state   | Vitest + RTL                         | `video-enlarge-button.test.tsx`                                               |
| Toggle, `Escape` exit, body scroll lock, cleanup on unmount      | Vitest (hook, no DOM player)         | `use-enlarged-video.test.ts`                                                  |
| The collapsed player is a full-width 16:9 box                    | Vitest + RTL                         | `lesson-video-player.test.tsx`                                                |
| Enlarge control renders in the chrome and is operable            | Playwright (chromium + webkit)       | `e2e/lesson-video-player.spec.ts`                                             |
| Enlarging pins the player and does not remount its subtree       | Playwright (element identity)        | same spec                                                                     |
| The embed iframe is out of the layout flow                       | Playwright (webkit + chromium)       | same spec                                                                     |
| The wrapper is no taller than the player's 16:9 box              | Playwright (webkit, Mobile Safari)   | same spec                                                                     |
| The iOS-specific symptom is gone                                 | Manual, iOS 26.5 Simulator           | recorded in the change's verification notes                                   |

**Found while implementing:** the enlarge control cannot be asserted through
`LessonVideoPlayer` at the RTL layer. The Default Layout renders **no controls at all**
under jsdom — the player defers loading behind an `IntersectionObserver` that never
fires, so `.vds-video-layout` renders empty and the `fullscreenButton` slot never
mounts. The rows for "control renders in the chrome" and "does not remount the subtree"
therefore moved from Vitest to Playwright, which is the same boundary the existing file's
docstring already draws for playback. The button's own behavior is fully covered at RTL
in its own file, where it is rendered directly.

Patterns to mirror: `lesson-video-resume-overlay.test.tsx` for RTL over a Vidstack
subtree, `use-resume-on-first-play` for a hook test that drives a fake player, and the
existing `e2e/` specs for the Playwright setup. Storybook gets a `LessonView/` story per
`storybook-story-writing`, with an enlarged-state story.

The Playwright assertion is written against **computed style**
(`getComputedStyle(iframe).position === "absolute"`), not against the CSS source text, so
it fails if the rule stops applying for any reason — a selector rename, a specificity
change, a stylesheet that stops loading — rather than only if someone edits that line.

Per the project's TDD rule each of these is written red first; the Playwright out-of-flow
assertion fails today, because the iframe is `position: static`.
