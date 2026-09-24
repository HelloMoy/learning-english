## 1. Component

- [x] 1.1 Add an RTL test in `site-header.test.tsx` asserting the eyebrow text is exactly the section key with no `·` or `tagline`; confirm it fails (TDD: test → impl)
- [x] 1.2 Render `{section}` alone in `site-header.tsx` and remove the `tagline` interpolation; confirm the test passes (TDD: test → impl)

## 2. Messages

- [x] 2.1 Remove `SiteHeader.tagline` from `src/messages/en.json`, `es.json` and `pt.json` (TDD: covered by 1.1; typecheck guards unused keys)

## 3. E2E

- [x] 3.1 Update the two eyebrow assertions in `e2e/cinema-theme.spec.ts` to expect the section alone (TDD: test → impl already done in 1.2)

## 4. Verification

- [x] 4.1 Run `pnpm verify` and `pnpm test:e2e -- e2e/cinema-theme.spec.ts --project=chromium`; check the header in the browser via Playwright MCP
