## 0. Ground truth before building on it

- [x] 0.1 Confirm in a real browser (Playwright MCP, dev server) that the player's gear
      button paints and its settings menu opens for **both** a hosted-MP4 lesson and a
      YouTube-sourced lesson, in the page and with the video enlarged. Record which
      submenus the library shows in each case. If the gear does not paint for a
      YouTube lesson, stop and revisit design D5 before writing any code.

## 1. The step's vocabulary (pure) — `src/lib/seek-run/seek-run.ts`

- [x] 1.1 (TDD: test → impl) `SEEK_STEP_OPTIONS_SECONDS` is exactly `[3, 5, 10]`, ascending,
      and `DEFAULT_SEEK_STEP_SECONDS` is `5` — one of them, but not the first.
- [x] 1.2 (TDD: test → impl) `parseSeekStepSeconds` returns the stored option for each of
      `"3"`, `"5"` and `"10"`, and the default for `null`, `""`, `"abc"`, `"7"`, `"20"`, `"NaN"`,
      `"-5"` and `"5.5"` — without throwing.
- [x] 1.3 (TDD: test → impl) `SeekRun` carries `stepSeconds`; `startSeekRun` takes it,
      `seekRunSeconds` returns `steps * stepSeconds`, and `seekRunTarget` follows.
- [x] 1.4 (TDD: test → impl) `extendSeekRun` on the same side keeps the run's own
      `stepSeconds`; on the opposite side it starts a new run at the step passed in,
      anchored at the old run's target.
- [x] 1.5 Delete `SEEK_STEP_SECONDS` and update its JSDoc-era wording; update the
      existing `seek-run.test.ts` case that asserted the constant was ten.

## 2. The stored preference — `src/hooks/use-seek-step/`

- [x] 2.1 (TDD: test → impl) The hook reports `DEFAULT_SEEK_STEP_SECONDS` when nothing is
      stored, and the stored option when one is, reading from an injectable `Storage`
      seam (no global monkey-patching) under the key `learning-english:seek-step`.
- [x] 2.2 (TDD: test → impl) Choosing an option writes it and every mounted consumer
      re-reads the new value in the same tick.
- [x] 2.3 (TDD: test → impl) A `storage` event from another tab updates the value.
- [x] 2.4 (TDD: test → impl) An absent `localStorage`, a read that throws and a write that
      throws all leave the hook reporting the default and never propagate the error.
- [x] 2.5 (TDD: test → impl) A corrupt or out-of-set stored value resolves to the default
      via `parseSeekStepSeconds`.
- [x] 2.6 Server snapshot: the hook's `getServerSnapshot` is the default, proved by a
      `renderToString` + `hydrateRoot` test that asserts no recoverable error and then the
      stored value being adopted. The hydration nudge design D3 planned was written and
      then deleted — React 19 adopts the client snapshot on its own, and the test passes
      without it.

## 3. The run takes the step — `src/hooks/use-seek-run/`

- [x] 3.1 (TDD: test → impl) `tap(direction, currentTime, stepSeconds)` starts a run at
      the given step and returns the matching target.
- [x] 3.2 (TDD: test → impl) A same-side tap during a run ignores a changed `stepSeconds`
      and counts in the run's own step.
- [x] 3.3 (TDD: test → impl) An opposite-side tap during a run starts a new run at the
      step passed in.

## 4. The control — `src/components/lesson-view/seek-step-menu/`

- [x] 4.1 Add `Components.SeekStepMenu` to `src/messages/{en,es,pt}.json`: the setting's
      name and an ICU-plural seconds label for the options. Every locale, no English
      fallback.
- [x] 4.2 (TDD: test → impl) `SeekStepMenu` renders one radio option per entry of
      `SEEK_STEP_OPTIONS_SECONDS`, marks the one in force as selected, and reports a
      choice through `useSeekStep`.
- [x] 4.3 (TDD: test → impl) Its button shows the value in force as its hint and its label
      comes from `next-intl`, not from Vidstack's `translations` map.
- [x] 4.4 Compose it from `Menu.Root` / `Menu.Items` with `DefaultMenuButton` and
      `DefaultMenuRadioGroup`, mapping seconds to and from the radio group's `string`
      values at the component boundary only.
- [x] 4.5 JSDoc the component per `jsdoc-typescript-docs`: what it is, why it rides the
      library's menu parts, and the seconds/string boundary.
- [x] 4.6 `seek-step-menu.stories.tsx` under the `LessonView/` title prefix, with a story
      per option and the locale toolbar verified for `en`, `es` and `pt`.

## 5. Wiring the player

- [x] 5.1 `LessonVideoPlayer` mounts `SeekStepMenu` in the layout's `settingsMenuItemsEnd`
      slot, alongside the existing `afterFullscreenButton` slot. **Proved in e2e, not RTL**:
      jsdom never fires the `IntersectionObserver` the player defers loading behind, so
      `.vds-video-layout` stays empty and no slot mounts — the same reason the enlarge
      control's own assertions live in `e2e/lesson-video-player.spec.ts`. Task 6.2 is the
      proof; mocking the layout to spy on its props would break the theme test, which
      asserts against the real `.vds-video-layout`.
- [x] 5.2 (TDD: test → impl) `PlaybackGestures` reads `useSeekStep` and passes the step to
      `tap`; the two `Gesture` actions spell the step in force, not a constant.
- [x] 5.3 (TDD: test → impl) With a ten-second step stored, a double tap on the right
      edge asks the remote for ten seconds and the indicator reads "10 seconds" —
      extending the existing gesture harness in `lesson-video-player.test.tsx`.
- [x] 5.4 Update `seek-feedback.stories.tsx` to the default step; the indicator component
      itself needs no change.
- [x] 5.5 Refresh the JSDoc on `PlaybackGestures` and `LessonVideoPlayer` where it states
      the step is ten seconds.

## 6. End-to-end

- [x] 6.1 (TDD: test → impl) Rewrite the existing `e2e/lesson-video-player.spec.ts`
      assertions from `SEEK_STEP_SECONDS` to `DEFAULT_SEEK_STEP_SECONDS`.
- [x] 6.2 (TDD: test → impl) Desktop: open the gear menu, choose ten seconds,
      double-click the right edge, assert the status text and that `currentTime` moved
      ten seconds.
- [x] 6.3 (TDD: test → impl) Persistence: after choosing ten seconds, a reload shows ten
      selected, and opening a different lesson shows ten there too.
- [x] 6.4 (TDD: test → impl) iPhone emulation `describe`: the setting is reachable from the
      small layout's settings menu and a chosen step governs the double tap.

## 6b. The stylesheet stops spelling the step

- [x] 6b.1 `lesson-video-player.css` sized the two edge regions with
      `.vds-gesture[action="seek:10"]`, so a chosen step of 5 left them full-width at
      `z-index: 0` and the double tap stopped seeking entirely. Found by the existing e2e
      test going red. The regions now carry `SEEK_ZONE_CLASS` and the stylesheet selects
      on that; the component test harness finds them the same way.

## 7. Verify

- [x] 7.1 `pnpm verify` (typecheck, format:check, lint, test:run) passes with no new
      warnings — 1423 tests.
- [x] 7.2 `pnpm test:e2e e2e/lesson-video-player.spec.ts --project=chromium
      --project=webkit --workers=1` — 42 passed, 18 skipped (the iPhone `describe` skips
      off WebKit).
- [x] 7.3 Manual pass in the desktop browser via Playwright MCP: the gear lists Seek step
      beside Speed and Accessibility with 5 checked on a fresh profile; choosing 3 stores
      `"3"`, leaves the edge region at 20% width and `z-index: 1` with `action="seek:3"`,
      and a double click on the right edge draws "3 seconds" with a forward direction.
- [x] 7.4 Manual pass on the iOS simulator (iPhone, iOS 26.5, Safari, `localhost`): the
      gear paints in the small layout, opens the settings sheet with **Seek step** listed
      beside Speed and Accessibility, and its submenu shows 3 / 5 / 10 seconds with the
      one in force checked. Screenshots in the session scratchpad.
      **What this pass did not capture:** a successful option *selection* by touch. The
      simulator has no scriptable tap (no `idb`), and synthetic clicks through the
      Simulator window are unreliable on targets that small — the gear opened on some
      attempts and not others with the same coordinates. Selection by touch is covered by
      the WebKit iPhone-emulation e2e case in 7.2.
- [x] 7.5 `/opsx:verify` against this change, then report what shipped.
