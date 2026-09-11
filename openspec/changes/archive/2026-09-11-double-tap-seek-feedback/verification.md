# Verification notes

## Automated

- `pnpm verify` — typecheck, Prettier, ESLint and Vitest green (1374 tests). New and
  watched red first: `seek-run.test.ts` (8), `use-seek-run.test.ts` (9),
  `seek-feedback.test.tsx` (7), and the "GIVEN a learner who double-taps an edge"
  describe in `lesson-video-player.test.tsx` (10, driven through Vidstack's real gesture
  path — two pointer-ups on the provider, the seek zones given boxes, the player's
  connect timers flushed — with only `useMediaRemote` mocked). One unrelated test
  (`generate-metadata-locale-guard`) timed out once while the e2e suite was running in
  parallel and passed 11/11 alone: load, not a regression.
- `pnpm exec playwright test e2e/lesson-video-player.spec.ts --workers=1` on chromium,
  firefox and webkit against the dev server on port 3000 — 37 passed, 32 skipped (the
  iPhone blocks run on webkit only), none failed. New: under iPhone emulation a double
  tap on the right edge moves the player's clock by ten seconds and shows the forward
  indicator; a third tap adds ten more and the label counts twenty; a middle tap during
  a run leaves the video playing; once the run has ended a tap pauses; on chromium a
  double click on the right edge seeks and says so. The clock is read from the
  `MediaPlayerInstance` through `find-media-player`, not from the embed.
- Storybook (`LessonView/SeekFeedback`), checked through the Playwright MCP: forward
  and Spanish stories render the half-disc on the right, three chevrons lit in sequence,
  and "10 seconds" / "20 segundos".
- Chromium on the real lesson page (ad-hoc Playwright probe): after a double click the
  indicator sits at the right edge of the player, 40 % of its width, `z-index: 10`,
  translucent white, `border-radius: 100% 0 0 100%`, chevrons animating `seek-pulse`.

## Manual, real iOS Safari (iOS 26.5 simulator, `iphone-test`), 2026-09-10

Lesson: Basic Course › Introduction › "Introduction" (YouTube `VZVwBdAGjBE`), in the
page, landscape, Safari's toolbar on screen. Taps were driven with `cliclick` on the
Simulator window and read off `screencapture -R` shots of that window.

| Step                                                            | Result                                                                                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Tap the video once                                              | resume overlay offered 04:56; tap "Resume" → playing                                                          |
| Double-tap the right fifth of the video                         | **seek** (buffering spinner, new frame), indicator with three right-pointing chevrons and **"10 seconds"**    |
| Double-tap, then one more tap on the same edge ~220 ms later    | label **"20 seconds"**, a second seek, video **still playing** — the third tap did not pause                  |
| Wait ~1.2 s                                                     | indicator gone, video playing                                                                                 |

In that pass the indicator was drawn at the **left** edge and without its half-disc:
the tab was holding the stylesheet Turbopack served before this change, so the
utilities that already existed (`inset-y-0`, `flex`, `items-center`) applied and the new
ones (`right-0`, `w-[42%]`, `rounded-l-[100%]`, `bg-white/15`) did not. The chevrons
still pointed right — the direction lives in the glyph, which is the point of that rule.
The same served stylesheet, fetched afterwards, contains every new utility, and the
`LessonView/SeekFeedback` story opened in the simulator's Safari renders the indicator
correctly on the device (right side, disc, chevrons, count).

## Manual, real iOS Safari, production build (`pnpm build` + `PORT=3100 pnpm start`), 2026-09-10

Same lesson, same simulator, opened from the production server in a fresh tab, enlarged
(pinned to the viewport in landscape) — the state of the report's recording. Real taps
with `cliclick`, read off window captures.

| Step                                                  | Result                                                                                                     |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Tap the centre                                        | playing from 0:00                                                                                          |
| Double-tap the right fifth                            | indicator on the **right** half: translucent half-disc, three right-pointing chevrons, **"10 seconds"**    |
| One more tap on the same edge ~250 ms later           | label **"20 seconds"**, clock at **0:22**, video still playing                                             |
| Wait ~1.2 s                                           | indicator gone, playing at 0:23                                                                            |

### Why the dev server showed it wrong on iPhone

A recording made against `pnpm dev` (port 3000) showed the indicator hugging the left
edge with no disc, and the same happened in the simulator even after reloading that tab.
Inside that tab the new utilities (`right-0`, `w-[42%]`, `rounded-l-[100%]`,
`bg-white/15`) were absent while the pre-existing ones applied; a fresh WebDriver-driven
load of the same URL, and the same tab right after a hot-module update, computed the
correct geometry (`right: 0`, 41 % wide, disc). The dev server's CSS chunk keeps its
name across edits, and iOS Safari ended up mixing bodies of it across reloads and HMR
pushes — see [[turbopack-serves-stale-globals-css]]. The production build names the
stylesheet by content hash and has no HMR, and there the indicator is correct on the
device. The clock resetting to 0:00 once during those dev-server attempts coincided
with a hot-module update remounting the provider's iframe, not with a seek.

## Not verified

- Portrait on the device, and Android.
