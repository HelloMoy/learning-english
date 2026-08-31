## 1. The toggle's state machine

- [x] 1.1 (TDD: test → impl) Rewrite the cycle cases in `src/components/theme-toggle/theme-toggle.test.tsx`: clicking while `dark` calls `setTheme("light")`, clicking while `light` calls `setTheme("dark")`. These replace the three existing `light → dark`, `dark → system`, `system → light` tests. Keep the file's existing mock setup (`useTheme` and `useIsHydrated` stubbed directly).
- [x] 1.2 (TDD: test → impl) Add the guard that the third state is gone, not merely unreachable: from either state, `setTheme` is never called with `"system"`.
- [x] 1.3 (TDD: test → impl) Add the D2 migration case: given `theme: "system"`, the button reports dark and clicking it calls `setTheme("light")`. This is the seam a returning learner actually arrives through.
- [x] 1.4 Narrow the existing `faker` fuzz test's pool from `["light", "dark", "system"]` to the two real themes.
- [x] 1.5 (TDD: impl after red) Update `src/components/theme-toggle/theme-toggle.tsx`: narrow `Theme` to `"light" | "dark"`, delete the `THEMES` array and the modulo cycle in favour of an explicit swap (design D3), and route the raw `useTheme()` value through a `resolveTheme` function that answers "light, or else dark" (design D2). Leave the 44×44 hit area, the `sm`-hidden theme name, the `aria-label`, and the pre-hydration placeholder exactly as they are.
- [x] 1.6 Confirm the accessible-name assertions inherited from `mobile-viewport-fit` still pass untouched — `aria-label` of `label: dark`, the theme name in the DOM, and the named placeholder. If any needed editing, that is a regression in 1.5, not a test to update.

## 2. The provider

- [x] 2.1 Update `src/app/[locale]/layout.tsx` per design D1: `defaultTheme="dark"`, `enableSystem={false}`, and an explicit `themes={["dark", "light"]}`. Keep `attribute="class"` and `disableTransitionOnChange`. No test — the layout has no test file and the behaviour it configures is proven in group 4.
- [x] 2.2 (TDD: test → impl) **Added mid-implementation — see design D2b.** Task 1.5's `resolveTheme` fixes the toggle's label but not the applied theme: measured in the app, a stored `system` leaves `<html>` with no theme class at all, so the page renders the light palette while the toggle reads "Dark". Write `src/hooks/use-legacy-theme-migration/use-legacy-theme-migration.test.tsx` covering: a stored `system` is rewritten to dark; an arbitrary stored value is too; `dark` and `light` are left untouched; `undefined` writes nothing.
- [x] 2.3 (TDD: impl after red) Implement `use-legacy-theme-migration.ts` and mount it in `src/components/global-providers.tsx` — inside `ThemeProvider` and on every route, so a learner is migrated whether or not the view shows a theme control.

## 3. Copy

- [x] 3.1 Remove the `ThemeToggle.system` key from `src/messages/en.json`, `es.json`, and `pt.json` (design D4). No new test: `src/messages/messages.test.ts` already asserts an identical key set across catalogues, so removing it from two of three fails — run it as the guard.

## 4. Visual verification

- [x] 4.1 Replace the `InSystemMode` story in `src/components/theme-toggle/theme-toggle.stories.tsx` with one that mounts `ThemeProvider` carrying a stored `system`, showing the migration landing on dark.
- [x] 4.2 Drive Storybook with Playwright MCP and confirm: one press swaps dark↔light, the label reads the right theme in both states, and the migration story lands on dark. Do not hand this check back to the user.
- [x] 4.3 Drive the running app with Playwright MCP: with `localStorage` cleared, the app opens dark on a light-mode OS; after choosing light, a reload stays light; with `localStorage` seeded to `system`, the app opens dark and one press goes to light.

## 5. Verification

- [x] 5.1 Run `pnpm test:run`, then `pnpm test:e2e` for `e2e/cinema-theme.spec.ts` (which must pass unchanged), then `pnpm verify` (typecheck, format, lint, tests). All green before the change is considered done.
