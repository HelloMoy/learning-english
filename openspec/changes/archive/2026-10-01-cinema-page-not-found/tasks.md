## 1. Copy

- [x] 1.1 (TDD: test → impl) `PageNotFound` gains `eyebrow`, `missingPath` (rich, with a `<requested>` tag) and `viewCourses` in `en`, `es` and `pt`; the catalogue test in `not-found.test.tsx` fails first for the missing keys

## 2. The requested path

- [x] 2.1 (TDD: test → impl) `MissingPath` (`src/app/[locale]/missing-path.tsx`, client) renders the `missingPath` sentence naming `/<locale><pathname>`, leaves a percent-encoded path encoded, and wraps and clamps a long one; JSDoc

## 3. The page

- [x] 3.1 (TDD: test → impl) `PageNotFound` renders the eyebrow above the heading, the description, the path line, the home link as the primary action and a `/courses` link as the secondary one, inside the `alert` region
- [x] 3.2 (TDD: test → impl) The page's `main` carries `id="main"` and its markup uses theme tokens only (no `slate-` class); update the file's JSDoc to describe the new state

## 4. End-to-end

- [x] 4.1 (TDD: test → impl) `e2e/not-found-routes.spec.ts`: `/es/leccion-perdida` is named on the page, an encoded path stays encoded, a very long path on a phone keeps the page's width and the actions in view, and "Ver cursos" lands on `/es/courses`
- [x] 4.2 Visual check with Playwright MCP: `/es/leccion-perdida` in dark and light, desktop and phone width, plus a very long path on a phone; no horizontal scroll, no hydration warning in the console

## 5. Verification

- [x] 5.1 Run `pnpm verify` and `pnpm test:e2e` for `not-found-routes`; all green
