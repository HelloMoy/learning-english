## 1. The compact-chrome predicate

- [x] 1.1 (TDD: test → impl) Add `src/lib/player-layout/player-layout.test.ts` covering
      the threshold at, below and above the compact-chrome width, then create
      `src/lib/player-layout/player-layout.ts` exporting the width constant and the
      predicate, with JSDoc (design §D4).
- [x] 1.2 (TDD: test → impl) Point `LessonVideoPlayer`'s `smallLayoutWhen` at that
      predicate — an existing player test asserts the layout breaks on width alone; keep
      it green and let it be the failing-first test if the wiring is wrong.

## 2. The centre play/pause control

- [x] 2.1 (TDD: test → impl) Write
      `src/components/lesson-view/video-center-play-button/video-center-play-button.test.tsx`
      — renders a button, its accessible name is the locale's word for the action it
      performs, activating it asks the player to toggle playback — then create
      `video-center-play-button.tsx` around the library's `<PlayButton>` with
      `defaultLayoutIcons.PlayButton` glyphs and the `Components.VideoPlayer` `play` /
      `pause` keys (design §D3, §D6). No new message keys.
- [x] 2.2 Add JSDoc on the component and its props, per the project's TypeDoc rules.
- [x] 2.3 Add `video-center-play-button.stories.tsx` under the `LessonView/` title prefix
      with a playing and a paused story, verified in `en`, `es` and `pt` from the
      toolbar.

## 3. The tap's meaning

- [x] 3.1 (TDD: test → impl) In `lesson-video-player.test.tsx`, assert the gesture table
      for a coarse pointer — the `pointerup` gesture's action is `toggle:controls` and no
      gesture carries `toggle:paused` — and for a fine pointer the reverse. Replace the
      "no gesture merely reveals the controls" test, which this change inverts. Then make
      `PlaybackGestures` read `useMediaState("pointer")` and render the one gesture
      (design §D1, §D2).
- [x] 3.2 (TDD: test → impl) Assert the double-tap, edge-seek and hold gestures are
      unchanged on both pointer types, and that a seek run and a hold still disable the
      tap gesture on touch. _The gesture table is asserted for a finger in the component
      test. `disabled` is not reflected in the DOM and jsdom cannot observe a controls
      toggle, so the touch branch of "a run or a hold silences the tap" is the one shared
      `disabled` prop, already proven on the mouse branch, and is exercised in the
      browser by 4.1._
- [x] 3.3 (TDD: test → impl) Assert the centre control is rendered only when the pointer
      is coarse, the controls are visible and the full chrome is in force — and is absent
      in the compact chrome, on a fine pointer, and while the controls are hidden. Then
      render it from `LessonVideoPlayer` after `<DefaultVideoLayout>` (design §D3, §D5).
      _The absent cases live in the control's own test, since it owns the rule; the
      player test asserts it is mounted inside the player._
- [x] 3.4 Add the centre control's geometry to `lesson-video-player.css`: centred on the
      frame, sized as the compact chrome's button, hit area at least 44 by 44 CSS pixels.
- [x] 3.5 Update the JSDoc on `LessonVideoPlayer` and `PlaybackGestures` — both currently
      state the old rule and the reason for it — so they say what the tap now means on
      each pointer and why the centre control exists.

- [x] 3.6 (TDD: test → impl) A tap that brings the bar in over a playing lesson hands it
      back to the library's idle timer, and never over a paused one. _Found by measuring
      under iPhone emulation: `toggle:controls` shows the bar with `show(0)`, which clears
      the idle timer, and flags the tap as a gesture so the idle tracker ignores it — the
      bar then stayed up for good. `onTrigger` re-arms `hide(defaultDelay)`._

## 4. Browser behaviour

- [x] 4.1 (TDD: test → impl) In `e2e/lesson-video-player.spec.ts`, rewrite the iPhone tap
      tests: a tap on a playing video reveals the control bar and does not pause; a
      second tap hides it; a tap on the centre control pauses; the same holds in the
      enlarged landscape mode. Replace "WHEN the chrome renders THEN no gesture only
      reveals the controls" with its inverse for touch.
- [x] 4.2 Confirm the desktop tests still assert a click pauses the video, untouched.

## 5. Verification

- [x] 5.1 Run `pnpm verify` (typecheck, format, lint, `pnpm test:run`) and fix any
      failure at its root.
- [x] 5.2 Run `pnpm test:e2e` for `e2e/lesson-video-player.spec.ts` with an explicit base
      URL and `--workers=1`.
- [x] 5.3 Verify by hand on the iOS simulator, in the page and in the enlarged landscape
      mode, on a YouTube-sourced lesson: the first tap reveals the bar, the centre
      control toggles playback, and the bar hides again on the next tap.
- [x] 5.4 Run `/opsx:verify`, then `/opsx:archive`.
