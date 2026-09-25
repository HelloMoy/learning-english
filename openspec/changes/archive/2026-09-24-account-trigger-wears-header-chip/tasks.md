# Tasks: account-trigger-wears-header-chip

## 1. The trigger becomes a chip

- [x] 1.1 Add a failing component test to `src/components/site-header/site-header.test.tsx`: the account trigger carries the header chip's treatment (rounded-square corners, border, faint fill) rather than a round frame, and keeps its `sm:hidden` breakpoint (TDD: test → impl)
- [x] 1.2 Give the `AccountMenu` trigger the install chip's class list and render `CircleUser` at the install chip's glyph size; confirm the footprint stays 44×44 so the fit budgets are untouched (TDD: test → impl)
- [x] 1.3 Confirm the tests from `compact-header-account-control` — the menu's items, the accessible name, the desktop link — pass unchanged

## 2. Verification

- [x] 2.1 Run `pnpm verify` (typecheck, format:check, lint, test:run) and fix any failure
- [x] 2.2 Screenshot the header in an iPhone Safari context at 375px with all three chips present, and confirm the account trigger reads as a sibling of the install chip
