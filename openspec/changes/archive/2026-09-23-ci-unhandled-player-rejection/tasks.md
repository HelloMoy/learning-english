## 1. Reproduce

- [x] 1.1 Confirm the rejection's source is `@vidstack/react`'s provider `destroy()`, not the test runner, and record the call site the facade leaks from.

## 2. Extract and guard the facade

- [x] 2.1 (TDD: test → impl) `fire-and-forget.test.ts`: a rejecting command gets a handler attached. **Two false starts here, both caught by re-introducing the defect and re-running:** (a) listening for `process.on("unhandledRejection")` passes against the defect, because Vitest installs its own handler and reports leaks only at the end of a run; (b) spying on `.catch` passes too if the fixture attaches its own safety catch first — the spy records that call. The working assertion counts handlers before and after.
- [x] 2.2 (TDD: test → impl) Same file: a `play` that rejects likewise — pinning the path that is already correct.
- [x] 2.3 (TDD: test → impl) Same file: `seekTo` writes `currentTime`, and `currentTime`/`duration` read through the ref, including the null-ref case.
- [x] 2.4 Created `fire-and-forget.ts` instead of a whole facade module: `react-hooks/refs` rejects passing a ref — or a closure over one — to a function, so extracting the facade tripped lint that the inline literal did not. Extracting only the swallow keeps the component's accepted shape and still makes the defect testable.
- [x] 2.5 The inline `useMemo` facade stays; its two commands now call `fireAndForget`.
- [x] 2.6 Document `ResumablePlayer` as fire-and-forget, so the next method added is not written the same way.

## 3. CI workflow

- [x] 3.1 Add `SHOW_DRAFT_COURSES: "1"` to `.github/workflows/ci.yml`, with a comment saying why a production build needs it.

## 4. Verification

- [x] 4.1 Run `pnpm verify` and confirm it exits 0 with no unhandled rejection.
- [x] 4.2 Run the player and resume suites specifically.
- [ ] 4.3 Open the PR against `develop` and confirm from the run that the `verify` job is green for the first time.
- [ ] 4.4 Report the e2e job's remaining failure and the four options, for the owner to choose.
