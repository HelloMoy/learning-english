## Context

`pnpm test:e2e` declares 254 tests. CI runs them with `workers: 1` and `retries: 2` against a production build, in a job capped at 45 minutes. The last run was killed mid-suite, having never reached its summary.

Separately, two tests assert that an unknown path answers 404 and receive 200. The cause was measured rather than guessed: removing `src/app/[locale]/loading.tsx` and rebuilding turns `/es/error` from 200 into 404. Next.js documents why — a Suspense boundary forces the server to commit to `200 OK` before streaming the shell, so a `notFound()` thrown during render cannot change the status. The framework compensates with `<meta name="robots" content="noindex">`, which the response does carry, so the soft 404 was never an indexing problem; it was a contract problem.

Two more tests wait on the video player reporting frames rolling from a YouTube embed, and time out.

## Goals / Non-Goals

**Goals:**

- The e2e job finishes inside its budget.
- An unknown path answers 404 without giving up the loading skeleton.
- The route list the proxy judges against cannot drift from the routes.

**Non-Goals:**

- Making YouTube play in a datacenter browser.
- Trimming the suite, or raising the job's time limit.

## Decisions

### The 404 is decided in the proxy, not by the catch-all

Three options were weighed.

**Remove `[locale]/loading.tsx`.** Restores the status — measured — and costs the loading skeleton, which `loading-skeletons` requires. Trading one requirement for another is not a fix.

**Relax the requirement to accept the soft 404.** Defensible, since `noindex` already keeps it out of search. Rejected because the requirement is deliberate and the framework documents a supported way to honour it.

**Chosen: check before anything streams.** The Next.js guidance for this exact situation is to do the existence check in `proxy`. The proxy rewrites to the same URL with `status: 404`, so the catch-all still renders the same localized page and only the status changes.

Ordering in the chain matters and is deliberate: after `sessionGate`, so a signed-out learner on a personal route is still redirected to sign-in rather than told the page does not exist; before `localize`, which would otherwise commit the response first. A request whose first segment is not a locale is left alone — `localize` redirects it, and the rewritten path comes back through.

### The segment list is literal, and a test keeps it honest

The proxy runs before the router and has no filesystem, so the list cannot be derived at runtime. It is a literal tuple, and a test reads the directories under `src/app/[locale]` — hoisting route groups, skipping dynamic segments — and asserts the two agree.

This mirrors `generate-metadata-locale-guard.test.ts`, which discovers routes from disk for the same reason: the failure mode is an omission, and an omission is exactly what review waves through. Without it, a route added later would quietly start answering 404 — the worst kind of regression, because the page exists and the server denies it.

Only the first segment decides. Deeper segments are data: an unknown course slug already has a better answer than a missing page, namely the application's own recovery state.

### The e2e job is sharded, not parallelised in-process

Raising `workers` inside one job would have every worker share one database and one mail server. The workflow already sets `AUTH_RATE_LIMIT: "false"` because the suite's sign-ins share an address, which says the shared-state risk is real and known.

Sharding instead gives each shard its own runner, its own services and its own `workers: 1`. Wall-clock divides by the shard count; total minutes do not fall, which is the honest trade. Nothing about test isolation changes, so the shards cannot interact.

### Two tests are skipped under CI, and say so

`startPlayback` waits for the player to report frames rolling. A YouTube embed does not start in CI, whether because Playwright's bundled Chromium lacks the proprietary codecs or because YouTube declines a datacenter address. The skip is conditional on `CI` so both keep running locally, where they pass and remain useful.

## Risks / Trade-offs

- **A route added later is missing from the list, and its page starts answering 404** → This is the serious one, and why the drift test exists. It fails the moment the directory appears without the segment.
- **Sharding multiplies the services started per run** → Four jobs each start libsql and mailpit. More machine time for less wall-clock; accepted.
- **The skipped tests hide a real playback regression** → They still run locally and in any environment where YouTube plays. The risk is bounded to two assertions.
- **The proxy now runs on more paths** → It already matched everything but `api`, `_next` and dotted paths. The added work is one `Set` lookup.

## Testing strategy

| Behavior | Layer | Mirrors |
| --- | --- | --- |
| The segment list matches the route tree | Vitest unit | `generate-metadata-locale-guard.test.ts`, which discovers routes from disk |
| Known and unknown paths are classified correctly | Vitest unit | `known-route-segments.test.ts` |
| An unknown path answers 404 and still renders the localized page | Playwright e2e | `not-found-routes.spec.ts`, already written and currently failing |
| A real route is untouched | Playwright e2e | the rest of the suite passing is the assertion |

The 404 is verified against a production build, not a dev server: the Suspense commit that caused the defect only happens in a real build.

## Open Questions

- **Does four shards fit the budget?** Unknown until measured: the suite never finished, so its true length is not known. If a shard still overruns, the count goes up — the mechanism does not change.
