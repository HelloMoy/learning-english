## Context

The Player's gesture set lives in
`src/components/lesson-view/lesson-video-player/playback-gestures.tsx` as four Vidstack
`<Gesture>` children of `<MediaPlayer>`, the Default Layout's own set switched off: a
`pointerup → toggle:paused` over the whole box, a `dblpointerup → toggle:fullscreen` over
the whole box, and two `dblpointerup` seek gestures over the outer fifths whose taps are
handed to `useSeekRun`. The archived changes `tap-toggles-playback-on-touch` and
`double-tap-seek-feedback` record why.

What the library gives us, and what it does not (`@vidstack/react` 1.15.6):

- `Gesture` knows `pointerup`, `dblpointerup` and the provider's media events. **It has
  no press-and-hold event.** A hold has to be timed by this app.
- Every gesture listens on the **provider** element (`touchend` for a coarse pointer,
  `pointerup` otherwise) and fires its non-`dbl` action 250 ms after a press that stays
  alone. `disabled` detaches the listeners without touching the press counter — which is
  how a seek run already keeps the third tap from pausing the video.
- `remote.changePlaybackRate(rate)` dispatches `media-rate-change-request`; the rate in
  force is `player.state.playbackRate`, and `player.state.canSetPlaybackRate` says
  whether the provider will honour a change at all. `MediaRemoteControl` queues every
  request behind `canPlayQueue`, so under jsdom **no rate request is ever dispatched** —
  the same constraint the seek tests met by mocking `useMediaRemote`.
- The YouTube provider does honour a rate change (the library documents Vimeo, not
  YouTube, as the embed that cannot); `canSetPlaybackRate` is the guard either way.

Touch facts that shape the gesture: the provider and the blocker carry
`touch-action: manipulation`; a pan over the player ends in `pointercancel` rather than
`pointerup`; and iOS Safari answers a long press on an element with the callout menu and
a selection unless `-webkit-touch-callout` and `user-select` say otherwise.

One constraint is this app's own: enlarged, the Player deliberately **never locks the
page's scroll**, because on an iPhone only a real swipe travelling through the pinned
player hides Safari's toolbar. So a finger resting on the video on its way to a swipe is
a real, frequent event, and it must not be read as a hold.

The YouTube app's convention the learner already knows: press anywhere on the video,
after about half a second a "2×" pill appears and the video runs at double speed, and
lifting the finger restores the speed and does **not** pause the video.

## Goals / Non-Goals

**Goals:**

- A press held past a short threshold runs the video at 2× until the press ends, and the
  rate the learner had before the press comes back when it does.
- The press that became a hold never also toggles playback.
- A finger that is on its way to a swipe, a press while a seek run is in flight, and a
  press on a paused video all leave playback alone.
- The rate reaches the player and the indicator's label from one named constant.
- Vidstack's gesture guards keep protecting the taps; none of its press logic is
  reimplemented.

**Non-Goals:**

- Sliding while holding to pick a rate, a slow-down gesture, a persisted speed setting,
  any key but the play/pause one — all named in the proposal's Non-goals.
- Hiding the control bar during the hold, or YouTube's exact pill artwork.
- Teaching the seek run about the hold beyond "a run blocks one".

## Decisions

### 1. The hold is timed by this app, on the player element, not by a `<Gesture>`

`Gesture` has no hold event and no way to express one, so `useSpeedHold` attaches
`pointerdown` / `pointermove` / `pointerup` / `pointercancel` / `contextmenu` listeners to
the **player element**, the same node `useRunTaps` already listens on. A `pointerdown`
that passes the guards starts a timer; when the timer fires the hold is **armed** and the
rate changes; any of `pointerup`, `pointercancel` or a `pointerdown` from a second pointer
ends it and restores the rate.

The guards on `pointerdown` mirror the ones `useRunTaps` already applies, for the same
reason — an overlay that takes the pointer must keep it:

- primary button only, and the target inside `[data-media-provider]`, so the control bar,
  the resume overlay and the scroll hint's dismiss control are untouched;
- the video is playing (`!player.state.paused`), so a hold never starts playback;
- `player.state.canSetPlaybackRate`, so a provider that cannot change rate shows no
  indicator it cannot honour;
- no seek run is active.

Before the timer fires, a `pointermove` past a small threshold cancels the arming: that is
the swipe-to-hide-the-toolbar case, and it is the one guard Vidstack would have given us
for free had this been a `Gesture`. After the timer fires, movement is ignored — the
finger is deliberately down — and the browser's own `pointercancel` ends the hold when it
takes the touch over for a scroll.

*Alternatives considered.* A `pointerup` `Gesture` with an `onWillTrigger` that measures
the elapsed time: the rate would change only when the finger **lifts**, which is the
opposite of the gesture. Listening on the provider element instead of the player: it is
the same events, but two hooks on two different nodes for one gesture set, and
`useRunTaps` already set the precedent.

### 2. The single tap stands down by being `disabled` while the hold is armed, not by `preventDefault`

While the hold is armed every `<Gesture>` receives `disabled`, exactly as during a seek
run. The `pointerup` (or `touchend`) that ends the hold therefore lands while the
library's listeners are detached, so no press is counted and nothing toggles; the
gestures come back on the next render with their counters untouched.

*Alternative considered.* Keeping `toggle:paused` enabled and cancelling it from
`onWillTrigger` when a hold had just ended. That needs a "a hold ended within the last
250 ms" flag read from a native handler, and it leaves the `dblpointerup` gestures
counting the press — a hold followed by a quick tap would pair into a double tap and
seek. Disabling is the mechanism this file already uses for the same problem.

### 3. A seek run wins; a hold blocks nothing

A hold does not start while a run is active (guard above), and while a hold is armed the
run's own `pointerup` listener is not attached — `useRunTaps` only attaches while a run
is active, and a run cannot start during a hold because the gestures are disabled. The two
states are mutually exclusive by construction, and neither needs to know the other's
internals beyond the one boolean the helper already holds.

### 4. The rate to restore is read at arm time, not assumed to be 1

`useSpeedHold` captures `player.state.playbackRate` when it arms and restores that value
when the hold ends. The layout's own speed menu can leave the learner at 1.5×, and a hold
that snapped them back to 1× would be a bug the learner cannot undo without reopening the
menu.

The hold sets the rate to `HOLD_PLAYBACK_RATE` (2) absolutely rather than multiplying the
captured rate: "hold for double speed" is the promise, and a learner already at 2× has no
use for 4×.

### 5. The constants live with the hook; there is no `lib/` module for them

`src/hooks/use-speed-hold/use-speed-hold.ts` exports `HOLD_PLAYBACK_RATE` and
`HOLD_ARM_DELAY_MS` alongside the hook, and both the gesture helper and the indicator read
the rate from there. The seek gesture's precedent — a pure `src/lib/seek-run/` module —
exists because that feature has real arithmetic to test in isolation (anchors, step
counts, turn-arounds). A hold has none: two constants and a timer. A `lib/speed-hold/`
holding only numbers would be a folder invented to match a shape, not a unit worth its
own test.

### 5b. The pointer guard becomes a shared lib, because it is now in two places

`PlaybackGestures` already had a private `isPrimaryTapOnTheVideo` — primary button, target
inside `[data-media-provider]` — and the hold needs the same question answered for a
press. Rather than copy three lines, it moves to `src/lib/video-pointer/video-pointer.ts`
as `isPrimaryPointerOnTheVideo`, with its own test, and both callers import it. The
direction is right: a component and a hook may both depend on a lib, and neither on the
other.

### 6. `SpeedFeedback` is a lesson-view component alongside `SeekFeedback`

`src/components/lesson-view/speed-feedback/speed-feedback.tsx` takes the `rate` and draws
the indicator: a pill near the top-centre of the player box, `pointer-events-none`, at the
same `z-10` as `SeekFeedback` so both sit under the resume overlay and the hint. The label
is the rate followed by a chevron pair pointing forward — `ChevronsRight` from lucide, the
direction in the glyph, per the lesson `ScrollDownHint` records.

Copy lives under `Components.SpeedFeedback` in `en`, `es` and `pt`, with the rate passed
as an ICU number argument so the locale renders its own digit and decimal mark rather than
a string this app formatted. `role="status"` with a worded sentence for assistive
technology and the visible label `aria-hidden`, the arrangement `SeekFeedback` already
uses so the rate is not read twice. Stories: the indicator over a 16:9 black box, and the
Spanish and Portuguese locales.

### 7. The key hold is taken from the library in the capture phase

Vidstack binds `Space` and `K` to `togglePaused` and acts on **keydown**, so a learner
who held the key would have the lesson paused half a second before the hold could arm.
The key has to be taken over.

**The library's own extension point was tried first and does not hold.** A `keyShortcuts`
entry may be an object rather than a key list, and the controller then calls the object's
handler and performs none of its own action — exactly what this needs, with every guard
left to the library. Measured in the browser, it never runs: the chrome's play button
registers the same shortcut through `aria-keyshortcuts`, and the controller merges those
ARIA keys **over** the table as a plain key list, which no longer carries a handler. The
library toggles playback and stops the event on the player element, so nothing downstream
sees the key at all.

What is left is to intercept before the player's own listener, and the only place earlier
than a listener on the player element is the **document, capturing**. `useSpeedHold`
listens there, cancels the key and stops it, and the library never sees it — so it cannot
toggle twice either. The guards that came free with the table are then this hook's, and
they are the small, stable half of what the library checks: the key list, no modifier, the
focus inside the player, and no focused control — a button, link or text field — that owns
the key for itself. `Space` must still activate a focused button.

The keys are spelled in the hook rather than read from the library, so the hook stays free
of it; a test in `lesson-video-player.test.tsx` pins them to the player's own
`MEDIA_KEY_SHORTCUTS.togglePaused`, so the two cannot drift apart unnoticed.

**A short press still toggles playback**, because the library no longer will: the hook
reports a key press that ended before it armed, and the caller — which has the remote —
toggles. A key repeat is cancelled like the first press but starts no second one; without
that, the platform's own repeat would either reach the library or end the hold it just
started.

### 8. iOS's long-press furniture is suppressed on the provider, in the player's stylesheet

`lesson-video-player.css` gains `-webkit-touch-callout: none` and `user-select: none` on
the provider and the blocker, and `useSpeedHold` calls `preventDefault()` on `contextmenu`
while a press is in flight. Without both, a half-second press on iOS Safari raises the
callout sheet and a desktop press raises the context menu — over the very indicator the
gesture just drew.

## Risks / Trade-offs

- **A slow, deliberate tap (past the threshold) speeds the video up instead of pausing
  it.** → That is the gesture, and the threshold is YouTube's own; the indicator appears
  the moment it arms, so the learner sees what happened and lifting undoes it.
- **A finger resting on the video before a swipe could arm the hold.** → The movement
  guard cancels the arming, and `pointercancel` ends an armed hold the moment the browser
  claims the touch for the scroll. Verified by hand on the iOS Simulator, which is where
  the toolbar-hiding swipe can actually be performed.
- **`disabled` must reach the gestures before the press ends.** → It is set from the
  timer's callback, hundreds of milliseconds before the finger lifts in every real case;
  the seek run's tighter version of the same race already holds.
- **A provider that reports `canSetPlaybackRate` and then ignores the request leaves the
  indicator lying.** → The indicator is driven by the request, not by a `rate-change`
  event, so a silent provider would show 2× at 1×. Accepted: the state is the library's
  own gate, and the alternative — waiting for `rate-change` — shows nothing at all for the
  embed's round trip, which is the common case.
- **jsdom dispatches no rate request.** → Component tests mock `useMediaRemote`, as the
  seek tests do; the browser proves the video really speeds up.
- **A second finger during a hold ends it.** → Simpler than tracking pointer ids, and a
  pinch on the player is not a gesture this Player offers.
- **The indicator can overlap the layout's title row.** → It is `pointer-events-none` and
  the title row auto-hides with the chrome; a learner mid-hold is not reading the title.

## Testing strategy

| Behavior                                                                                             | Layer                         | Where / pattern mirrored                                                                                                  |
| ---------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Hold lifetime: arms after the delay, ends on up / cancel, movement before arming cancels, unmount clears the timer | Vitest + RTL `renderHook`     | `src/hooks/use-speed-hold/use-speed-hold.test.ts` with `vi.useFakeTimers()`, mirroring `use-seek-run.test.ts`             |
| Key hold: arms on the key event, ends on `keyup`, a repeat is not a second press, a short press reports a tap | Vitest + RTL `renderHook`     | same file, a describe of its own                                                                                          |
| The key's guards: the key list is the player's own, a modifier or another key is left alone, a focused control keeps the key, focus outside the player is ignored | Vitest + RTL                  | `use-speed-hold.test.ts`, and the key-list guard in `lesson-video-player.test.tsx`                                        |
| Indicator: the rate in the label, the forward glyph, the worded sr text, `role="status"`             | Vitest + RTL                  | `speed-feedback.test.tsx`, mirroring `seek-feedback.test.tsx`                                                              |
| Arming changes the rate to 2× and restores the captured rate on release                              | Vitest + RTL                  | `lesson-video-player.test.tsx`, a new describe beside the seek-run one; `useMediaRemote` mocked, `changePlaybackRate` asserted |
| A press that armed does not toggle playback when it ends; a short press still does                   | Vitest + RTL                  | same file; the gestures' `disabled` observed the way the run tests observe it — the absence of the play request           |
| No hold while paused, while a run is active, or when `canSetPlaybackRate` is false                   | Vitest + RTL                  | same file, player state stubbed per case                                                                                  |
| Copy exists for every locale under `Components.SpeedFeedback`                                        | Vitest                        | `src/messages/messages.test.ts`, which already walks the locale files                                                     |
| The video really runs faster: hold on the video → rate 2 and the pill; release → rate back and still playing | Playwright (chromium)         | `e2e/lesson-video-player.spec.ts`, desktop describe; `page.mouse.down()` / `up()` around a wait, rate read from the media element |
| The same on a phone, and a swipe through the player still scrolls instead of speeding up             | Playwright (webkit, `IPHONE`) | same file, "GIVEN Safari on an iPhone"; the press dispatched as pointer events on the provider, since `touchscreen` offers only `tap` |
| Feel on the device: the callout never appears, the threshold is comfortable, a swipe never arms      | Manual, iOS Simulator         | recorded in the change's `verification.md`, as `double-tap-seek-feedback` did                                             |

Each test is written red first. The first red is `use-speed-hold`'s "arms after the
delay"; the first red in the player is the rate change, which today has no gesture to
produce it.
