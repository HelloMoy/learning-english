# Verification notes

## Automated

- `pnpm verify` — typecheck, Prettier, ESLint and Vitest green (1518 tests, 30 skipped).
  New, each red first: `video-pointer.test.ts` (4), `use-speed-hold.test.ts` (35),
  `speed-feedback.test.tsx` (6), and the "GIVEN a learner who holds the video" describe in
  `lesson-video-player.test.tsx` (14), plus one added to the seek-run describe. The player
  tests mock only `useMediaRemote` and `useMediaState` — jsdom loads no provider, so the
  player never leaves `paused` however it is driven, and every rate request is held behind
  a `can-play` that never arrives. Adding the `useMediaState` mock left all 36 existing
  tests in that file passing, which is what says it does not disturb the layout.
- `pnpm exec playwright test e2e/lesson-video-player.spec.ts --workers=1` on chromium,
  firefox and webkit against the dev server — **73 passed, 38 skipped** (the iPhone blocks
  run on webkit only), none failed. New: a press held on the video reaches `playbackRate`
  2 and draws the pill; releasing it returns the rate to 1 and leaves the video playing;
  a press that drags arms nothing; the same hold under iPhone emulation; and on the
  keyboard, holding the play/pause key speeds the video up, releasing it restores the rate
  without toggling, and a tap of that key still pauses without scrolling the page. The
  rate is read from the `MediaPlayerInstance` through `find-media-player`, so it is the
  provider's own, not this app's intent.
- Two failures seen once in a full three-project run — `WHEN the frame is oversized THEN
  its centre sits on the visible band's centre` (chromium) and `WHEN the mode is entered
  mid-playback THEN the video keeps rolling` (webkit) — passed 3/3 each in isolation.
  Both predate this change and depend on YouTube finishing a load.
- One test of this change's own was flaky at first: the drag guard on firefox moved the
  pointer in a single jump, which a busy engine can deliver after the hold has already
  armed. It travels in steps now, and passed 5/5.
- Storybook (`LessonView/SpeedFeedback`), driven through the Playwright MCP: the pill
  renders at the top of the frame in `en`, `es` and `pt`, and the rate is formatted by the
  locale — the Spanish story at 1.5 reads **"1,5×"**, which is why the rate reaches the
  copy as a number rather than as a string this app formatted.

## Manual, real iOS Safari (iOS 26.5 simulator, `iphone-test`), 2026-09-11

Lesson: Basic Course › Introduction › "Introduction" (YouTube), in the page, portrait and
landscape. Presses were driven with `cliclick` on the Simulator window and read off
`xcrun simctl io booted screenshot`.

| Step                                                        | Result                                                                             |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Tap the video, resume, then hold a finger on it              | **"2× »" pill** at the top of the frame after about half a second                   |
| Keep holding for several seconds                             | pill steady, **no callout sheet, no text selection, no loupe** — the CSS holds       |
| Lift the finger                                              | pill gone, centre glyph still the pause one: **the video kept playing**              |
| Press and drag up through the video (portrait and landscape) | **the page scrolled and no pill appeared** — the swipe is not read as a hold        |

**One defect was found here and fixed.** Before the fix, lifting the finger **paused the
lesson**: the browser delivers a touch release as `pointerup` and then `touchend`, and
Vidstack's tap gesture listens for the second of those on a coarse pointer, so ending the
hold between the two re-enabled that gesture in time for it to read the release as a tap.
A mouse never showed it, because there is no `touchend`. The hold now outlives the frame
its release arrived in; `use-speed-hold.ts` carries the reasoning and a test pins it.

Not exercised by hand: the pinned (enlarged) player specifically — the swipe was driven
through the player in both orientations in the page, and it is the same element, the same
listener and the same guard. The keyboard hold is a desktop gesture and was verified in
chromium rather than on the phone.
