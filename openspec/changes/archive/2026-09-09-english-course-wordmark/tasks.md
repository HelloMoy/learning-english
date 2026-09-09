## 1. Rename the wordmark

- [x] 1.1 (TDD: test → impl) In `src/components/brand/brand.test.tsx`, move both accessible-name matchers from `/learn.*english/i` to `/english.*course/i` and add an assertion on the rendered text `ENGLISH·COURSE`. Watch all three fail.
- [x] 1.2 (TDD: impl) In `src/components/brand/brand.tsx`, render `ENGLISH` + the gold middle dot + `COURSE`. Change nothing else — the type scale, tracking and colour tokens stay exactly as they are until 2.x proves they must move. Tests go green.

## 2. Measure the new mark and settle the mobile type scale

- [x] 2.1 (TDD: test → impl) Add a scenario to `e2e/cinema-theme.spec.ts`, parameterized over `en`/`es`/`pt`, that sets a 320px viewport and asserts the wordmark link's bounding box right edge is within the viewport width **and** that `document.scrollWidth <= document.clientWidth`. Per design D4 this asserts geometry, not `toBeVisible()`. Run it and record whether it is red or green.
- [x] 2.2 (skipped — 2.1 was green on the first run: 152.6px wide, right edge at 168.6 of 320, 151px to spare. No retune needed.) (impl, only if 2.1 is red) Retune the mobile step in `brand.tsx` in the order design D2 fixes: tracking first (`0.18em` → `0.16em` → `0.14em`), font size second (`13px` → `12px`). Stop at the first step that turns 2.1 green. Leave the `sm` and up step untouched.
- [x] 2.3 Drive the header in a real browser with Playwright MCP at 320px, 375px and desktop, in `en`/`es`/`pt`, in both dark and light. Read the wordmark's measured width at 320px and confirm the locale switcher and theme toggle are still fully on screen with 44×44 hit areas.

## 3. Update the documentation the change invalidates

- [x] 3.1 Rewrite the `Brand` JSDoc `@remarks` in `src/components/brand/brand.tsx`: replace the `LEARN·ENGLISH` / `139px` / `203px` figures with the widths measured in 2.3, and restate the tracking rationale against whatever 2.2 settled on.
- [x] 3.2 Update the `SiteHeader` JSDoc in `src/components/site-header/site-header.tsx`, which names the `LEARN·ENGLISH` wordmark in its summary.

## 4. Sweep the remaining references

- [x] 4.1 Update the existing chrome assertion in `e2e/cinema-theme.spec.ts:29` (`getByRole("link", { name: /learn.*english/i })`) to the new matcher.
- [x] 4.2 Grep the repo for `LEARN·ENGLISH`, `LEARN` and `learn.*english` and resolve every hit. `learning-english` — the package name and the `learning-english:playback:*` storage prefix — is a deliberate non-hit per design D5; leave it alone.

## 5. Verify

- [x] 5.1 Run `pnpm verify` (typecheck, format:check, lint, `pnpm test:run`) and fix anything it reports at the root cause.
- [x] 5.2 Run the touched e2e area against a dev server: `pnpm test:e2e e2e/cinema-theme.spec.ts --workers=1` with `PLAYWRIGHT_BASE_URL` set, per the project's e2e notes.
- [x] 5.3 Run `openspec validate english-course-wordmark --strict` and confirm the delta applies cleanly to `openspec/specs/cinema-home/spec.md`.
