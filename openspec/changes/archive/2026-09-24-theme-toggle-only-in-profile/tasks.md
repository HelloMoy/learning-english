# Tasks: theme-toggle-only-in-profile

## 1. Header row loses the theme toggle chip

- [x] 1.1 Rewrite the `site-header.test.tsx` assertions on `header-theme-toggle` (lines asserting `hidden sm:inline-flex` and the no-profile "shows at every width" test) into absence checks: `queryByTestId("header-theme-toggle")` is null and no `switch`/`button` named `label: …` (ThemeToggle's accessible name) renders in the header, across signed-out, signed-in-no-card, and with-card states (TDD: test → impl)
- [x] 1.2 Remove the `<span data-testid="header-theme-toggle">…<ThemeToggle /></span>` block from `site-header.tsx`, the `ThemeToggle` import, and the now-dead `hasMenu`-driven visibility class if nothing else uses it; run the header unit tests green (TDD: test → impl)

## 2. Avatar menu loses the phone theme item

- [x] 2.1 Replace the three `PhoneThemeItem` tests in `site-header.test.tsx` (toggle on click, menu stays open, width-keeping) with one test: opening the avatar menu offers exactly My learning, Achievements, Profile and Sign out — no theme `menuitem` (TDD: test → impl)
- [x] 2.2 Delete `PhoneThemeItem` and the `<PhoneThemeItem />` element from `site-header.tsx`, plus the now-unused `ThemeSwitchTrack` and `useThemeChoice` imports; run the header unit tests green (TDD: test → impl)
- [x] 2.3 Sanity-check nothing else in `src/` imported the removed pieces (`grep` for `PhoneThemeItem`; `ThemeToggle`/`ThemeSwitchTrack` remain used by profile-view and stories) and update the `SiteHeader` JSDoc that mentions the theme chips/menu item

## 3. E2E: header contract at phone widths

- [x] 3.1 Update `e2e/mobile-viewport.spec.ts`: drop the theme control from `headerControls` (visitor block) and from its comments; in the learner-card block, replace the `header-theme-toggle` hidden expectation with an assertion that the banner contains no theme control and the avatar menu no theme item; keep the 320px fit/overflow and locale-control assertions (TDD: test → impl — the spec update lands with the impl already green from tasks 1–2, so run it to confirm)

## 4. Verification

- [x] 4.1 Run `pnpm verify` (typecheck, format:check, lint, test:run) and fix any failure
- [x] 4.2 Run the touched e2e area: `pnpm test:e2e -- mobile-viewport.spec.ts` (use `PLAYWRIGHT_BASE_URL` per this machine's setup; port 3000 is taken by Docker)
- [x] 4.3 Verify in the browser with Playwright MCP: no theme control in the header on home/learning at desktop and 320px, no theme item in the avatar menu, and the Profile page's Preferences toggle still switches the theme
