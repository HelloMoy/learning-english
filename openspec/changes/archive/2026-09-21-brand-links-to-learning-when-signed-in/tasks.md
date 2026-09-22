## 1. Header wordmark destination

- [x] 1.1 (TDD: test → impl) In `src/components/site-header/site-header.test.tsx`, add a failing test
      asserting that with `signedIn` the wordmark link's `href` is `/learning`; then make it pass by
      passing a session-derived `href` to `<Brand />` in `src/components/site-header/site-header.tsx`.
- [x] 1.2 (TDD: test → impl) Add a failing test asserting that without a session the wordmark link's
      `href` is `/`; confirm the implementation from 1.1 covers it, and adjust it if it does not.
- [x] 1.3 (TDD: test → impl) Add a failing test asserting that with a session but no learner card
      (`useLearnerProfile` returning `absent`) the wordmark still links to `/learning`, so the
      destination follows the session rather than the profile.

## 2. Documentation

- [x] 2.1 Update the JSDoc on `Brand` so it no longer claims the wordmark "links home": the
      destination is the caller's choice and defaults to the locale home.

## 3. Verification

- [x] 3.1 Run `pnpm test:run` and confirm the site-header and brand suites pass.
- [x] 3.2 Run `pnpm verify` (typecheck, format, lint, tests) and fix any failure.
- [x] 3.3 Check both states in the running app with Playwright MCP under `es`: signed out, the
      wordmark goes to `/es/`; signed in, it goes to `/es/learning`.
