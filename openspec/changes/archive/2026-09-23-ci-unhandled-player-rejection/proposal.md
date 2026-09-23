## Why

`pnpm verify` exits 1 in CI while every one of its 2730 tests passes. The cause is one unhandled promise rejection:

```
Unhandled Rejection
Unknown Error: provider destroyed
```

The string comes from `@vidstack/react`, not from the test runner. Vidstack's embed providers reject **every pending promise** when `destroy()` runs, which is what Testing Library's automatic unmount triggers at the end of a player test. Any `play()` or `pause()` still in flight rejects with nobody listening, and Vitest fails the run.

The hole is a single line, and TypeScript is what hides it:

```ts
export type ResumablePlayer = { pause: () => void; … };
//                                      ^^^^ declared void
pause: () => playerRef.current?.pause()
//                              ^^^^^^^ actually returns a Promise
```

A function returning a value where `void` is expected is legal TypeScript, so the promise escapes unobserved. The sibling `play` already carries `void …?.catch(() => {})` — the pattern was known and one call site missed it.

This is not only a CI problem. A learner who navigates away while a pause is in flight produces the same unhandled rejection in the browser, and now that Sentry is configured it would arrive as recurring noise in the issue tracker.

## What Changes

- The player facade is extracted from a `useMemo` inside the component into a named, testable function, and both of its promise-returning methods swallow a rejection.
- `ResumablePlayer`'s contract is documented as fire-and-forget, so the next method added to it is not written the same way.
- `SHOW_DRAFT_COURSES=1` is added to the CI workflow's environment. `.env.example` already documents it as required "to run e2e against `pnpm build && pnpm start`", which is exactly what the e2e job does; without it a production build withholds the draft course that most e2e specs navigate.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No requirement changes: the resume behaviour is unchanged, and the spec never said a rejected pause should crash the suite. This is a defect fix, and its guard is a test rather than a new requirement.

## Impact

- **Modified**: `src/components/lesson-view/playback-positioned-video-player/playback-positioned-video-player.tsx`, `src/hooks/use-resume-on-first-play/use-resume-on-first-play.ts` (JSDoc on the type), `.github/workflows/ci.yml`.
- **New**: a folder for the extracted facade builder, with its test.
- Fixes the `verify` job. Does **not** fix the `e2e` job — see the non-goals.

## Non-goals

- **Making the e2e job pass.** It cannot, as written. Ten of the twenty-five specs navigate `advanced-intermediate-course`, which is 15 GB and gitignored, so a CI checkout never has it. `SHOW_DRAFT_COURSES=1` is necessary but not sufficient: the course would then render, and the specs that fetch its assets expecting 200 would still fail. Choosing between committing assets, repointing those specs at the tracked Basic Course, fetching content from a bucket, or not running them in CI is a decision for the project owner, and it is the subject of its own change.
- **Raising the e2e job's timeout.** The job does not overrun because it is large; it overruns because roughly twenty tests fail and each burns three attempts. Raising the limit would hide that.
- **Auditing every other promise in the codebase.** This fixes the one the evidence points at and documents the contract that invited it.
