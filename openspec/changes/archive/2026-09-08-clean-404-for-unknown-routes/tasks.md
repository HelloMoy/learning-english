## 1. Reproduce both defects

- [x] 1.1 Against the running `next start`, capture the current behaviour as the baseline the fix must change: `/manifest.json` → 404 with `⨯ Error: shareMetadata received an unsupported locale` in the server log, and `/es/error` → 404 rendering the "Locale not supported" copy. Record both so the final validation compares like with like.

## 2. The shared locale guard

- [x] 2.1 (TDD: test → impl) Create `src/i18n/require-supported-locale/require-supported-locale.test.ts`: returns the locale unchanged for `en`, `es` and `pt`; calls `notFound()` for `"manifest.json"`, `"xx"`, `""` and an arbitrary faker string; and never calls `notFound()` for a configured locale. Mock `notFound` from `next/navigation` the way the existing route tests do.
- [x] 2.2 Implement `src/i18n/require-supported-locale/require-supported-locale.ts` narrowing `string` to the locale union via `hasLocale`, with JSDoc explaining why the guard exists (design §D1–D3) and that `shareMetadata` keeps throwing on purpose.
- [x] 2.3 (TDD: test → impl) Call the guard as the first statement of `generateMetadata` in all five routes under `[locale]`: the layout, `page.tsx`, `courses/[courseSlug]/page.tsx`, `.../modules/[moduleSlug]/page.tsx` and `.../lessons/[lessonId]/page.tsx`. Extend each route's test for "an unsupported locale calls `notFound()` and builds no metadata", and add one test asserting every `generateMetadata` under `[locale]` calls the guard, so a route added later fails a test rather than only a review.

## 3. Splitting the two not-found states

- [x] 3.1 Verify design §D4's mechanism before writing copy. **Result: the premise was wrong and the design changed.** The proxy answers `/xx` with a 307 to `/en/xx`, so no request reaches the app carrying an unsupported locale; there is one state, not two. The nested boundary was removed and `[locale]/not-found.tsx` now carries the page-not-found copy.
- [x] 3.2 Replace `LocaleNotFound` with `PageNotFound.{heading,description,goHome}` in `src/messages/{en,es,pt}.json`.
- [x] 3.3 (TDD: test → impl) Rewrite `src/app/[locale]/not-found.test.tsx` for the page-not-found copy: heading, description, a home link, and that the copy names the page rather than the language.
- [x] 3.4 Rewrite `src/app/[locale]/not-found.tsx` for the page-not-found state, keeping its structure and tokens, with JSDoc recording why the locale copy was retired.

## 4. End to end, against a production build

- [x] 4.1 (TDD: test → impl) Create `e2e/not-found-routes.spec.ts`: `/manifest.json` → 404, `/es/error` → 404 with the Spanish page-not-found copy and no "Idioma no soportado", `/xx` → 404 with the locale copy, `/manifest.webmanifest` → 200.
- [x] 4.2 Run `pnpm build`, then `pnpm start` on a free port, and confirm by hand that the server log is clean for `/manifest.json` and `/cualquier.cosa` — the assertion no status code can make, and the reason the defect survived until now.

## 5. Verification

- [x] 5.1 Run `pnpm verify` (typecheck, format:check, lint, test:run) and fix every failure at its root — no `@ts-ignore`, no rule disables, no loosened config.
- [x] 5.2 Run `pnpm test:e2e e2e/not-found-routes.spec.ts --workers=1` against the production server via `PLAYWRIGHT_BASE_URL`.
- [x] 5.3 Verify both pages in the browser with Playwright MCP at `en`, `es` and `pt`, and confirm the home link on each lands on a 200 page.
