## 1. Shared playback

- [x] 1.1 `useGuidePlayback(frameCount)` returns `{ frameIndex, swipeHandlers }`: advances on a
  per-frame timer, wraps both ends, restarts the wait when the frame changes by hand, stays
  still under `prefers-reduced-motion`, and answers a horizontal gesture either way.
  (TDD: test → impl, `renderHook`, mirroring the assertions now in `guide-autoplay.test.tsx`.)
- [x] 1.2 `GuideAutoplay` reads the hook instead of holding the rules itself. Its existing suite
  passes untouched before and after. (Refactor under green: no new test, no behaviour change.)

## 2. The steps

- [x] 2.1 `SAFARI_INSTALL_STEPS` holds the iPad's four steps and the Mac's three, each with its
  message key, target key and surface, plus a result frame per platform. (TDD: test → impl,
  mirroring `install-steps.test.ts` — asserts order, count, and that no Mac step names
  **View More**.)
- [x] 2.2 Add `Components.SafariInstallGuide` to `src/messages/{en,es,pt}.json`: a step sentence
  per step of each platform, a result sentence per platform, `macAddToDock`, `label`, `payoff`,
  `dialogTitle`, `dismiss`, `openGuideIpad`, `openGuideMac`. (TDD: `messages.test.ts` fails on
  the missing keys first — including a check that no macOS string says "home screen" in any
  locale — then the files are filled.)

## 3. Surface detection

- [x] 3.1 `useSafariInstallSurface` returns `"iphone" | "ipad" | "mac" | "none"`: Mac Safari plus
  touch points is an iPad, Mac Safari without them is a Mac, Chromium and Gecko impostors and
  the other iOS browsers are neither, standalone is `"none"`, and nothing is reported before
  hydration. (TDD: test → impl, mirroring `use-can-install-to-home-screen.test.ts`.)
- [x] 3.2 Leave `useCanInstallToHomeScreen` as it is; confirm its suite still passes unchanged.

## 4. The depiction

- [x] 4.1 `SafariWindowScreen` draws the browser window, toolbar and page for a `platform`, with
  the step's target picked out and unneeded controls as placeholders at their real positions.
  (TDD: test → impl, RTL, mirroring `guide-phone-screen.test.tsx`.)
- [x] 4.2 The share popover: anchored under the share control, page undimmed. On iPad it carries
  the site header, app row and round actions, in a collapsed state ending in **View More** with
  no list, and an expanded state that grows in place, keeps the same rows, adds the complete
  list and drops the **View More** label. (TDD: test → impl.)
- [x] 4.3 The macOS popover: one flat list, no round actions, no second state, with
  **Add to Dock** at its true position among the other rows. (TDD: test → impl.)
- [x] 4.4 The confirmations: iPad draws a light card centred over a dimmed page with its target
  at the top trailing corner and an **Open as Web App** switch shown on; macOS draws a sheet on
  the window with **Cancel** and **Add** at the bottom trailing corner and no switch.
  (TDD: test → impl.)
- [x] 4.5 The result frame: the icon on the iPad home screen, and in the macOS Dock.
  (TDD: test → impl.)
- [x] 4.6 Entry motion in CSS only — the popover scales out of the share control, the
  confirmation arrives, the target carries a repeating tap indication — so the project's
  `prefers-reduced-motion` rule neutralises all of it. (TDD: test → impl, asserting the classes
  rather than the animation.)
- [x] 4.7 The depiction is `aria-hidden` and every step reads from its text alone.
  (TDD: test → impl.)

## 5. The autoplay and the modal

- [x] 5.1 `SafariGuideAutoplay` walks its platform's frames through `useGuidePlayback`, reports
  "step N of M" counting only taps, shows the result unnumbered, draws position dots, and
  dismisses once. (TDD: test → impl, RTL, mirroring `guide-autoplay.test.tsx`.)
- [x] 5.2 It fits the viewport by scaling the depiction rather than scrolling, as the iPhone
  guide does. (TDD: test → impl, reusing `useFitScale`.)
- [x] 5.3 `SafariInstallGuideModal` takes a `platform` and shows the guide in a named dialog,
  mirroring `AddToHomeScreenModal`. (TDD: test → impl.)
- [x] 5.4 JSDoc on every new exported component, hook and type, per `jsdoc-typescript-docs`.
- [x] 5.5 Stories: `safari-window-screen.stories.tsx` and `safari-guide-autoplay.stories.tsx`,
  each with an iPad story, a macOS story and a Spanish story.

## 6. Routing

- [x] 6.1 `useInstallPath` resolves `"none" | "guide" | "ipad-guide" | "mac-guide" | "prompt"`,
  reading `useSafariInstallSurface`, with the prompt still winning. (TDD: test → impl, extending
  its existing suite.)
- [x] 6.2 `InstallAppButton` opens the right modal for each route and carries the matching
  accessible name. (TDD: test → impl, extending `install-app-button.test.tsx`.)
- [x] 6.3 `SiteHeader` renders the chip for every route but `"none"`. (TDD: test → impl,
  extending `site-header.test.tsx`.)

## 7. Verification

- [x] 7.1 Walk the `clean-code` checklist across every file touched.
- [x] 7.2 Run `pnpm verify` and fix every failure at its root.
- [x] 7.3 Review both guides in the browser with Playwright MCP against the captured frames —
  popover anchoring, dimming, the two iPad popover states, both confirmations — and correct any
  drift before calling the change done.
