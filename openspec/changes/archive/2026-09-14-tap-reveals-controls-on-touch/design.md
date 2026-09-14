## Context

`PlaybackGestures` renders the lesson Player's own gesture set, with `noGestures` on the
Default Layout. Its single-tap gesture is `event="pointerup" action="toggle:paused"`, on
every pointer type, and the player's JSDoc, the spec, and the e2e suite all say so on
purpose: PR #39 put it there because Safari on iPhone paints the YouTube embed's centre
play/pause icon through the chrome, and the provider's blocker keeps every tap from
reaching it. Before that, the tap only revealed the control bar and the icon read as a
dead control.

Vidstack's own Default Layout renders **both** gestures — `toggle:paused` and
`toggle:controls` — and lets two `@media (pointer: …)` rules in `video.css` decide which
one hit-tests. That is the behaviour this change restores for touch, but not the
mechanism: `video.css` scopes those rules to `.vds-video-layout .vds-gesture`, and this
Player's gestures are direct children of `<MediaPlayer>`, outside the layout.

The trap PR #39 answered is still real, so the change pairs the new tap meaning with a
centre play/pause control of the Player's own. The library's compact chrome (`data-sm`,
below 576px) already draws one at 45px; the full chrome draws none, which is exactly the
enlarged-landscape case the bug was reported on.

Relevant library surface, checked against `@vidstack/react@1.15.6`:

- `GestureAction` includes `` `toggle:${'paused' | 'muted' | 'fullscreen' | 'controls'}` ``.
- `useMediaState("pointer")` reports `'fine' | 'coarse'`; the player also mirrors it as
  `data-pointer`.
- `useMediaState("controlsVisible")` reports whether the control bar is showing.
- `useMediaState("width")` is the player's own width — the value `smallLayoutWhen`
  already receives.
- `<PlayButton>` is exported from `@vidstack/react`, and `defaultLayoutIcons.PlayButton`
  carries the same glyphs the control bar uses.

## Goals / Non-Goals

**Goals:**

- A tap on touch reveals the control bar when hidden and hides it when visible; it never
  toggles playback.
- A click with a mouse keeps toggling playback, unchanged.
- A centre play/pause control of the Player's own, drawn over the frame whenever the
  controls are visible on touch — including the full chrome, where the layout draws none
  — so the leaked YouTube icon is backed by a control that acts.
- Exactly one centre control on screen: never two in the compact chrome.
- The double tap (fullscreen), the edge double tap and its seek run, and the speed hold
  keep every rule they have today.

**Non-Goals:**

- Touching the auto-hide delay, the control bar's contents, or its appearance.
- Reaching, hiding or restyling the YouTube embed's own icon.
- Any change to keyboard behaviour: the play/pause key still toggles playback on a short
  press and still arms the speed hold when held.

## Decisions

### D1 — The pointer type is read in React, not asserted in CSS

`PlaybackGestures` reads `useMediaState("pointer")` and renders **one** tap gesture whose
action is `toggle:controls` on `'coarse'` and `toggle:paused` on `'fine'`.

_Alternative considered:_ copy the library's mechanism — render both gestures and add the
two `@media (pointer: …)` rules to `lesson-video-player.css`. Rejected for two reasons.
First, a gesture's meaning would then live in a stylesheet: if the CSS is missing or
stale — a failure mode this project has hit, where Turbopack served a stale `globals.css`
while the JS had already hot-reloaded — **both** gestures hit-test and a single tap both
pauses the lesson and toggles the bar. Second, jsdom resolves no media queries, so the
branch would be unobservable in the component tests that already assert this Player's
gesture table. The same reasoning is already recorded for the seek zones, whose
*geometry* is CSS but whose *direction* is markup.

### D2 — The tap's action stays a library `Gesture`

The coarse branch uses the library's `toggle:controls` action rather than calling
`player.controls.show()` from a listener of our own. The `Gesture` already carries the
guards a hand-rolled listener would have to copy — an open menu, a touch that scrolled, a
pinch, a non-primary button, a target that is not the provider — and `disabled={isRunActive || isHolding}`
keeps working unchanged, so a run's taps and a released hold stay silent without a second
code path. Nothing about the seek-run or speed-hold machinery moves.

### D3 — A new `VideoCenterPlayButton` component, not a layout slot

The Default Layout exposes no slot at the centre of the frame in its full chrome, so the
control is a component of this project, rendered by `LessonVideoPlayer` **after**
`<DefaultVideoLayout>` — later in the tree, so it stacks over the gesture layer and takes
its own pointer.

It is a plain `<button class="vds-button">` that calls `useMediaRemote().togglePaused()`
and reads `paused` for its label and `aria-pressed`, drawing
`defaultLayoutIcons.PlayButton.Play` / `.Pause` — the same glyphs the control bar uses.
That is the shape of its neighbour `VideoEnlargeButton`, for the same reasons: one icon
vocabulary inside the player, and a control that can be tested in isolation with the
media hooks stubbed.

_Alternative considered:_ wrap the library's `<PlayButton>`. Rejected once implemented:
it needs a live media context, and the project's component tests stub `@vidstack/react`
wholesale, so the control's own rules would be untestable in its own test file.

**It decides its own visibility**, as `VideoEnlargeButton` does for `canFullscreen`: it
reads `pointer`, `controlsVisible` and `width` and renders nothing unless all three
allow it (D4, D5). `LessonVideoPlayer` mounts it unconditionally, so the player's JSX
carries no rule and the rule is asserted where it lives.

It lives at `src/components/lesson-view/video-center-play-button/` with its story, test
and JSDoc, following the folder-per-entity rule.

Because the button is an element drawn over the video that takes the pointer, the tap on
it never reaches the provider, so the library's own gesture targeting already keeps it
from toggling the control bar — the control bar and the resume overlay are protected by
exactly that today.

### D4 — "Which chrome is in force" comes from one predicate

`smallLayoutWhen={({ width }) => width < 576}` is the only place the compact-chrome
threshold is written today. It moves to `src/lib/player-layout/player-layout.ts` as a
named predicate over the player's width, and both `LessonVideoPlayer`'s `smallLayoutWhen`
and the decision to draw the centre button read it. The button is drawn when, and only
when, the pointer is coarse, `controlsVisible` is true, and the full chrome is in force.

_Alternative considered:_ a CSS sibling rule on `.vds-video-layout[data-sm]` to hide our
button in the compact chrome. Rejected for D1's first reason — a control that must not
exist twice should not depend on a stylesheet arriving — and because "hidden" is not the
same as "absent" for a control that takes the pointer.

### D5 — Nothing is drawn while the controls are hidden

The button is rendered conditionally, never hidden with `opacity` or `visibility`. A
learner watching an uninterrupted lesson has nothing of the Player's over the video, and
no invisible element can swallow the tap that is supposed to reveal the bar.

Its geometry is a rule in `lesson-video-player.css`, next to the enlarged-player rules
that are there for the same reason — Vidstack's own player rules outrank utility classes.
It is centred on the frame, sized to match the compact chrome's 45px button, and given a
hit area of at least 44 by 44 CSS pixels.

### D6 — The control borrows the Player's existing words

`Components.VideoPlayer` already carries `play` and `pause` in `en`, `es` and `pt` —
the control bar's own words, mapped by `LAYOUT_WORD_MESSAGE_KEYS`. The centre control is
the same control in another place, so it reads the same two keys instead of opening a
`Components.VideoCenterPlayButton` namespace that would translate the same words twice.

## Risks / Trade-offs

- **The leaked YouTube icon is dead again while the controls are hidden** → That is the
  platform convention the learner asked for: on a phone, the first tap anywhere reveals
  the chrome. The tap is never swallowed — it always answers with the control bar — and
  the second tap on the icon lands on our own centre control, because D3 puts one there
  in both chromes.
- **`pointer` is `'fine'` until the player measures the device** → A first paint could
  carry the mouse gesture for a frame. The state is set on connect, before any pointer
  event of the learner's can arrive, so no real tap is decided by the stale value.
- **A hybrid device (touch laptop, iPad with a trackpad) reports one pointer type** →
  Vidstack reports the primary pointer, the same input the library's own layout switches
  on. Matching the library is the least surprising answer.
- **Two centre controls, or none, if D4's predicate drifts from `smallLayoutWhen`** →
  they read one exported predicate, and a component test asserts both chromes.

- **A tap-revealed bar never leaving on its own** → Measured, and fixed. The library's
  `toggle:controls` shows the bar with `show(0)`, which clears the idle timer, and it
  marks the tap as a gesture so the idle tracker skips it; over a playing lesson the bar
  stayed up indefinitely. The tap gesture's `onTrigger` re-arms `hide(defaultDelay)`
  while the lesson plays, so the bar leaves on the library's own schedule. A component
  test pins the call and the iPhone e2e waits for the bar to leave.

## Migration Plan

Not applicable — no data, storage or route changes. The behaviour ships with the
component; a rollback is the revert of this change.

## Testing strategy

| Layer | Covers | Mirrors |
| --- | --- | --- |
| **Vitest + RTL** — `lesson-video-player.test.tsx` | The gesture table per pointer type: `toggle:controls` and no `toggle:paused` when `useMediaState("pointer")` is `'coarse'`; the reverse when `'fine'`. That the double-tap and seek gestures are untouched in both. That the centre button is rendered only for coarse + `controlsVisible` + full chrome, and never in the compact chrome or on a fine pointer. | The existing `gesturesIn(player)` helper and the `mockUseMediaState` harness already in that file — `useMediaState` is mocked there, which is what makes both branches reachable. |
| **Vitest + RTL** — `video-center-play-button.test.tsx` (new) | The control itself: it renders a button, its accessible name is the locale's word for the action it performs, and a click asks the player to toggle playback. | `video-enlarge-button.test.tsx`, the closest neighbour in shape and in how it stands in for a library control. |
| **Vitest** — `player-layout.test.ts` (new) | The compact-chrome predicate at and around its threshold. | Any `src/lib/**` unit test; `seek-run.test.ts` is the nearest in spirit. |
| **Storybook** — `video-center-play-button.stories.tsx` (new) | Play and Pause states, and the three locales through the toolbar. | `video-enlarge-button.stories.tsx`. |
| **Playwright** — `e2e/lesson-video-player.spec.ts` | The behaviour itself, which no jsdom test can reach: under the `IPHONE` descriptor, a tap on a playing video reveals the bar and does **not** pause; a second tap hides it; a tap on the centre control pauses; the same in the enlarged landscape mode, which is where the original bug was reported. On desktop, the existing "WHEN the video is clicked THEN it pauses" stays green unchanged. | The `IPHONE` block already in that file, its `revealControls` / `startPlayback` / `spotOnTheVideo` helpers, and the two tests this change inverts (`"WHEN the video is tapped THEN it pauses…"`, `"WHEN the chrome renders THEN no gesture only reveals the controls"`). |

Every task is TDD: the failing test first, then the code. Run `pnpm verify`, then
`pnpm test:e2e` for the player spec (per the project's e2e notes, with an explicit base
URL and `--workers=1`), and confirm the behaviour by hand on the iOS simulator — the
pointer type is what selects it, so a desktop browser cannot show it.

## Open Questions

- None blocking. If the compact chrome's 45px control turns out to be the better size in
  the full chrome too, that is a CSS constant in `lesson-video-player.css`, not a
  decision this design has to make in advance.
