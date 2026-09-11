## 1. Retire the provisional change

- [x] 1.1 Run `openspec archive mobile-course-content-variants --skip-specs -y` so the record
      moves to `openspec/changes/archive/` without folding the three-way switch into
      `openspec/specs/` (design §D6). Confirm `openspec/specs/mobile-course-content-variants/`
      does **not** exist afterwards.

## 2. Re-point the drawer's tests at real copy

*(No production change in this group — it is the mock swap of design §D3, done on its own so a
failure here is attributable to the mock and not to the row.)*

- [x] 2.1 (TDD: test → test) In `outline-drawer.test.tsx`, replace the echo-the-key
      `vi.mock("next-intl")` with a real `NextIntlClientProvider` wrapping `en.json`, following
      `src/components/module-watch-progress/module-watch-progress.test.tsx`. Update the four
      existing assertions from `"title"` to `"Course outline"`. Suite must be green before and
      after this task — nothing else changes in it yet.

## 3. Move the row into the drawer

- [x] 3.1 (TDD: test → impl) Move `outline-variant-b.test.tsx`'s cases into
      `outline-drawer.test.tsx`, re-pointed at `OutlineDrawer` rather than `OutlineVariantB`
      and driving the drawer's own props (no `headline` handed in — the derivation is the code
      path under test, design §D2). They fail: the drawer still renders the `<details>`
      baseline or dispatches on the param.
- [x] 3.2 Move `outline-variant-b.tsx`'s markup into `outline-drawer.tsx` as a
      `MobileOutlineDrawer` function below the exported shell (design §D1), taking the drawer's
      props and deriving the headline with `outlineHeadlineFor`. Delete `MobileOutline`,
      `DefaultOutlineDrawer`, `OUTLINE_VARIANT`, and the `nuqs` imports. Update the exported
      `OutlineDrawer`'s JSDoc: it is no longer provisional and no longer mentions a switch.
      Green.
- [x] 3.3 Move `outline-variant/outline-variant-fixture.ts` to
      `outline-drawer/outline-drawer-fixture.ts`, dropping its `headline` construction and its
      `OutlineVariantProps` import (design §D2).
- [x] 3.4 Fold `outline-variant-b.stories.tsx`'s four progress states into
      `outline-drawer.stories.tsx` alongside its existing Desktop / Mobile / LongCourse
      stories, per the `storybook-story-writing` skill.

## 4. Delete what lost

- [x] 4.1 Delete `src/components/lesson-view/outline-variant-a/`,
      `src/components/lesson-view/outline-variant-c/`, and
      `src/components/lesson-view/outline-variant/` in full.
- [x] 4.2 Delete `src/components/lesson-view/outline-variant-b/` once nothing imports it.
- [x] 4.3 Remove the `withNuqsTestingAdapter` wrapper and its `ReactElement` import from
      `lesson-view.test.tsx`, returning its ten renders to plain `render` — the switch that
      required an adapter is gone.
- [x] 4.4 Remove `progressLabel`, `viewContent`, `dockedCounter` and `dockedAriaLabel` from
      `Components.Outline` in `src/messages/{en,es,pt}.json`, keeping `title`, `positionLabel`
      and `completionAriaLabel` (design §D5). All three locales stay in step.
- [x] 4.5 Confirm `grep -ri "outline-variant\|OutlineVariant\|outline=a\|OUTLINE_VARIANT" src/ e2e/`
      returns nothing.

## 5. End-to-end

- [x] 5.1 (TDD: test → impl — the implementation exists, so each assertion must be seen to fail
      against a deliberately wrong expectation before being corrected) Rewrite
      `e2e/lesson-outline-variants.spec.ts` as `e2e/lesson-outline-drawer.spec.ts` (design §D4):
      the row renders on a phone and expands onto the current lesson; the desktop sidebar
      renders instead at desktop width; and — the new one — a URL carrying `?outline=c` renders
      the row, pinning the spec's "leftover switch parameter changes nothing" scenario. Delete
      the four switch tests.

## 6. Verification

- [x] 6.1 Run `pnpm verify` and fix any failure at its root cause — no `@ts-ignore`, no
      `eslint-disable`, no loosened config.
- [x] 6.2 Run `pnpm test:e2e` for the touched area with `PLAYWRIGHT_BASE_URL` set and
      `--workers=1`, per the project's e2e notes.
- [x] 6.3 Drive the lesson page in the browser at a mobile viewport with Playwright MCP and
      screenshot the row collapsed and expanded — confirming the promotion did not change what
      was approved. Never hand the visual check back to the user.
- [x] 6.4 Report what the promotion removed. **Note:** the "net deletion" this task assumed is
      not measurable as written — the provisional change was never committed, so `git diff`
      compares against `main`, which predates both changes and therefore shows the whole
      feature as an addition. What is measurable and was verified: **12 files deleted**
      (variants A, B and C with their tests and stories, the shared contract, and the old e2e
      spec), **36 tests removed** (1579 → 1543), and four message keys dropped from each of
      three locales. Against `main` the feature is net-positive, as a new feature is.
