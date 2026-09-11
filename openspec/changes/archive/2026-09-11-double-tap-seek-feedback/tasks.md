## 1. Run arithmetic (pure lib)

- [x] 1.1 Create `src/lib/seek-run/seek-run.test.ts`: `startSeekRun` yields one step at the given anchor; `extendSeekRun` on the same side adds a step and keeps the anchor; on the opposite side it starts one step anchored at the replaced run's target; `seekRunTarget` is `anchor ± steps × SEEK_STEP_SECONDS`; `seekRunSeconds` is `steps × SEEK_STEP_SECONDS`; the step is 10 and the window 700 (TDD: test → impl)
- [x] 1.2 Implement `src/lib/seek-run/seek-run.ts` — the constants, the `SeekDirection` / `SeekRun` types and the four pure functions, with JSDoc on every export (TDD: test → impl)

## 2. Run lifetime (hook)

- [x] 2.1 Create `src/hooks/use-seek-run/use-seek-run.test.ts` with `renderHook` and fake timers: `tap` starts a run and returns the target; a same-side `tap` extends it; an opposite-side `tap` re-anchors; the run clears `SEEK_RUN_WINDOW_MS` after the last tap and not before; each tap restarts the window; unmount clears the timer (TDD: test → impl)
- [x] 2.2 Implement `src/hooks/use-seek-run/use-seek-run.ts` — `{ run, tap(direction, currentTime): number }`, run in state, timer in a ref, JSDoc (TDD: test → impl)

## 3. The indicator (component)

- [x] 3.1 Create `src/components/lesson-view/seek-feedback/seek-feedback.test.tsx`: the label is `seconds` with the count; the sr text is `forward` or `backward` with the count; the visible label is `aria-hidden`; the element is `role="status"` and `pointer-events-none`; forward renders a right-pointing glyph and backward a left-pointing one, without a rotation class; `data-direction` carries the side (TDD: test → impl)
- [x] 3.2 Add `Components.SeekFeedback` (`seconds` as an ICU plural, `forward`, `backward`) to `src/messages/en.json`, `es.json` and `pt.json`
- [x] 3.3 Implement `seek-feedback.tsx` — half-disc over the tapped half, `ChevronsLeft` / `ChevronsRight` from lucide, staggered pulse via a new `--animate-seek-pulse` keyframe under `@theme` in `src/app/globals.css` next to `arrow-drop`, `motion-reduce:animate-none`, `tw-animate-css` entrance (TDD: test → impl)
- [x] 3.4 Write `seek-feedback.stories.tsx` under `LessonView/SeekFeedback`: Forward, Backward, Accumulated (30 seconds), InSpanish, InPortuguese; a decorator draws a 16:9 black frame
- [x] 3.5 JSDoc on `SeekFeedback` and its props: what it draws, why the direction is in the glyph, why it never takes the pointer
- [x] 3.6 Open the stories in Storybook through the Playwright MCP and check both sides, the count, the three locales, and reduced motion; fix what looks wrong

## 4. Wiring the run into the player

- [x] 4.1 In `lesson-video-player.test.tsx`, extend "GIVEN a learner who taps the video": the seek actions read `SEEK_STEP_SECONDS`; no `role="status"` indicator renders before a run (TDD: test → impl — green today for the actions, kept as the guard that the constant is what they read)
- [x] 4.2 Add a describe "GIVEN a learner who double-taps an edge", mocking only `useMediaRemote` from `@vidstack/react`: dispatching a cancelable `will-trigger` on the forward gesture is prevented, `seek` is called with `currentTime + SEEK_STEP_SECONDS`, the indicator shows one step forward, and every gesture's `$props.disabled()` is true (TDD: test → impl — red today: the library seeks and nothing renders)
- [x] 4.3 In that describe, stub `getBoundingClientRect` on the two seek gesture elements and the player, then `fireEvent.pointerUp` on the provider: a hit in the forward box seeks to `anchor + 2 × step` and the label counts two steps; a hit in the backward box re-anchors and seeks one step back; a hit in the middle seeks nothing; a non-primary button is ignored; after `SEEK_RUN_WINDOW_MS` the indicator is gone and `$props.disabled()` is false (TDD: test → impl)
- [x] 4.4 Move `PlaybackGestures` to `src/components/lesson-view/lesson-video-player/playback-gestures.tsx` and implement the run: refs on the seek gestures, `useSeekRun`, `useMediaPlayer` for the anchor, `useMediaRemote` for the seek, `onWillTrigger` on the seek gestures, `disabled={run !== null}` on all four, the `pointerup` effect on the player element, and `<SeekFeedback>` while the run is active; actions built from `SEEK_STEP_SECONDS` (TDD: test → impl)
- [x] 4.5 Update `lesson-video-player.css` only if the indicator needs a rule the utilities cannot give it; update the JSDoc in `lesson-video-player.tsx` (the gestures paragraph points at the helper and the run) and write the helper's JSDoc: why the library detects and we seek, why the gestures are disabled during a run, why hit-testing uses the gesture boxes

## 5. End to end (Playwright)

- [x] 5.1 In `e2e/lesson-video-player.spec.ts`, add a helper that reads the current time from the layout's readout, and in "GIVEN Safari on an iPhone" add "WHEN the right edge is double-tapped THEN the video seeks ten seconds and says so": two quick taps on the provider at 90 % of the width, expect the readout to reach 0:10 and the status to read the one-step label (TDD: test → impl — red until 4.4 lands: the time moves but no status renders)
- [x] 5.2 Add "WHEN a third tap follows THEN another ten seconds are added": three taps, readout 0:20, label two steps (TDD: test → impl)
- [x] 5.3 Add "WHEN the middle is tapped during a run THEN the video keeps playing": double tap the edge, tap the centre at once, expect `data-playing` to stay (TDD: test → impl)
- [x] 5.4 Add "WHEN the run has ended THEN a tap pauses again": after the label leaves, tap the centre, expect `data-paused` (TDD: test → impl)
- [x] 5.5 In the desktop describe, add "WHEN the right edge is double-clicked THEN the video seeks and says so" (chromium) (TDD: test → impl)
- [x] 5.6 Run `e2e/lesson-video-player.spec.ts` on the three projects (`PLAYWRIGHT_BASE_URL` per the machine notes, `--workers=1`) and fix what fails

## 6. Manual verification on the iOS Simulator

- [x] 6.1 Open a YouTube-sourced lesson on the iPhone simulator, start playback: double-tap the right side, keep tapping at a natural pace, watch the label count and the time follow; tap the left side and see the run turn around; confirm no zoom and no pause mid-run; repeat enlarged in landscape
- [x] 6.2 Record the runs (screenshots of the Simulator window) in the change's `verification.md`

## 7. Verification

- [x] 7.1 Walk the `clean-code` checklist over the lib, the hook, the component, the helper and the tests (names, one thing per function, argument count, comments explain why)
- [x] 7.2 Run `pnpm verify` (typecheck, format:check, lint, test:run) and `pnpm test:e2e` for `e2e/lesson-video-player.spec.ts`; fix every failure before declaring the change done
