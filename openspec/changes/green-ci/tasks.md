## 1. Diagnose

- [x] 1.1 Establish why unknown paths answer 200: measured by removing `[locale]/loading.tsx`, rebuilding, and watching `/es/error` turn from 200 into 404. Confirmed against the Next.js docs on streaming and status codes.
- [x] 1.2 Confirm the response already carries `<meta name="robots" content="noindex">`, so the soft 404 was a contract problem rather than an indexing one.
- [x] 1.3 Establish the real failure count: 4 tests after retries, not the 79 that raw log lines suggested — the rest were retries and repeated annotations.

## 2. A real 404, before the response streams

- [x] 2.1 (TDD: test → impl) `known-route-segments.test.ts`: the literal segment list matches the directories under `src/app/[locale]`, hoisting route groups and skipping dynamic segments.
- [x] 2.2 (TDD: test → impl) Same file: known paths, deep course paths and the home are known; unknown first segments are not.
- [x] 2.3 Create `missing-page.ts`, which rewrites to the same URL with `status: 404`, and chain it in `proxy.ts` after `sessionGate` and before `localize`.
- [x] 2.4 Verify against a **production build** that `/es/error` and `/en/privacyy` answer 404 while still rendering the localized page, and that real routes and personal routes are untouched.
- [x] 2.5 Run `e2e/not-found-routes.spec.ts` against that build: 5/5.

## 3. A job that fits its budget

- [x] 3.1 Shard the e2e job across a matrix, keeping `workers: 1` and per-shard services.
- [x] 3.2 Skipped the one whose cause is confirmed (`lesson-video-player` → `startPlayback`). Left `watch-progress:81` alone on purpose: its dependence on playback is unproven, and the sharded run will be the first to reach its own summary and say. Guessing at a skip is how coverage disappears quietly.

## 4. Verification

- [ ] 4.1 Run `pnpm verify`.
- [ ] 4.2 Open the PR and confirm from the run that both jobs are green — the first time the workflow has passed.
- [ ] 4.3 If a shard still overruns, raise the shard count rather than the time limit, and record the measured suite length.
