## 1. The flow gains its fifth tap

- [x] 1.1 (TDD: test → impl) In `install-steps.test.ts`, change the "four taps" expectation to
      the five iOS requires, with `stepViewMore` / `iosViewMore` / `share-sheet-collapsed`
      sitting between Share and Add to Home Screen. Rename the test to say five. Watch it fail.
- [x] 1.2 (TDD: impl) Add `"share-sheet-collapsed"` to `InstallStepSurface` and the fifth entry
      to `INSTALL_STEPS`, in order. Update the JSDoc on both — it currently says "four taps
      beginning at «···»" and explains *why* from the recording, so it must now explain the
      collapsed sheet. Green.
- [x] 1.3 (TDD: test → impl) The existing "every step names a distinct surface" test must still
      pass unchanged; confirm it does, and update `INSTALL_RESULT`'s "four taps" wording in its
      describe block and JSDoc.

## 2. Copy, in every locale

- [x] 2.1 (TDD: test → impl) Confirm `src/messages/messages.test.ts` fails for the new keys
      (it pins key parity across locales). If it does not, add the assertion that
      `Components.AddToHomeScreenGuide` carries `iosViewMore` and `stepViewMore` in all three.
- [x] 2.2 (TDD: impl) Add `iosViewMore` and `stepViewMore` to `src/messages/{en,es,pt}.json`.
      iOS's own labels: "View More" / "Ver más" / "Ver mais". The instruction says the sheet
      *expands*, so the learner expects the list that step 4 then names.
- [x] 2.3 (TDD: impl) Reword `stepAddToHomeScreen` in all three locales: after View More the
      list is on screen, so "scroll the list" misdescribes it. Green.

## 3. The collapsed sheet, drawn

- [x] 3.1 (TDD: test → impl) In `guide-phone-screen.test.tsx`, add the View More step to the
      `test.each` of localized targets (Spanish "Ver más"), to the pointer/tap-indication
      `test.each`, and to the sheets that rise from the bottom edge. Add the Spanish label to
      the test's `MESSAGES`. Destructure five steps, not four. Watch them fail.
- [x] 3.2 (TDD: impl) Extract the share sheet's header, app row and action row into one shared
      piece both sheets render, so the two states cannot drift. Give the action row a labelled
      View More — chevron glyph plus `iosViewMore` — with the other three circles staying
      unlabelled placeholders.
- [x] 3.3 (TDD: impl) Render `share-sheet-collapsed` as that shared piece alone, with View More
      as the pointed target and no list beneath it; render `share-sheet` as the shared piece
      plus the existing list card, View More present but unpointed. Green.
- [x] 3.4 (TDD: test → impl) Add a test that the collapsed sheet draws no list rows and the
      expanded one does, so a future edit cannot quietly merge the two states back together.
- [x] 3.5 (TDD: impl) Update `GuidePhoneScreen`'s JSDoc — it lists the surfaces it reconstructs
      and must name the collapsed sheet and why it exists.

## 4. Stories

- [x] 4.1 Destructure five steps in `guide-phone-screen.stories.tsx`, add a
      `ShareSheetCollapsed` story before `ShareSheet`, and renumber the existing stories'
      doc comments (step 3 → 4, step 4 → 5). Update the meta's "four iOS surfaces" comment.
- [x] 4.2 Check `guide-autoplay.stories.tsx` for any hardcoded count or per-step story, and
      update if present.

## 5. The guide still plays itself

- [x] 5.1 (TDD: test → impl) Check `guide-autoplay.test.tsx` for anything pinned to four —
      a frame count, an expected "of 4", a step index. Update to the five taps plus the
      result, and confirm the progress label reports the total from `INSTALL_STEPS.length`
      rather than a literal. Green.

## 6. Verify

- [x] 6.1 Run `pnpm verify` (typecheck, format, lint, `pnpm test:run`) and fix anything it
      reports.
- [x] 6.2 Drive the guide in the browser with Playwright MCP — open it from the header, step
      through with the swipe, and confirm the collapsed sheet reads as the expanded one
      minus its list, in `es` and in `en`. No e2e spec covers the guide, so this is the
      browser check.
