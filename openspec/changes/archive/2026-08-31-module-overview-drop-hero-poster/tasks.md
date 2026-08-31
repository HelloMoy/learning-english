## 1. Remove the hero tile

- [x] 1.1 (TDD: test → impl) In `module-overview.test.tsx`, assert the header renders
      no decorative tile: the uppercased first word of the module title
      (`posterHeadline`) appears nowhere in the container, while the eyebrow's
      `Lesson NN` and the `<h1>` title still render. Query the DOM directly — the tile
      was `aria-hidden`, so role queries cannot see it either way and would pass
      against the unfixed component. Minimal impl: delete the tile `<div>` and the
      `posterHeadline` const from `module-overview.tsx`.
- [x] 1.2 (impl only — layout) Collapse the header to `flex flex-col gap-6`, dropping
      `sm:flex-row sm:items-center` (design D4). Keep `moduleNumber` (D2) and
      `THUMB_GLOW` (D3) — both still have live callers.

## 2. Regression check

- [x] 2.1 Confirm the existing `module-overview.test.tsx` cases stay green untouched:
      row ordering, `Video N` eyebrows, duration shown only for video lessons, the
      back link, the row thumbnails, and the one-link-per-row a11y case.

## 3. Verification

- [x] 3.1 Run `pnpm test:run` — all Vitest unit and component tests green.
- [x] 3.2 Run `pnpm verify` (typecheck → format:check → lint → test:run) and fix any
      failure at its root cause, per AGENTS.md § Before finishing.
- [x] 3.3 Load `/en/courses/advanced-intermediate-course/modules/1-advanced-pronunciation-course`
      and confirm the tile is gone, the header reads back link → eyebrow → title, and
      the first video row sits higher than before.
