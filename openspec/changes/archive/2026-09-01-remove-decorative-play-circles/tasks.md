## 1. Continue watching panel

- [x] 1.1 (TDD: test → impl) In `continue-watching.test.tsx`, add a `vi.mock` of
  `@/components/play-button/play-button` rendering a `data-testid` stand-in, and a test
  asserting the resolved panel renders no such stand-in while `continue-watching-resume`
  still renders. Run it and see it fail (the panel renders the circle today).
- [x] 1.2 (TDD: impl) In `continue-watching.tsx`, delete the `PlayButton` and its
  `hidden sm:block` wrapper, and drop the now-unused import. Test 1.1 goes green.
- [x] 1.3 (TDD: refactor, existing tests stay green) Collapse the panel's two nested divs
  into one column: merge the inner `flex min-w-0 flex-1 flex-col gap-4` into the outer
  wrapper and drop `sm:flex-row sm:items-center sm:gap-10`, which described a row that no
  longer has two children.

## 2. Module showcase card

- [x] 2.1 (TDD: test → impl) In `module-showcase-card.test.tsx`, add the same `PlayButton`
  mock and a test asserting the card renders no stand-in while `module-showcase-cta`, the
  ordinal and the count line still render. Run it and see it fail.
- [x] 2.2 (TDD: impl) In `module-showcase-card.tsx`, delete the `PlayButton` and drop the
  now-unused import. Test 2.1 goes green.
- [x] 2.3 (TDD: refactor, existing tests stay green) Remove the `flex items-center gap-4`
  wrapper that paired the CTA with the circle and add `sm:self-start` to the CTA, so it
  keeps hugging its label instead of stretching to the column in a flex column.

## 3. Verification

- [x] 3.1 Run `pnpm test:run` for the touched components and confirm every test in both
  files passes, including the pre-existing ones.
- [x] 3.2 Run `pnpm typecheck`, `pnpm lint` and `pnpm format:check`.
- [x] 3.3 Run `pnpm test:e2e e2e/course-catalog.spec.ts` to confirm the course overview
  still behaves as its spec asserts.
- [x] 3.4 Visual check with Playwright MCP against the dev server: the `Continue watching`
  panel and a module showcase card at desktop (1440px) and mobile (390px) widths — no
  circle, `View videos` hugging its label on desktop and full width on mobile.
- [x] 3.5 Run `openspec validate remove-decorative-play-circles` and `/opsx:verify`.
