## 1. The `DropdownMenu` primitive

- [x] 1.1 (TDD: test → impl) Write `src/components/ui/dropdown-menu/dropdown-menu.test.tsx`: content is portalled outside the render container; `menu` and `menuitemradio` roles are exposed; exactly one radio item reports `aria-checked="true"`; the trigger's `aria-expanded` flips on open; `Escape` dismisses and returns focus to the trigger. Mirror `ui/dialog/dialog.test.tsx`, including reaching portalled content through `screen` rather than the container RTL returns.
- [x] 1.2 (TDD: impl after red) Implement `src/components/ui/dropdown-menu/dropdown-menu.tsx` on the `radix-ui` unified package, exporting only the single-choice surface (`DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuPortal`, `DropdownMenuContent`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuItemIndicator`) per design D3. `data-slot` on every rendered element, project tokens not shadcn neutrals, no user-facing strings, JSDoc on each export per the TypeDoc convention.

## 2. The locale control

- [x] 2.1 (TDD: test → impl) Rewrite `src/components/locale-switcher/locale-switcher.test.tsx` for the new role (`button` + `menuitemradio`, no longer `combobox` — see design Risks): the trigger is `getByRole("button", { name: /language/i })`; opening it exposes three `menuitemradio` items with the active locale checked; choosing one calls `router.replace(pathname, { locale })`; the accessible name stays `Language: <full name>` while the visible text is the short code; keyboard operation selects and returns focus to the trigger. Keep the file's existing mock setup.
- [x] 2.2 (TDD: impl after red) Rewrite `src/components/locale-switcher/locale-switcher.tsx` on the new primitive: trigger shows `sm:hidden` short code / `hidden sm:inline` full name, `aria-label` built from the full locale label (design D4), `min-h-11 min-w-11` hit area (design D5). Short codes come from `routing.locales` uppercased, not from message files — they are ISO codes, identical in every locale.

## 3. The theme toggle

- [x] 3.1 (TDD: test → impl) Extend `src/components/theme-toggle/theme-toggle.test.tsx`: the button keeps its `Theme: <name>` accessible name while its visible theme-name text is hidden below `sm`. Cover the pre-hydration placeholder branch too, so it does not lose its name.
- [x] 3.2 (TDD: impl after red) Update `src/components/theme-toggle/theme-toggle.tsx`: theme-name text hidden below `sm`, `◐` icon retained, `min-h-11 min-w-11` for the hit area. The existing `aria-label` already carries the name — do not change it.

## 4. The header row itself

- [x] 4.1 (TDD: test → impl) Extend `src/components/site-header/site-header.test.tsx`: the header still exposes its banner landmark and mounts all three of brand, locale control, and theme toggle in the accessibility tree. Keep the file's existing mock setup (`next-intl`, `next-themes`, `@/i18n/navigation` stubbed directly) rather than standing up providers.
- [x] 4.2 (TDD: impl after red) Update `src/components/site-header/site-header.tsx` per design D1: `min-w-0` on the row's children so `flex-shrink` can engage, plus `shrink` and `overflow-hidden` on the brand side. This is the structural guarantee — overflow becomes impossible independent of content length.
- [x] 4.3 Apply the D2 mobile type scale to `src/components/brand/brand.tsx`: `text-[13px] tracking-[0.18em]` below `sm`, today's `text-[17px] tracking-[0.28em]` from `sm` up. Measured budget at 320px: 139 + 16 + 56 + 10 + 44 = 265 ≤ 288 available. No behavior change, so no new test — group 6 proves the result.

## 5. Module list titles

- [x] 5.1 (TDD: test → impl) Extend `src/components/module-overview/module-overview.test.tsx`: each row exposes its lesson title in full in the DOM, so a future change cannot shorten titles in JavaScript. Truncation stays a CSS concern.
- [x] 5.2 (TDD: impl after red) In `src/components/module-overview/module-overview.tsx:134`, change `truncate` to `sm:truncate` (design D6) so titles wrap below `sm` and keep the single-line treatment above it. Confirm the "Open" action keeps its `shrink-0` and the completion mark stays adjacent to the title.

## 6. End-to-end — the actual guarantee

- [x] 6.1 (TDD: test → impl) Create `e2e/mobile-viewport.spec.ts` following the seed-import pattern of `e2e/cinema-theme.spec.ts` (route constants from `seedContentModules` / `seedContentLessonRows`). Set viewports with `test.use({ viewport })` per describe block — do not add a Playwright project or edit `playwright.config.ts` (design D7). Assert across the six routes × `en`/`es`/`pt` × 320px and 390px that `document.documentElement.scrollWidth === clientWidth`.
- [x] 6.2 (TDD: test → impl) Add to the same spec, at 320px: the locale control and theme toggle each have a bounding box fully inside `[0, clientWidth]`, and each measures at least 44×44. Covers the `cinema-home` reachability and hit-area scenarios.
- [x] 6.3 (TDD: test → impl) Add to the same spec, at 320px: opening the locale menu and choosing another language navigates to that locale, and the menu itself does not introduce horizontal overflow while open. Covers the `cinema-home` menu scenarios against a real layout engine, which jsdom cannot provide.
- [x] 6.4 (TDD: test → impl) Add to the same spec, at 320px on the `10-the-practice-zone-sharpen-your-skills` module (whose 16 titles share the `Exercise N Pronunciation Step By Step Lesson` prefix): two adjacent rows expose different accessible names and neither is truncated. Covers the `cinema-module-overview` legibility scenarios.
- [x] 6.5 Confirm the `CinemaBackground` band is gone as a consequence rather than needing its own fix. If a full-width assertion still fails once the header is fixed, `src/components/cinema-background/cinema-background.tsx` needs its own change — report that finding before touching it, since the proposal assumes it does not.

## 7. Visual verification

- [x] 7.1 Add narrow-viewport stories to `site-header.stories.tsx`, `locale-switcher.stories.tsx`, `theme-toggle.stories.tsx`, and `module-overview.stories.tsx` (using a module with shared-prefix titles), at 320px and 390px. Add a `dropdown-menu.stories.tsx` for the new primitive, including its open state.
- [x] 7.2 Drive Storybook with Playwright MCP and confirm visually at 320px and 390px in both themes: the header fits on one line with both controls on screen, the wordmark is not clipped, the locale menu opens over the content without clipping, and module titles wrap legibly. Do not hand this check back to the user.
- [x] 7.3 Re-run the original audit with Playwright MCP against the dev server — the six routes at 320px and 390px in `en` and `es` — and confirm the measured figures from design Context (496px at 390px viewport, 484px at 320px in `/es`) are gone, along with the unpainted background band.

## 8. Verification

- [x] 8.1 Run `pnpm test:run` and `pnpm test:e2e`, then `pnpm verify` (typecheck, format, lint, tests). All green before the change is considered done.
