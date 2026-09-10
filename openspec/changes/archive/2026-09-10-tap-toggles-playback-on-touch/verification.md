# Verification notes

## Automated

- `pnpm verify` — typecheck, Prettier, ESLint and Vitest green (1339 tests). New in
  `lesson-video-player.test.tsx`: the player carries a `pointerup → toggle:paused` gesture
  of its own, no `toggle:controls` gesture at all, and the `dblpointerup` set for
  fullscreen and ±10 s seeking. Both new assertions were watched red first (the player
  had no gestures of its own).
- `pnpm exec playwright test e2e/lesson-video-player.spec.ts --workers=1` on chromium,
  firefox and webkit — 29 passed, 24 skipped (the iPhone blocks run on webkit only). New:
  a tap on the video pauses and a second tap resumes under iPhone emulation; the tap still
  acts while enlarged; a click pauses on a fine pointer; no `toggle:controls` gesture is
  rendered and exactly one `toggle:paused` is. The three behaviour tests were run red
  against the previous player (production files stashed): the tap only toggled the bar.
  One pre-existing Firefox test (`wrapper is no taller than the player's own box`) failed
  once on a `null` bounding box and passed 3/3 when repeated alone — a flake, not a
  regression.

## Manual, real iOS Safari (iOS 26.5 simulator, `iphone-test`), 2026-09-10

Lesson: Basic Course › Introduction › "Introduction" (YouTube `VZVwBdAGjBE`). Taps were
driven with `cliclick` on the Simulator window and read off `screencapture` shots.

| Step                                                                     | Result                                                                                   |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Portrait: open lesson, tap the centre play button                        | resume overlay offered 04:05; two taps on the overlay changed nothing (it takes the tap) |
| Tap "Resume"                                                             | playing, bar auto-hidden                                                                 |
| Tap the video (upper third, away from controls)                          | **paused at 4:11**, bar visible                                                          |
| Tap the same spot again                                                  | **playing**; YouTube's own centre pause icon shows for a moment                          |
| Tap the video (pauses), tap the enlarge control, rotate to landscape     | enlarged, toolbar on screen, compact layout, scroll hint shown                           |
| Swipe up over the video                                                  | toolbar hidden, box 714 px wide, **large layout** — the reported state                  |
| Tap the centre of the video                                              | **playing** (4:44 → 4:46); YouTube's centre pause icon over the video                    |
| Tap that pause icon                                                      | **paused**; YouTube's centre play icon shows                                             |
| Tap the exit-enlarge control while paused                                | back in the page, still paused — the bar's buttons act without toggling playback         |

Before the change, the same two centre taps in the last state only hid and re-showed the
control bar (captured at the start of the session).

## Not verified

- Android or any other touch engine; the rule is not gated on a platform, so it applies
  there too, but only iPhone Safari was measured.
