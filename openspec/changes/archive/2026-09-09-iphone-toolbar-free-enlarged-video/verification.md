# Verification notes

## Automated

- `pnpm test:run` — unit + component green, including:
  - `use-enlarged-video.test.ts` — entering the mode leaves `body` overflow untouched;
    a pre-existing overflow value is left alone; the page's scroll offset at entry is
    restored on exit and on the control's own toggle-off; not restored when the mode was
    never entered, nor on unmount mid-mode.
  - `use-browser-chrome-visible.test.ts` — the truth table (coarse pointer + landscape +
    `innerHeight < min(screen)`), each condition off, reactivity on `resize`, and the
    `false` server snapshot.
  - `swipe-up-hint.test.tsx` — localized message under `role="status"`, localized dismiss
    label, dismissal removes it, wrapper `pointer-events-none` / dismiss `pointer-events-auto`.
  - `lesson-video-player.test.tsx` — no hint while the video is in the page.
- `pnpm test:e2e e2e/lesson-video-player.spec.ts` on chromium, firefox and webkit —
  22 passed, 20 skipped (the iPhone-only blocks run on webkit). Covers: enlarging keeps
  the document scrollable (`body` has no `overflow:hidden`, `scrollBy` moves `scrollY`);
  leaving the mode restores the entry offset; and, under emulated iPhone landscape
  (viewport 874×292, `contextOptions.screen` 402×874), the hint appears on enlarge,
  disappears after the viewport grows to 402, and can be dismissed.
- Storybook `LessonView/SwipeUpHint` reviewed with Playwright MCP in `en`, `es`, `pt` —
  the pill renders the right copy in each locale.

## Manual, real iOS Safari (iOS 26.5 simulator, `iphone-test`, UA reports OS 18_7)

The YouTube embed would not reliably start playback under scripted blind taps, so the
Vidstack **enlarge control** could not be driven from a shell script to reach the mode on
the device. That wiring (enlarge → hint) is covered by the webkit e2e above, which runs
the same engine. What is device-specific — whether `useBrowserChromeVisible` reads the
real Safari chrome correctly, and whether a real swipe hides the toolbar with the scroll
lock gone — was confirmed directly with a lab page evaluating the hook's exact condition:

| State (landscape)                | Safari toolbar | `inner` | condition            | result                 |
| -------------------------------- | -------------- | ------- | -------------------- | ---------------------- |
| Just rotated, toolbar up         | visible        | 874×292 | `coarse ∧ landscape ∧ 292<402` | **chromeVisible=true**  |
| After a real upward swipe        | hidden         | 874×402 | `... ∧ 402<402`      | **chromeVisible=false** |

The swipe raised `scrollY` to 153 and grew `innerHeight` from 292 to 402 — i.e. the real
Safari toolbar hid on the gesture, which is exactly what the removed `body` scroll lock
now permits during the enlarged mode. `(pointer: coarse)` is `true` on the device;
`document.fullscreenEnabled` and `screen.orientation.lock` remain `undefined`, confirming
no programmatic path exists.

**Conclusion:** the hint shows precisely while Safari's toolbar is on screen in landscape
and clears itself the instant a swipe reclaims the full height, on the real engine; the
enlarge→hint wiring is proven on the same engine under emulation.
