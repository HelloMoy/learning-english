## 1. Hold lifetime (hook)

- [x] 1.1 Create `src/hooks/use-speed-hold/use-speed-hold.test.ts` with `renderHook` and fake timers over a fake player element: a `pointerdown` on the provider arms nothing before `HOLD_ARM_DELAY_MS` and reports the hold after it; `pointerup`, `pointercancel` and a second `pointerdown` end it; a `pointermove` past the movement threshold before the delay cancels the arming and one below it does not; a move after arming is ignored; unmount clears the timer and the listeners (TDD: test → impl)
- [x] 1.2 Add the guard cases to that test: a non-primary button, a target outside `[data-media-provider]`, and an `enabled` flag the caller lowers (paused, `canSetPlaybackRate` false, a seek run) each arm no hold; lowering it mid-hold ends the hold; the context menu is prevented while a press is in flight and left alone otherwise (TDD: test → impl)
- [x] 1.3 Implement `src/hooks/use-speed-hold/use-speed-hold.ts` — exports `HOLD_PLAYBACK_RATE`, `HOLD_ARM_DELAY_MS`, the movement threshold and the hook; listeners attached to the player element, the timer in a ref, the armed state in state, `contextmenu` prevented while a press is in flight; JSDoc on every export saying why the hold is timed here and not by a `<Gesture>` (TDD: test → impl)

## 2. The indicator (component)

- [x] 2.1 Create `src/components/lesson-view/speed-feedback/speed-feedback.test.tsx`: the visible label carries the rate and is `aria-hidden`; the element is `role="status"` with worded sr text naming the speed; it is `pointer-events-none`; the forward glyph is a right-pointing one rendered without a rotation class (TDD: test → impl)
- [x] 2.2 Add `Components.SpeedFeedback` to `src/messages/en.json`, `es.json` and `pt.json` — the visible label with the rate as an ICU number argument, and the sr sentence
- [x] 2.3 Implement `speed-feedback.tsx` — the pill near the top-centre of the player box, `z-10`, `ChevronsRight` from lucide, `tw-animate-css` entrance, `motion-reduce:animate-none` (TDD: test → impl)
- [x] 2.4 Write `speed-feedback.stories.tsx` under `LessonView/SpeedFeedback`: Default, InSpanish, InPortuguese; a decorator draws the 16:9 black frame, as `SeekFeedback`'s stories do
- [x] 2.5 JSDoc on `SpeedFeedback` and its props: what it draws, why the direction is in the glyph, why it never takes the pointer
- [x] 2.6 Open the stories in Storybook through the Playwright MCP and check the pill in the three locales and under reduced motion; fix what looks wrong

## 3. Wiring the hold into the player

- [x] 3.1 In `lesson-video-player.test.tsx`, add a describe "GIVEN a learner who holds the video", mocking only `useMediaRemote`: a press held past `HOLD_ARM_DELAY_MS` calls `changePlaybackRate(HOLD_PLAYBACK_RATE)` and renders the indicator; releasing calls it with the rate captured at arm time and unmounts the indicator (TDD: test → impl — red today: nothing listens for a press)
- [x] 3.2 Add to that describe: while the hold is armed every gesture's `$props.disabled()` is true, and it is false again after the release, so the press that ended a hold toggles nothing; a press released before the delay changes no rate (TDD: test → impl)
- [x] 3.3 Add the blocked cases through the player: a paused player, `canSetPlaybackRate` false, and an active seek run each leave `changePlaybackRate` uncalled and draw no indicator (TDD: test → impl)
- [x] 3.4 Implement the wiring in `playback-gestures.tsx` — `useSpeedHold` fed the player element, the run's active flag and the player state; `disabled={isRunActive || isHoldActive}` on all four gestures; `<SpeedFeedback>` while the hold is armed (TDD: test → impl)
- [x] 3.5 Add `-webkit-touch-callout: none` and `user-select: none` for the provider and the blocker in `lesson-video-player.css`; update the JSDoc in `playback-gestures.tsx` and the gestures paragraph in `lesson-video-player.tsx` so both name the hold alongside the tap and the seek run

## 4. Locale coverage

- [x] 4.1 `src/messages/messages.test.ts` already fails on a key set that drifts between locales, so `Components.SpeedFeedback` is covered for `en`, `es` and `pt` by the existing test — verified by running it; no new test needed (TDD: existing test → copy)

## 5. End to end (Playwright)

- [x] 5.1 In `e2e/lesson-video-player.spec.ts`, add a helper that holds a spot on the provider for a given time (mouse down/up for the desktop projects, dispatched pointer events for the touch project) and one that reads the media element's rate (TDD: test → impl)
- [x] 5.2 In the desktop describe, add "WHEN the video is pressed and held THEN it runs at double speed": the rate reaches 2 and the pill shows; on release the rate is back to 1 and the video is still playing (TDD: test → impl)
- [x] 5.3 In "GIVEN Safari on an iPhone", add the same hold and release on the provider (TDD: test → impl)
- [x] 5.4 Add "WHEN the learner swipes through the enlarged player THEN the rate never changes": press, move past the threshold, release; expect no indicator and rate 1 (TDD: test → impl)
- [x] 5.5 Add "WHEN a hold is released THEN the video is not paused" (TDD: test → impl)
- [x] 5.6 Run `e2e/lesson-video-player.spec.ts` on the three projects (`PLAYWRIGHT_BASE_URL` per the machine notes, `--workers=1`) and fix what fails

## 6. Manual verification on the iOS Simulator

- [x] 6.1 Open a YouTube-sourced lesson on the iPhone simulator: hold the video and watch the pill and the speed; release and confirm it neither pauses nor stays fast; confirm no callout sheet appears; repeat enlarged in landscape and confirm the toolbar-hiding swipe still scrolls and never arms a hold
- [x] 6.2 Record the runs (screenshots of the Simulator window) in the change's `verification.md`

## 8. The play/pause key carries the hold

- [x] 8.1 Extend `use-speed-hold.test.ts` with a key describe: the announced key-down arms a hold after the delay; `keyup` ends it; a second announcement while a press is in flight is ignored, so a platform repeat does not end the hold; a key released before the delay reports a tap instead of a hold and arms nothing; a key-down is ignored while the gesture is not enabled; a pointer press in flight ignores the key (TDD: test → impl)
- [x] 8.2 Implement the key half of `useSpeedHold` — the press ref learns which input it belongs to, the key is heard as a custom event on the player element, `keyup` ends it on the document, and `onKeyTap` reports the short press (TDD: test → impl)
- [x] 8.3 Tried the library's `keyShortcuts` table first, with a test of its own; the chrome's play button re-registers the same shortcut through `aria-keyshortcuts` and that plain key list overrides the table's handler, so the library toggled anyway. Table and test deleted — `design.md` §7 records it (TDD: test → impl → measured in the browser → reverted)
- [x] 8.4 Take the key in the capture phase on the document instead, with the guards the library would have applied (the key list, modifiers, focus inside the player, a focused control that owns the key); wire `onKeyTap` in `PlaybackGestures` to `remote.togglePaused` (TDD: test → impl)
- [x] 8.5 In `lesson-video-player.test.tsx`, extend the hold describe: holding the key changes the rate and draws the indicator; releasing restores it; a short press toggles playback and changes no rate (TDD: test → impl)
- [x] 8.6 In `e2e/lesson-video-player.spec.ts`, add to the desktop describe: the player is focused, the key is held, the rate reaches 2 and the pill shows; on release the rate is back and the video plays on; a short press pauses (TDD: test → impl)
- [x] 8.7 Run the touched e2e file on the three projects and fix what fails

## 7. Verification

- [x] 7.1 Walk the `clean-code` checklist over the hook, the component, the helper and the tests (names, one thing per function, argument count, comments explain why)
- [x] 7.2 Run `pnpm verify` (typecheck, format:check, lint, test:run) and `pnpm test:e2e` for `e2e/lesson-video-player.spec.ts`; fix every failure before declaring the change done
