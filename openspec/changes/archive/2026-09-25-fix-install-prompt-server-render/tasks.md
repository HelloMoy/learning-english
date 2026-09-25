## 1. Server-safe stash

- [x] 1.1 In a new `src/hooks/use-install-prompt/use-install-prompt.server.test.tsx` (`// @vitest-environment node`), assert that `takeStashedOffer()` returns `null` when there is no `window`; confirm it fails with `ReferenceError` (TDD: test → impl)
- [x] 1.2 In the same file, server-render a component that calls `useInstallPrompt` with `renderToString` and assert that it does not throw and reports no offer; confirm it fails for the same reason (TDD: test → impl)
- [x] 1.3 Make `takeStashedOffer` return `null` when `window` is undefined, and document why in its JSDoc; confirm both tests pass (TDD: test → impl)

## 2. Browser behaviour unchanged

- [x] 2.1 Run `install-offer-stash.test.ts` and `use-install-prompt.test.ts` unchanged and confirm they stay green (TDD: existing tests are the guard)

## 3. Verification

- [x] 3.1 Run `pnpm verify`
- [x] 3.2 Run `next build && next start` locally and confirm that `/en`, `/es`, `/en/sign-in` and `/en/privacy` answer 200
- [x] 3.3 Run `pnpm test:e2e --project=chromium` against the production build and confirm no regression
