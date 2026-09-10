## 1. The gesture contract (component)

- [x] 1.1 In `lesson-video-player.test.tsx`, add a `describe("GIVEN a learner who taps the video")`: the player element contains a `[data-media-gesture][event="pointerup"][action="toggle:paused"]` child and no `[action="toggle:controls"]` at all (TDD: test → impl — red today: the player renders no gestures of its own, and the layout's stay unmounted under jsdom)
- [x] 1.2 In the same describe, assert the double-tap set is present: `dblpointerup` gestures for `toggle:fullscreen`, `seek:-10` and `seek:10` (TDD: test → impl)
- [x] 1.3 Implement the private `PlaybackGestures` helper in `lesson-video-player.tsx` (four `<Gesture className="vds-gesture">` elements, direct children of `<MediaPlayer>`) and pass `noGestures` to `DefaultVideoLayout`; run the component tests green (TDD: test → impl)
- [x] 1.4 Add the gesture geometry to `lesson-video-player.css`: `[data-media-player] > .vds-gesture` absolute over the whole box at `z-index: 0`; the `seek:-10` / `seek:10` regions 20% wide, pinned left/right, `z-index: 1`; a comment on why the elements live outside the layout and miss its rules
- [x] 1.5 Rewrite the relevant JSDoc: a paragraph in `LessonVideoPlayer` on why the layout's gestures are replaced (YouTube's mobile icon, the coarse-pointer gating) and a JSDoc block on the helper

## 2. End to end (Playwright)

- [x] 2.1 In `e2e/lesson-video-player.spec.ts`, "GIVEN Safari on an iPhone": add "WHEN the video is tapped THEN it pauses, and a second tap resumes it" — `revealControls`, click `.vds-play-button`, wait for `data-playing`, tap `[data-media-provider]` at its centre, expect `[data-media-player][data-paused]` and the control bar visible, tap again, expect `data-playing` (TDD: test → impl — red until 1.3 lands; today the tap only toggles the bar)
- [x] 2.2 Add "WHEN the video is enlarged THEN a tap still toggles playback": press the enlarge control mid-playback, tap the provider, expect `data-paused` (TDD: test → impl)
- [x] 2.3 In the desktop describe, add "WHEN the video is clicked THEN it pauses" (chromium, fine pointer): start playback, click the provider, expect `data-paused` — the guard that replacing the set did not lose the mouse behaviour (TDD: test → impl)
- [x] 2.4 Add "WHEN the chrome renders THEN no gesture only reveals the controls": `.vds-gesture[action="toggle:controls"]` has count 0 while `[action="toggle:paused"]` has count 1 (TDD: test → impl)
- [x] 2.5 Update "WHEN the mode is entered mid-playback THEN the video keeps rolling": the `player.tap({ position: { x: 8, y: 8 } })` that revealed the bar now pauses the video by design — resume with `.vds-play-button` before pressing the enlarge control, and keep the `data-playing` assertions
- [x] 2.6 Run `e2e/lesson-video-player.spec.ts` on the three projects (`PLAYWRIGHT_BASE_URL` per the machine notes, `--workers=1` to tell flakes from regressions) and fix what fails

## 3. Manual verification on the iOS 26.5 simulator

- [x] 3.1 Open the "Introduction" lesson of the basic course, start playback, enlarge, rotate to landscape, swipe the toolbar away: tap YouTube's centre pause icon while it shows → the video pauses and the bar appears; tap the centre play icon → it resumes
- [x] 3.2 Repeat in portrait (small layout): a tap on the video pauses/resumes; the control-bar buttons, the resume overlay and the scroll hint's dismiss button still act without toggling playback
- [x] 3.3 Record both runs (screenshots via `screencapture` of the Simulator window) in the change's `verification.md`

## 4. Verification

- [x] 4.1 Walk the `clean-code` checklist over the helper, the CSS block and the tests (names, single responsibility, argument count, comments explain why)
- [x] 4.2 Run `pnpm verify` (typecheck, format:check, lint, test:run) and `pnpm test:e2e` for `e2e/lesson-video-player.spec.ts`; fix every failure before declaring the change done
