## Context

The lesson player (`lesson-video-player.tsx`) renders its own four Vidstack `<Gesture>`
elements as direct children of `<MediaPlayer>`, with the Default Layout's set switched
off — see the archived change `tap-toggles-playback-on-touch`: `pointerup →
toggle:paused` over the whole box, `dblpointerup → toggle:fullscreen` over the whole box,
and `dblpointerup → seek:-10` / `seek:10` over the outer fifths, geometry supplied by
`lesson-video-player.css`.

What Vidstack's `Gesture` does with presses (`@vidstack/react` 1.15.6, `Gesture#acceptEvent`):

- Every gesture listens on the **provider** element (`touchend` for a coarse pointer,
  `pointerup` otherwise), applies its guards — pointer button, an open menu, a touch that
  scrolled more than 10px, a pinch, its own bounds — then counts presses.
- A non-`dbl` gesture fires 250 ms after a press if it is still the only one. A `dbl`
  gesture fires on the second press within 275 ms — and then **resets the counter to
  zero**. The third press is a first press again: the `toggle:paused` gesture fires
  250 ms later. That is the pause the proposal describes.
- Before acting, a gesture dispatches a cancelable `will-trigger` event on its element
  (`onWillTrigger` in React); `preventDefault()` skips the action. It also has a
  `disabled` prop; disabling detaches its listeners without touching its counter.
- The seek action is `remote.seek(currentTime + n)`. The controller's
  `media-seek-request` handler bounds the time to the seekable range (`boundTime`)
  before handing it to the provider, so a caller need not clamp.
- `MediaRemoteControl` enqueues every request behind the player's `canPlayQueue`. Under
  jsdom the player never reaches `can-play`, so **no seek request is ever dispatched in a
  component test**; a test that wants to see a seek must mock `useMediaRemote`.

Touch specifics that matter here: Vidstack's blocker and provider frame carry
`touch-action: manipulation`, which is what already stops iOS Safari from zooming on the
existing double taps. A pan over the player ends in `pointercancel`, not `pointerup`.

The YouTube app's convention, which the learner's thumbs already know: a double tap on
a side seeks, every further tap on that side adds a step, the label counts up, a tap on
the other side restarts the count the other way, and the artwork fades about two thirds
of a second after the last tap.

## Goals / Non-Goals

**Goals:**

- The learner sees what a double tap did, and can keep tapping to seek further, with
  the label counting the run.
- Every seek in a run is computed from the run's anchor, never from a possibly stale
  `currentTime`.
- The single tap, the middle double tap, the resume overlay, the control bar and the
  scroll hint keep their behaviour outside a run.
- The ten seconds live in one named constant.
- Vidstack's gesture guards keep protecting the first double tap; nothing of the
  library's press logic is reimplemented.

**Non-Goals:**

- Owning the whole tap state machine (single tap, fullscreen) — that would mean copying
  the scroll, pinch, menu and touch-versus-pointer guards out of the library.
- Hiding the control bar during a run, YouTube's exact artwork, or a settings entry for
  the interval.

## Decisions

### 1. Vidstack's `Gesture` stays the double-tap detector; the seek gestures hand the tap to the run

The two seek gestures keep their `dblpointerup` events and their `seek:±N` actions (the
`N` now read from the constant), and get an `onWillTrigger` handler that calls
`event.preventDefault()` and starts the run instead. So the *detection* of the first
double tap — guards and all — is the library's, and the *seek* is ours, computed from
the anchor like every later one. One code path performs every seek in a run.

*Alternatives considered.* Owning a tap detector on the provider for everything: needs
the library's guards rewritten, and `activeMenu` is not public state. Observing
`media-seek-request` to infer a gesture seek: it cannot tell a gesture from the seek
buttons, and taps would still pair up. Rendering `pointerup → seek:±N` gestures only
during a run: every accumulated tap would land 250 ms late, because a non-`dbl`
gesture always waits to rule out a double.

### 2. All four gestures are `disabled` while a run is active, and a listener on the player owns the run's taps

The run is React state in the gesture helper. While it is non-null every `<Gesture>`
receives `disabled`, so the library counts nothing and acts on nothing; when the run
lapses they re-enable with their counters untouched. During the run a single `pointerup`
listener on the player element handles taps:

- It ignores events whose target is not inside `[data-media-provider]`, which is the
  same filter the library's gestures get by listening on the provider — the control
  bar, the resume overlay and the hint's dismiss button take their own pointer.
- It ignores any button but the primary.
- It decides the side by hit-testing the event's coordinates against the **seek gesture
  elements' own boxes** (via refs to the `GestureInstance`s). The stylesheet stays the
  single source of the 20 % geometry; no fraction is repeated in TypeScript.
- A hit on an edge seeks and extends the run; a hit elsewhere is absorbed.

Pointer events, not touch events, are enough here: a pan ends in `pointercancel` so no
movement guard is needed, and double-tap zoom is already suppressed by the library's
`touch-action`. The `MEDIA_GESTURE` flag Vidstack sets on its own events is internal and
is not set; the only effect is that the control bar may show for its idle delay on a
run tap, which the scrubber's jump makes a feature rather than a defect.

*Alternative considered.* Leaving the seek gestures enabled and only disabling
`toggle:paused`: the third and fourth taps would then form another `dbl` pair and seek
once for two taps, and the fullscreen gesture would count them too.

### 3. Seek targets are anchored; the arithmetic is a pure lib

`src/lib/seek-run/seek-run.ts` exports `SEEK_STEP_SECONDS`, `SEEK_RUN_WINDOW_MS`, the
`SeekDirection` and `SeekRun` types (`{ direction, steps, anchorTime }`), and pure
functions: `startSeekRun(direction, anchorTime)`, `extendSeekRun(run, direction)` — same
direction adds a step, the other direction starts a run anchored at the replaced run's
target — `seekRunTarget(run)` (`anchor ± steps × step`) and `seekRunSeconds(run)`
(`steps × step`, the label). No clamping: the controller bounds the time, and the label
counts requests, as YouTube's does.

*Alternative considered.* `currentTime ± step` on every tap, as the library's action
does. The YouTube provider applies a seek asynchronously, so two quick taps read the
same `currentTime` and the second step is lost — the "pending seek" scenario.

### 4. `useSeekRun` owns the run's lifetime

`src/hooks/use-seek-run/use-seek-run.ts` keeps the run in state and a lapse timer of
`SEEK_RUN_WINDOW_MS` (700 ms) that every tap restarts and that clears the run when it
fires; unmounting clears the timer. It exposes `{ run, tap(direction, currentTime) }`:
`tap` starts or extends the run and returns the target time, and the caller seeks. One
entry point, so the helper never touches the arithmetic. `currentTime` is read from
`useMediaPlayer()?.state.currentTime` at the moment of the tap — a peek, not a
subscription, so the helper does not re-render on every time update.

### 5. `SeekFeedback` is a reusable lesson-view component

`src/components/lesson-view/seek-feedback/seek-feedback.tsx` takes `direction` and
`seconds` and draws the indicator: absolutely positioned over the tapped half of the
player box, `pointer-events-none`, below the resume overlay and the hint (`z-10` against
their `z-20`), a translucent half-disc rounded on its inner side, three chevrons and the
label. The chevrons are lucide's `ChevronsLeft` / `ChevronsRight` chosen by `direction`
— the direction is in the glyph, per the lesson `ScrollDownHint` records in its JSDoc.
The pulse is a keyframe declared under `@theme` in `globals.css` next to `arrow-drop`,
applied with staggered delays and dropped under `motion-reduce`; the entrance uses the
`tw-animate-css` utilities the hint already uses.

Copy lives under `Components.SeekFeedback` in `en`, `es` and `pt`: `seconds` (ICU
plural, the visible label, `aria-hidden`) and `forward` / `backward` (sr-only sentence
with the direction). The element is `role="status"`, the precedent `ScrollDownHint` set
for a conditionally rendered in-player message. Stories: forward, backward, an
accumulated count, and the Spanish and Portuguese locales; the story wraps the
component in a 16:9 black box so the half-disc has a frame to sit in.

### 6. The gesture helper moves to its own file in the player's folder

`PlaybackGestures` grows state, a hook, refs and an effect, past what a private helper
in the player file should carry. It moves to
`src/components/lesson-view/lesson-video-player/playback-gestures.tsx`, the same
arrangement `video-player-translations.ts` already has in that folder: a file that
serves exactly one component and is not exported for reuse, so it takes no folder of its
own. The player file keeps the paragraph that explains why the layout's gestures are
replaced and points at the helper for the run.

## Risks / Trade-offs

- **A slow second tap (250–275 ms after the first) toggles playback instead of seeking.**
  → Unchanged from today; it is the library's window and both of its timers agree on it.
- **`disabled` must reach the gestures before the third tap.** → The run is set from the
  `will-trigger` handler, a native listener; React flushes that update in a microtask,
  and a third tap is tens of milliseconds away at the fastest.
- **A tap in the middle during a run does nothing for up to 700 ms.** → YouTube's own
  behaviour; the window is short and the next tap acts. Stated in the spec.
- **The run listener does not check for an open menu.** → The library's gestures do, and
  a run can only start through them; a menu opened *during* a 700 ms run is not a real
  path.
- **The run listener uses `pointerup` where the library uses `touchend` on touch.** → Pans
  cancel pointers, zoom is suppressed by `touch-action`; verified by hand on the iOS
  Simulator, which is also where `pointerup` on the blocker is confirmed to fire.
- **jsdom cannot observe seeks.** → Component tests mock `useMediaRemote` (only that
  export; the rest of the library stays real) and assert `seek` calls; the browser
  proves the time really moves.
- **The indicator can overlap the control bar's row.** → It is `pointer-events-none` and
  sits under the layout's controls; a learner mid-run is not using the bar.
- **A `role="status"` inserted on demand may not be announced by every reader.** → Same
  trade-off `ScrollDownHint` accepted; the seek is also reflected by the slider's own
  value text.

## Testing strategy

| Behavior                                                                                   | Layer                          | Where / pattern mirrored                                                                                                  |
| ------------------------------------------------------------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Run arithmetic: start, same-side extend, opposite-side re-anchor, target, label seconds    | Vitest unit                    | `src/lib/seek-run/seek-run.test.ts`, faker for anchors and step counts, like `format-duration.test.ts`                    |
| The run lapses after the window, every tap restarts it, unmount clears it                  | Vitest + RTL `renderHook`      | `src/hooks/use-seek-run/use-seek-run.test.ts` with `vi.useFakeTimers()`, like `use-browser-chrome-visible.test.ts`       |
| Indicator: label per seconds and plural, glyph per direction, sr text, `role="status"`     | Vitest + RTL                   | `seek-feedback.test.tsx`; `useTranslations` mocked to echo keys and values, like `scroll-down-hint.test.tsx`             |
| Actions read the constant; no indicator before a run                                       | Vitest + RTL                   | `lesson-video-player.test.tsx`, existing "GIVEN a learner who taps the video" describe                                   |
| Double tap seeks to anchor+step, shows the indicator, disables the gestures                 | Vitest + RTL                   | same file; dispatch a cancelable `will-trigger` on the seek gesture element, assert the mocked `remote.seek` and the label |
| Run taps: same side +step, opposite side re-anchors, middle absorbed, lapse re-enables      | Vitest + RTL                   | same file; `getBoundingClientRect` stubbed on the seek gesture elements, `fireEvent.pointerUp` on the provider, fake timers |
| The video really moves: double tap → 0:10 and indicator; third tap → 0:20; middle tap does not pause; after the window a tap pauses | Playwright (webkit, `IPHONE`) | `e2e/lesson-video-player.spec.ts`, "GIVEN Safari on an iPhone"; time read from the layout's current-time readout         |
| Double click on a mouse seeks and shows the indicator                                      | Playwright (chromium)          | same file, desktop describe                                                                                               |
| Feel on the device: pulse, fade, thumbs at a natural pace, zoom does not trigger           | Manual, iOS Simulator          | recorded in the change's `verification.md`                                                                               |

Each test is written red first. The first red is the lib test for `extendSeekRun`; the
first red in the player is the `will-trigger` test, which today lets the library seek
and shows no label.
