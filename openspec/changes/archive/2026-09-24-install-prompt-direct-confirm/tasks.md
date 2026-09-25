## 1. Copy and types

- [x] 1.1 Add the `Components.InstallPrompt` namespace to `src/messages/en.json`, `es.json` and
  `pt.json` — shared `dialogTitle` and `dismiss`, plus `handheld.{title,body,confirm}` and
  `desktop.{title,body,confirm}`. Extend the header control's `openGuide` sibling with an
  `openPrompt` name so the chip can describe what it opens. (TDD: `src/messages/messages.test.ts`
  fails on the missing keys first, then the files are filled.)
- [x] 1.2 Declare the `BeforeInstallPromptEvent` type in the hook's own folder and nowhere else.
  (No test: a type alias with no runtime behaviour.)

## 2. The install-prompt hook

- [x] 2.1 `useInstallPrompt` captures `beforeinstallprompt`, calls `preventDefault()` and reports
  the offer as available. (TDD: test → impl, `renderHook` + a dispatched fake event, mirroring the
  `vi.stubGlobal` shape in `use-can-install-to-home-screen.test.ts`.)
- [x] 2.2 `promptInstall` calls the retained event's `prompt()` with nothing awaited before it,
  and the offer then reports unavailable. (TDD: test → impl.)
- [x] 2.3 The offer clears on `appinstalled` and is never available in standalone display mode.
  (TDD: test → impl.)
- [x] 2.4 The offer is unavailable before hydration commits. (TDD: test → impl, `useIsHydrated`
  mocked as the sibling hook's test does.)

## 3. The service worker

- [x] 3.1 Write `public/sw.js`: claim clients on activate, and a `fetch` listener that adds no
  `respondWith`. A comment states why it exists and why it must never cache. (No unit test —
  a static asset with no import graph; its effect is covered by 3.2.)
- [x] 3.2 `useServiceWorkerRegistration` registers it once after load, unawaited, and swallows a
  rejection without throwing. (TDD: test → impl, `navigator.serviceWorker` stubbed.)
- [x] 3.3 Mount the hook from `GlobalProviders`. (TDD: test → impl, asserting registration is
  attempted when the providers render.)

## 4. Path resolution

- [x] 4.1 `useInstallPath` returns `"guide" | "prompt" | "none"` from `useCanInstallToHomeScreen`
  and `useInstallPrompt`, preferring `"prompt"` when both hold. (TDD: test → impl, both source
  hooks mocked.)
- [x] 4.2 Leave `useCanInstallToHomeScreen` and its spec untouched; confirm its suite still
  passes unchanged.

## 5. The modal

- [x] 5.1 `InstallPromptModal` renders the identity row, the body sentence and the two controls,
  reading copy from `Components.InstallPrompt`. (TDD: test → impl, RTL, mirroring
  `add-to-home-screen-modal.test.tsx`.)
- [x] 5.2 It picks the handheld or desktop sub-namespace from `(pointer: coarse)`, and no desktop
  string mentions a home screen. (TDD: test → impl.)
- [x] 5.3 Confirming calls `promptInstall` and closes; dismissing closes and records nothing.
  (TDD: test → impl.)
- [x] 5.4 JSDoc on the component and its props, per `jsdoc-typescript-docs`.
- [x] 5.5 `install-prompt-modal.stories.tsx` with a handheld and a desktop story, rendering the
  panel directly rather than through `NiceModal`. (No test: stories are the artifact.)

## 6. Wiring the header

- [x] 6.1 `InstallAppButton` opens `InstallPromptModal` where the path is `"prompt"` and
  `AddToHomeScreenModal` where it is `"guide"`, and carries the matching accessible name.
  (TDD: test → impl, extending `install-app-button.test.tsx` with the `vi.spyOn(NiceModal, "show")`
  assertion it already uses.)
- [x] 6.2 `SiteHeader` renders the chip whenever the path is not `"none"`. (TDD: test → impl,
  extending `site-header.test.tsx`, including the case of a desktop browser that never fired the
  event rendering no chip.)

## 7. Verification

- [x] 7.1 Apply the `clean-code` checklist across every file touched: function size, one thing per
  function, intention-revealing names, argument count, comments replaced by clearer code.
- [x] 7.2 Run `pnpm verify` (typecheck, format:check, lint, test:run) and fix every failure at its
  root rather than by loosening a check.
- [x] 7.3 Verify by hand in the browser with Playwright MCP: the chip appears on a Chromium
  profile that fires the event, the modal shows the desktop wording, and confirming reaches
  Chrome's own dialog. No Playwright e2e spec is added — see the design's testing strategy.
