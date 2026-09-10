## 1. Clear the invalidated first pass

- [x] 1.1 Delete `add-to-home-screen-guide.tsx`, `.test.tsx` and `.stories.tsx` from
      `src/components/add-to-home-screen-guide/`. They encode a three-step flow starting at a
      control iOS 26 Safari does not have.

## 2. Translations

- [x] 2.1 Rewrite `Components.AddToHomeScreenGuide` in `src/messages/{en,es,pt}.json`: the
      title, the access-framed payoff, four step instructions, the four iOS control labels
      (`iosMore`, `iosShare`, `iosAddToHomeScreen`, `iosAdd`), the confirmation screen's
      "Open as Web App" label, the dismiss label, and the stepper's next/back/progress copy.
      Each locale names the iOS controls as that locale's iOS names them.
      `src/messages/messages.test.ts` already enforces key parity across locales.

## 3. The step definition (TDD: test → impl)

- [x] 3.1 (TDD: test → impl) Failing unit test that `install-steps` exports exactly four
      steps whose message keys and surfaces are, in order, the «···» control, Share, Add to
      Home Screen and the confirmation's Add. Then create
      `src/components/add-to-home-screen-guide/install-steps/install-steps.ts`.

## 4. The mock iPhone screen (TDD: test → impl)

- [x] 4.1 (TDD: test → impl) Failing RTL test that `GuidePhoneScreen` renders the target
      control's localized label for the step it is given; then build the screen for step 1
      (Safari's bar with «···»).
- [x] 4.2 (TDD: test → impl) Failing test that the whole depiction is hidden from assistive
      technology; then mark it `aria-hidden`.
- [x] 4.3 Add the remaining three surfaces: the «···» menu with Share, the share sheet with
      Add to Home Screen, and the confirmation screen with Add and the Open as Web App toggle.
      Rows the learner does not need are unlabelled placeholders at their true position.

## 5. Variant A — the stepper (TDD: test → impl)

- [x] 5.1 (TDD: test → impl) Failing test that it opens on step 1 and does not change on its
      own; then create `guide-stepper/guide-stepper.tsx`.
- [x] 5.2 (TDD: test → impl) Failing test that it exposes the current step number and the
      total; then render the progress copy.
- [x] 5.3 (TDD: test → impl) Failing tests for advancing and going back, including that back
      is unavailable on the first step and next on the last; then wire the controls.
- [x] 5.4 (TDD: test → impl) Failing test that dismissing calls `onDismiss` exactly once and
      that no control claims to install; then add the dismiss control.

## 6. Variant B — autoplay (TDD: test → impl)

- [x] 6.1 (TDD: test → impl) Failing test with `vi.useFakeTimers` that it advances to the next
      step when its interval elapses; then create `guide-autoplay/guide-autoplay.tsx`.
- [x] 6.2 (TDD: test → impl) Failing test that it returns to the first step after the last;
      then close the loop.
- [x] 6.3 (TDD: test → impl) Failing test, with a `matchMedia` stub reporting
      `prefers-reduced-motion: reduce`, that it does not advance; then honour the preference.
- [x] 6.4 (TDD: test → impl) Failing test that dismissing calls `onDismiss` exactly once and
      that the timer is cleared on unmount; then add the dismiss control and the cleanup.

## 7. Stories and documentation

- [x] 7.1 Stories for both variants under `Components/AddToHomeScreenGuide/*`, each with
      `Default`, `InSpanish` and `InPortuguese`. Do not mock `next-intl`.
- [x] 7.2 A story per step of `GuidePhoneScreen`, so all four surfaces can be reviewed without
      waiting for a timer.
- [x] 7.3 JSDoc on `GuidePhoneScreen`, both variants, `install-steps` and their props:
      what each is, why the guide instructs rather than installs, and that pacing and
      dismissal persistence belong to the caller. `@category Components`.

## 8. Verification

- [x] 8.1 Review both variants and all four surfaces in Storybook with Playwright MCP, in
      `en`, `es` and `pt`, in the dark theme, at a phone-width viewport. Do not hand this
      check to the user.
- [x] 8.2 Run `pnpm verify` and fix any failure at its root. No `pnpm test:e2e` in this
      change — no route renders either variant yet.

## 9. Motion (TDD: test → impl)

- [x] 9.1 (TDD: test → impl) Failing test that a step's target carries both a pointer outline
      and a repeating tap indication; then add the tap indicator to all four surfaces.
- [x] 9.2 (TDD: test → impl) Failing test that a sheet surface carries the rising entry
      animation and the menu carries its pop; then add the keyframes to `src/app/globals.css`
      and the classes to the depiction. No per-component reduced-motion handling: the
      existing global `prefers-reduced-motion` block already neutralises them.
- [x] 9.3 No code needed, and no test written for it. Each step renders a structurally
      distinct surface (bar, menu, share sheet, confirmation), so React already builds fresh
      DOM on every change and the entry animations replay on their own. An explicit `key`
      would be a no-op justified by a test that could not fail. Revisit only if two steps
      ever share a surface.
- [x] 9.4 Re-verify both variants in the browser and re-run `pnpm verify`.

## 10. The result frame (TDD: test → impl)

- [x] 10.1 Add a `result` message to `src/messages/{en,es,pt}.json`.
- [x] 10.2 (TDD: test → impl) Failing test that `INSTALL_RESULT` names the `home-screen`
      surface and is not one of `INSTALL_STEPS`; then add it, leaving the four taps intact.
- [x] 10.3 (TDD: test → impl) Failing test that `GuidePhoneScreen` draws a home screen with
      the course icon for the result frame; then add that surface.
- [x] 10.4 (TDD: test → impl) Failing tests that the guide shows the result after the last
      tap, numbers it as no step, and loops back to the first tap after it; then wire it in.
- [x] 10.5 Re-verify in the browser and run `pnpm verify`.

## 11. Header trigger and modal (TDD: test → impl)

- [x] 11.1 Add the control's label and the dialog's title to `src/messages/{en,es,pt}.json`.
- [x] 11.2 (TDD: test → impl) Failing tests for `useCanInstallToHomeScreen`: true only for
      iPhone Safari that is not already standalone, false before hydration; then write the
      hook in `src/hooks/use-can-install-to-home-screen/`.
- [x] 11.3 (TDD: test → impl) Failing test that the modal renders the guide inside a named
      dialog; then create `src/components/modals/add-to-home-screen-modal/` with NiceModal
      and the `Dialog` primitive.
- [x] 11.4 (TDD: test → impl) Failing tests that the header control renders only when the
      hook says so, carries its localized name and the add-to-home-screen glyph, and opens
      the modal; then create `src/components/install-app-button/`.
- [x] 11.5 Mount the control in `SiteHeader` beside the theme chip, reserving its space so the
      header does not shift when it appears.
- [x] 11.6 Stories for the control and the modal in all three locales.
- [x] 11.7 Verify in the browser (including an iPhone user-agent) and run `pnpm verify`.

## 12. Fit and placement (from device review)

- [x] 12.1 (TDD: test → impl) Failing test that the depiction is wrapped in the fitting
      container; then add height-stepped scaling in `globals.css` so the guide fits short
      viewports without scrolling.
- [x] 12.2 (TDD: test → impl) Failing test that the install control precedes the locale and
      theme chips; then reorder `SiteHeader`.
- [x] 12.3 Verify on an iPhone-sized viewport in the browser and run `pnpm verify`.

## 13. Fit by measurement, not by breakpoints (device review, second pass)

- [x] 13.0 Finding: the `@media (max-height: …)` steps from task 12 guess at device heights
      and missed on the real phone, and `DialogContent` ships `overflow-y-auto`, so the modal
      scrolled instead of the depiction shrinking. Replaced with a measured fit.
- [x] 13.1 (TDD: test → impl) Failing tests for `useFitScale`: 1 when there is room, the
      ratio when there is not, never above 1; then write it in `src/hooks/use-fit-scale/`.
- [x] 13.2 (TDD: test → impl) Failing test that the guide is a column whose depiction area
      shrinks and clips rather than scrolling; then restructure it and drop the
      `.guide-phone-fit` breakpoints from `globals.css`.
- [x] 13.3 Make the modal clip instead of scroll, and verify at several viewport heights.
