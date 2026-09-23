## Why

The CI workflow has never passed. It arrived with the authentication work and has been red on every run since. The `verify` job was fixed separately; this change is about the `e2e` job, which has three independent problems.

**It never finishes.** `Running 254 tests using 1 worker`, and the job is killed at the 45-minute limit mid-run. It is not failing its way to the wall — with the draft-course flag in place only a handful of tests fail. The suite simply does not fit in the budget serially.

**Unknown paths answer 200.** Two tests assert a 404 and get 200, and the defect is real beyond CI: `/es/error` and `/en/privacyy` render the localized "Page not found" state with a success status. `lesson-view-polish` requires 404 explicitly. Measured cause: the `loading.tsx` under `[locale]` wraps every page in a Suspense boundary, so the server commits to `200 OK` before it can stream the shell, and `notFound()` arrives too late to change it. Removing that `loading.tsx` restores the 404 — verified — but the skeleton is its own requirement.

**YouTube does not play in CI.** Two tests wait for the player to report frames rolling and time out. Embeds are reluctant to play from datacenter addresses. This is a property of the environment, not a defect in the application.

## What Changes

- The proxy answers a path no route serves with a real 404, deciding before anything streams — the approach Next.js documents for exactly this situation. Both requirements are then satisfied: the skeleton stays and the status is honest.
- A literal list of servable route segments, compared against the route tree on disk by a test, so it cannot drift.
- The e2e job runs as a sharded matrix instead of one serial job, so wall-clock time divides while each shard keeps `workers: 1` and its own isolated services.
- The two tests that need YouTube to actually play are skipped under CI, naming the reason.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lesson-view-polish`: the requirement already demands a 404. It gains the mechanism — the check happens in the proxy, before the response commits — because a reader who only sees `notFound()` in the catch-all would reasonably conclude the status came from there, and be wrong.

## Impact

- **New**: `src/lib/known-route-segments/`, `src/lib/missing-page/`, with tests.
- **Modified**: `src/proxy.ts`, `.github/workflows/ci.yml`, two e2e specs.
- No database, domain or content change.

## Non-goals

- **Making YouTube play in CI.** Using a real Chrome channel for its codecs might help and might not; the failure may equally be YouTube declining a datacenter address. Two skipped tests are a smaller price than a CI setup that is itself unreliable.
- **Reducing the suite.** 254 tests is what the product needs; the job should fit the tests, not the reverse.
- **Raising the 45-minute limit.** That hides the shape of the problem rather than solving it.
