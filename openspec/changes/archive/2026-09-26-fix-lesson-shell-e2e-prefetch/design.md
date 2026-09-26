## Context

`e2e/loading-skeletons.spec.ts` "route shells" opens a lesson from its module
overview while `holdTheNextPayload` delays every request carrying the `rsc`
header by 4 s, then asserts the lesson shell is visible. It passes on `next dev`
and fails on a production build; since CI serves a production build, the block
is `test.fixme` on CI.

An exploration on a production build of `develop` logged every RSC request and
sampled what was on screen every 40 ms after the click:

| Condition | After the click |
| --- | --- |
| Nothing intercepted | shell at +40 ms, lesson at +300 ms |
| Only the navigation held 3 s | module page → shell at +40 ms → lesson at +3 s |
| Throttled network (1.5 s latency, 50 KB/s) | module page → shell at +40 ms → lesson at +3.3 s |

Every visible lesson link is prefetched within ~1 s of the module page loading:
first a `next-router-segment-prefetch: /_tree` request, then the route's
prefetch. Both carry `next-router-prefetch: 1`. The navigation itself carries
`rsc` but not `next-router-prefetch`.

So the product works, and the failure is the test's: its hold also captures the
prefetches, and it clicks the moment the link is visible, before the lesson's
prefetch has landed.

## Goals / Non-Goals

**Goals:** the route-shell tests model a slow page in a production build, pass
there deterministically, and run on CI again.

**Non-Goals:** any change to `loading.tsx`, `Link` prefetching or the lesson
page; the other shells; the 320px title `fixme`.

## Decisions

### D1. Hold the navigation, never the prefetch

`holdTheNextPayload` delays a request only when it carries `rsc` and does not
carry `next-router-prefetch`. That is the one request a slow server makes the
learner wait on; a prefetch that is slow simply has not landed yet, which D2
handles.

*Alternative:* hold everything and click later. Rejected — holding the prefetch
models a browser that never prefetches, which is not the product's path.

### D2. Click after the lesson's prefetch has landed

Before clicking, the tests wait for a response to a request that carries
`next-router-prefetch` and targets the lesson's path. A learner who reads a
module overview and then taps a lesson is in that state; a click racing the
prefetch is the one case where the shell can legitimately lag, and asserting on
it would test network timing, not the app.

The wait is registered before the page is loaded, so a prefetch that lands
before the link is found is not missed.

### D3. Drop the CI `fixme`; run only against a production build

With D1 and D2 the block passes against a production build, so the CI
`test.fixme` and its comment go.

Measured on `next dev`: the module overview issues **no** prefetch at all, so
D2's wait would never resolve there, and the old pass under `next dev` proved
nothing about learners. The block is therefore skipped unless
`E2E_SERVER_COMMAND` is `pnpm start` — the variable `playwright.config.ts`
already documents as how CI serves the production build. Running it locally
means pointing the suite at a production build the same way.

*Alternative:* detect the production build at runtime by racing the prefetch
against a timeout. Rejected — it turns a missing prefetch, which is a
regression, into a silent skip, and costs the timeout on every dev run.

## Testing strategy

| Behavior | Layer | Where |
| --- | --- | --- |
| Lesson shell shows while a prefetched lesson's navigation is slow | Playwright e2e | `e2e/loading-skeletons.spec.ts` "route shells", with `E2E_SERVER_COMMAND="pnpm start"` against `pnpm build && pnpm start`; skipped under `next dev` |
| One live region while the shell shows | Playwright e2e | same block, second test |

Red first: with D1 and D2 in place but the `fixme` removed, the block is run
against the production build — and, as a control, the old hold is shown to fail
there with the `fixme` removed. The same pattern as the exploration's
experiment B.

## Risks / Trade-offs

- [A future Next version renames the prefetch header] → the hold would again
  capture prefetches and the test would fail loudly on CI, which is the right
  outcome; the header name lives in one helper.
- [The prefetch wait times out if Next stops prefetching visible links] → the
  test fails naming the wait, which is itself a regression worth seeing.
