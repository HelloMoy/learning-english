## 1. The keys, as a hook — `src/hooks/use-seek-keys/`

- [x] 1.1 (TDD: test → impl) With focus on the player, each key of `SEEK_KEYS.forward`
      reports `"forward"` and each key of `SEEK_KEYS.backward` reports `"backward"`,
      once per keydown.
- [x] 1.2 (TDD: test → impl) A repeat is reported again, as another press.
- [x] 1.3 (TDD: test → impl) The keydown is cancelled and stopped before the player's own
      listener hears it, and so is the keyup that follows.
- [x] 1.4 (TDD: test → impl) `Meta`, `Ctrl` and `Alt` leave the key alone; `Shift` does
      not. A key that is not a seek key is left alone.
- [x] 1.5 (TDD: test → impl) Focus outside the player, and focus on a text field, a menu
      item or a slider that is not the time slider, leave the key alone; focus on a
      button or on the time slider does not.
- [x] 1.6 (TDD: test → impl) `enabled: false` leaves the key alone and reports nothing.
- [x] 1.7 JSDoc the hook and `SEEK_KEYS` per `jsdoc-typescript-docs`: why capture, why
      keyup too, which focus keeps the keys.

## 2. Wiring the run — `src/components/lesson-view/lesson-video-player/`

- [x] 2.1 (TDD: test → impl) `SEEK_KEYS` is exactly the library's
      `MEDIA_KEY_SHORTCUTS.seekBackward` / `.seekForward`.
- [x] 2.2 (TDD: test → impl) With focus on the player, the right arrow asks the remote
      for one default step and the indicator shows that step forward; the left arrow
      mirrors it.
- [x] 2.3 (TDD: test → impl) A second press extends the run, the other arrow turns it
      around, and a tap on the same edge extends a run a key began.
- [x] 2.4 (TDD: test → impl) With a ten-second step stored, an arrow asks for ten
      seconds and the indicator reads ten.
- [x] 2.5 (TDD: test → impl) No seek and no indicator while the video cannot be seeked,
      while `keyDisabled` is set, and while a speed hold is active.
- [x] 2.6 (TDD: test → impl) A seek key leaves the library's `lastKeyboardAction` unset;
      a control key (mute) sets it, proving the assertion can fail.
- [x] 2.7 Refresh the JSDoc on `PlaybackGestures`, `LessonVideoPlayer`, `seek-run.ts`,
      `use-seek-step.ts`, `seek-step-menu.tsx` and `seek-feedback.tsx` where it says the
      step or the indicator is the double tap's alone.

## 3. End-to-end — `e2e/lesson-video-player.spec.ts`

- [x] 3.1 (TDD: test → impl) Desktop: with the player focused, the right arrow moves
      `currentTime` by the default step and the status reads that step, forward.
- [x] 3.2 (TDD: test → impl) Desktop: after choosing ten seconds from the gear menu, the
      right arrow moves ten seconds.
- [x] 3.3 (TDD: test → impl) Desktop: a seek key is never recorded as the library's own
      shortcut — the state its keyboard display paints from — and the mute key is. Read
      from the player's state, not off the display: that is on screen for 500 ms, and a
      poll that misses it reads as "never shown".
- [x] 3.4 (TDD: test → impl) Desktop: with focus left on the time slider by a click on
      the timeline, an arrow still seeks one step and draws the indicator.

## 4. Verify

- [x] 4.1 `pnpm verify` (typecheck, format:check, lint, test:run) passes — 3731 tests in
      409 files.
- [x] 4.2 `e2e/lesson-video-player.spec.ts` on chromium and webkit, `--workers=1`, against
      a dev server of this worktree: 76 passed, 23 skipped (the iPhone `describe`s skip
      off WebKit), 3 failed — none of them a key test, see 4.5.
- [x] 4.3 By hand, Playwright MCP, on a YouTube-sourced lesson in `es`: an arrow press
      moved 0:00 → 0:05 and drew "5 segundos" with nothing else on the frame; a press plus
      two repeats of the left arrow read "15 segundos" and the video landed on the run's
      target (clamped at 0:00); the left arrow on a focused volume slider took the volume
      from 100 % to 95 % with no seek and no indicator; `L` seeked one step forward.
      Focus on the timeline is covered by e2e 3.4 instead.
- [x] 4.4 `openspec validate seek-keys-follow-seek-step --strict`.

## 5. Found on the way

- [x] 5.1 Every `page.getByRole("status")` in `e2e/lesson-video-player.spec.ts` had
      stopped resolving: `TicketToast` mounts a page-wide `role="status"` region for a
      signed-in learner, so the query answered with two elements and the indicator
      assertions failed in strict mode — the existing double-click and hold cases
      included, 31 in all. CI never saw it, because every one of them sits behind
      `skipOnCi("youtube")`. The spec now asks through `playerStatus(page)`, scoped to
      the player.

**Left alone, for its own change:** "the wrapper is no taller than the player's own box"
and "the frame is oversized" read `embedFrame.boundingBox()` right after the frame is
attached and intermittently get `null`. They passed in one full run and failed in the
next, before any key or pointer is involved.
