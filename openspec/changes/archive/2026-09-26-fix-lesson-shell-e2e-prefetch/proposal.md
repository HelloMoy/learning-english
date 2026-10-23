## Why

The e2e block "Loading skeletons — route shells" fails against a production
build, which is what CI serves, so it was marked `test.fixme` on CI when the
self-hosted-content quarantine was retired. That left open whether production
learners see the lesson shell at all.

They do. Measured on a production build, opening a lesson from its module paints
the lesson shell within 40 ms of the click — on a fast server, with only the
navigation delayed, and on a throttled network alike. The shell reaches the
browser through the link's **prefetch**, which Next issues for every visible
lesson link and which carries the route's `loading.tsx`.

The test cannot see that because `holdTheNextPayload` holds every RSC request,
prefetches included, and it clicks as soon as the link is visible — usually
before the lesson's prefetch has landed. With the shell held back, the router
can only wait on the (also held) navigation. Under `next dev`, which does not
prefetch and renders slowly, the shell showed after the hold for unrelated
reasons, so the test passed there by accident.

## What Changes

- `holdTheNextPayload` holds only the navigation's RSC request and lets
  requests carrying `next-router-prefetch` through, so it models a slow page
  rather than a browser that never prefetches.
- The route-shell tests wait for the opened lesson's prefetch to land before
  clicking, which is the state a learner is in when they tap a lesson.
- The CI-only `test.fixme` on the block is removed; both tests run on CI against
  the production build again.
- The `loading-skeletons` spec states that the shell arrives through the link's
  prefetch, and that the scenario holds in a production build.

No production code changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `loading-skeletons`: the "Every route segment renders a shell" requirement
  gains a scenario pinning the production path — the shell comes from the
  link's prefetch and appears while a slow navigation is still pending.

## Non-goals

- **Changing prefetch behavior or `loading.tsx`.** Both already work.
- **The 320px module title overflow**, the other `fixme` — a layout defect with
  its own change.
- **Covering the other three route shells in production.** Only the lesson
  shell has an e2e test today; widening coverage is separate.

## Impact

- `e2e/loading-skeletons.spec.ts` — the hold helper, a wait for the prefetch,
  and the removed `fixme`.
- `openspec/specs/loading-skeletons/spec.md` — one added scenario (via delta).
