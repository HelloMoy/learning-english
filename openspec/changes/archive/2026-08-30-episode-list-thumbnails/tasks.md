## 1. Fixtures

- [x] 1.1 (no TDD — test data only) In `module-overview.test.tsx`, extend the fixtures so
      one lesson carries a `poster` and one video lesson deliberately omits it. The real
      course cannot cover the fallback — all 107 seed lessons have artwork (design
      § Fixture note) — so without this the no-poster path stays untested.

## 2. Render the poster

- [x] 2.1 (TDD: test → impl) A row for a lesson with a `poster` renders an `<img>` whose
      `src` is that poster path. Assert through the DOM
      (`container.querySelector("img")`), not `getByRole("img")` — per design D1 the tile
      is hidden from the accessibility tree, so the role query cannot see it. Minimal
      impl: render `next/image` with `fill`, `sizes="96px"`, `object-cover` and `alt=""`
      inside the existing tile, keeping `THUMB_GLOW` as the background behind it (D2/D3).
- [x] 2.2 (TDD: test → impl) A row for a lesson with no `poster` renders no `<img>` and
      still shows the decorative `PlayButton`. Minimal impl: narrow with
      `lesson.kind === "video" ? lesson.poster : undefined` and branch on it (D3).

## 3. Make the thumbnail navigate

- [x] 3.1 (TDD: test → impl) The thumbnail is a link whose `href` equals that row's
      "Open" href. Assert the two agree rather than hardcoding the path twice, so the
      test fails if they ever diverge. Minimal impl: wrap the tile in the locale-aware
      `Link` from `@/i18n/navigation` (never `next/link` — AGENTS.md § i18n).
- [x] 3.2 (TDD: test → impl) That link carries `aria-hidden="true"` and `tabIndex="-1"`
      (design D1).
- [x] 3.3 (TDD: test → impl) Each row still exposes exactly one link by accessible name:
      `getAllByRole("link")` within a row returns only the "Open" action. This is the
      test that would catch the duplicate-link regression D1 exists to prevent — it must
      fail if `aria-hidden` is dropped.

## 4. Stories

- [x] 4.1 (impl only — stories) Extend `module-overview.stories.tsx` with a story whose
      lessons mix posters and a no-poster lesson, so both branches are reviewable side by
      side. Use a real seed-shaped poster path so the image resolves in Storybook. Do not
      mock `next-intl` (AGENTS.md § Storybook).
- [x] 4.2 Review the story at `en`, `es` and `pt` and confirm the a11y addon reports no
      new violations — specifically no "links with the same name serve different purposes"
      or duplicate-link findings, which is what D1 guards against.

## 5. Regression check

- [x] 5.1 Confirm the existing `module-overview.test.tsx` cases stay green untouched:
      row ordering, "Episode N" eyebrows, duration shown only for video, and the back
      link.
- [x] 5.2 Confirm `poster-card.test.tsx` is untouched and green — `PosterCard` is the
      precedent this change borrows from, not something it modifies.

## 6. Verification

- [x] 6.1 Run `pnpm test:run` — all Vitest unit and component tests green.
- [x] 6.2 Run `pnpm verify` (typecheck → format:check → lint → test:run) and fix any
      failure at its root cause, per AGENTS.md § Before finishing.
- [x] 6.3 Load a module overview in the browser and confirm both reported symptoms are
      gone: each row shows its own artwork instead of ten identical gradients, and
      clicking a thumbnail opens that lesson. Check a module whose lessons are many
      (e.g. `8-everyday-english-phrases-part-2-master-them`) so the thumbnails are
      genuinely distinguishable.
- [x] 6.4 In the browser, tab through one module's episode rows and confirm the count of
      tab stops matches the number of lessons — one per row, not two. This is the
      real-world check for D1 that no unit test fully replaces.
