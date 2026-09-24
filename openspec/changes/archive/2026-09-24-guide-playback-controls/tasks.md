## 1. The hook

- [x] 1.1 `useGuidePlayback` exposes `showNext`, `showPrevious` and `showFrame(index)`, all
  wrapping at both ends, and each giving the chosen frame a full interval before the guide
  advances again. (TDD: test → impl, extending its existing suite.)
- [x] 1.2 It exposes `isPlaying`, read from `prefers-reduced-motion` through
  `useSyncExternalStore` so the value is right on the first client render and follows a viewer
  who changes the setting. (TDD: test → impl.)

## 2. The rail

- [x] 2.1 Add `Components.GuidePlaybackRail` to `src/messages/{en,es,pt}.json` — `previous`,
  `next`, `goToStep`, `goToResult`. (TDD: `messages.test.ts` fails on the missing keys first.)
- [x] 2.2 `GuidePlaybackRail` renders a previous control, one control per frame, and a next
  control, each with a localized accessible name; the frames past the tap count are named as the
  result rather than as a step. (TDD: test → impl, RTL.)
- [x] 2.3 Activating any of them moves the guide. (TDD: test → impl.)
- [x] 2.4 The control for the frame on screen carries a countdown that runs for exactly one
  interval and restarts with the frame, and is absent when the guide is not playing.
  (TDD: test → impl.)
- [x] 2.5 JSDoc on the component and its props, per `jsdoc-typescript-docs`.
- [x] 2.6 `guide-playback-rail.stories.tsx`: first frame, a middle frame, the result, and one
  with the countdown off.

## 3. The guides

- [x] 3.1 `GuideAutoplay` renders the rail in place of its dot list, and still reports "step N
  of M" counting only taps. (TDD: test → impl, extending its existing suite.)
- [x] 3.2 `SafariGuideAutoplay` does the same, for both platforms. (TDD: test → impl.)
- [x] 3.3 Confirm the gesture still works in all three, unannounced and unchanged, by the
  assertions already in those suites.

## 4. Verification

- [x] 4.1 Walk the `clean-code` checklist across every file touched.
- [x] 4.2 Run `pnpm verify` and fix every failure at its root.
- [x] 4.3 Review all three guides in the browser with Playwright MCP and on the iPad simulator:
  the controls, the countdown, the keyboard order, and the reduced-motion case.
