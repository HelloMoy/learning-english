## 1. Pure logic — where the lesson sits in its module

- [x] 1.1 (TDD: test → impl) `src/lib/lesson-position/lesson-position.test.ts` — a failing test
      for `lessonPositionInModule(lessons, currentLessonId)` returning `{ position, total }`:
      a lesson in the middle of its module, first, last, a module of one, and a lesson id absent
      from the list. Ordering comes from `sequence`, and lessons of other modules are excluded.
      Faker for ids and titles; hardcode only the sequences the assertion turns on.
- [x] 1.2 Implement `src/lib/lesson-position/lesson-position.ts` — pure, no React, JSDoc per
      `jsdoc-typescript-docs` (summary, `@param`, `@returns`, `@example`). Green.

## 2. Pure logic — course-level completion

- [x] 2.1 (TDD: test → impl) `src/hooks/use-course-watch-progress/use-course-watch-progress.test.ts`
      — a failing `renderHook` test over seeded `localStorage`, mirroring
      `use-module-watch-progress.test.ts`. Cases: nothing completed; lessons marked complete;
      a lesson watched past `countsAsComplete`'s threshold but unmarked; a reading lesson counted
      by its mark alone (no runtime); an empty course; and the per-module breakdown Variant A
      needs.
- [x] 2.2 Implement `src/hooks/use-course-watch-progress/use-course-watch-progress.ts` returning
      `{ completedCount, lessonCount, completedFraction, byModule }`. It maps each lesson to the
      `countsAsComplete` input (`kind === "video" ? durationSeconds : 0`) and MUST NOT
      re-implement the completion rule (design §D3). Green.

## 3. Copy

- [x] 3.1 Add the new keys under `Components.Outline` in `src/messages/en.json`, `es.json` and
      `pt.json` — `positionLabel`, `dockedPositionLabel`, `viewContent`, `completionAriaLabel`,
      `expandAriaLabel` — as ICU messages with `{module}`, `{position}`, `{total}`, `{percent}`
      interpolated, never concatenated (design §D8). All three locales in the same commit; no key
      left untranslated.

## 4. Variant A — progress card (TDD: test → impl per component)

- [x] 4.1 (TDD: test → impl) `src/components/lesson-view/outline-variant-a/outline-variant-a.test.tsx`
      — failing tests: collapsed on arrival; `aria-expanded` flips under `user-event`; the
      outline's lesson rows appear once expanded; "Course content" is named once (the `Outline`
      gets `showHeading={false}`); the segmented meter draws one segment per module and exposes a
      single progress role with a localized accessible name, not one per segment; the percentage
      is absent on the first render and present after hydration, while the track renders in both.
- [x] 4.2 Implement `outline-variant-a.tsx` — card above the breadcrumb, `<details>` disclosure
      (design §D6), `useIsHydrated` gating the fill and the percentage (§D5), `useScrollCurrentIntoView`
      on open. Numbers through `next-intl`'s `format.number`. JSDoc on the component and its props.
      Green.
- [x] 4.3 `outline-variant-a.stories.tsx`, titled `LessonView/OutlineVariantA`, at a mobile
      viewport: collapsed, expanded, no-progress, part-way-through. Copy from `Stories.*` in
      `.storybook/messages/`; never `vi.mock("next-intl")`.

## 5. Variant B — compact row (TDD: test → impl per component)

- [x] 5.1 (TDD: test → impl) `outline-variant-b.test.tsx` — failing tests: exactly one focusable
      control in the card, spanning the row (the tile and the chevron are not separately
      focusable); activating it expands the outline; the chevron is `aria-hidden` and state is
      carried by `aria-expanded` alone; the bottom-edge meter is filled to the same fraction
      Variant A reports for the same seeded storage; hydration gating as in 4.1.
- [x] 5.2 Implement `outline-variant-b.tsx` — single-row `<details>`/`<summary>` card, gold icon
      tile (`lucide-react`), title, `Module · Lesson N of M` subtitle, chevron, edge meter. JSDoc.
      Green.
- [x] 5.3 `outline-variant-b.stories.tsx`, titled `LessonView/OutlineVariantB`, same four states.

## 6. Variant C — docked bottom sheet (TDD: test → impl per component)

- [x] 6.1 (TDD: test → impl) `outline-variant-c.test.tsx` — failing tests: renders no card above
      the breadcrumb; the bar is the course-content control; tapping expands the sheet and tapping
      again collapses it; Escape collapses it and returns focus to the bar; the grab handle is
      decorative (`aria-hidden`, not focusable); the page reserves the bar's height at the end of
      its content.
- [x] 6.2 Implement `outline-variant-c.tsx` — a `position: fixed` bar plus a conditionally
      rendered sheet, **not** the `Dialog` primitive (design §D6): no focus trap, no body-scroll
      lock, the player stays visible behind it. `aria-expanded` on the button, hand-written Escape
      handler, safe-area inset on the bar's inner padding and the reserved height published as a
      CSS custom property (§D7). JSDoc. Green.
- [x] 6.3 `outline-variant-c.stories.tsx`, titled `LessonView/OutlineVariantC`, same four states.

## 7. The switch

- [x] 7.1 (TDD: test → impl) Extend `outline-drawer.test.tsx` with failing tests for the dispatch,
      driving `nuqs` through `NuqsTestingAdapter` rather than mocking it: `?outline=a|b|c` each
      render their variant; no param, `?outline=`, and `?outline=z` each render the `<details>`
      baseline unchanged; the desktop `<aside>` branch renders identically for every param value.
- [x] 7.2 Implement the dispatch in `outline-drawer.tsx` — `parseAsStringLiteral(["a","b","c"])`
      declared at module scope, read with `useQueryState("outline", …)`, `shallow` left at its
      default so flipping variants does not remount the player (design §D1). The `<aside>` branch
      does not consult the param. Update the component's JSDoc to say the mobile branch is
      provisional and which change removes it. Green.

## 8. End-to-end

- [x] 8.1 (TDD: test → impl — the implementation already exists, so these must fail first against
      a deliberately wrong selector before being corrected) `e2e/lesson-outline-variants.spec.ts`,
      mirroring `e2e/lesson-video-player.spec.ts`: at a mobile viewport, one spec per variant
      asserting it renders, expands, and shows the current lesson's row; one asserting the
      unswitched page renders the `<details>` baseline; and one asserting Variant C's page shows
      its last content above the docked bar.

## 9. Verification

- [x] 9.1 Run `pnpm verify` (typecheck, format:check, lint, test:run) and fix any failure at its
      root cause — no `@ts-ignore`, no `eslint-disable`, no loosened config.
- [x] 9.2 Run `pnpm test:e2e` for the touched area with `PLAYWRIGHT_BASE_URL` set and
      `--workers=1`, per the project's e2e notes.
- [x] 9.3 Drive all three variants in the browser with Playwright MCP at a mobile viewport and
      screenshot each — never hand the visual check back to the user.
- [x] 9.4 Hand the user the three URLs to validate on the real iPhone over `localhost`, and record
      their answers to the three Open Questions in `design.md` (module-scoped vs course-scoped
      count; lessons vs seconds for the percentage; locale switch mid-comparison).
