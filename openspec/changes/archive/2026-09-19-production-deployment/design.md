## Context

The repo already targets Vercel: `site-url` falls back to `VERCEL_PROJECT_PRODUCTION_URL` and
`VERCEL_URL`, and `robots` opens crawling only when `VERCEL_ENV === "production"`. The published
course's assets are tracked in git (137 files, 25 MB), and its videos are YouTube embeds. The draft
course (15 GB, git-ignored) is withheld in production builds, so no content storage work is needed.
There is no `.github/workflows`, and the only environments are local and production.

## Goals / Non-Goals

**Goals:** a deploy that cannot serve code ahead of its schema, CI that runs the same checks
developers run, error reporting that is silent until configured, and a runbook for the steps only
the owner can take.

**Non-Goals:** previews, a content bucket, provisioning itself, tracing and replay.

## Decisions

### D1 — Migrate in `vercel-build`

Vercel runs a `vercel-build` script when one exists, in place of `build`. Putting
`drizzle-kit migrate && next build` there ties migration to deployment without a separate pipeline.
Local `pnpm build` stays migration-free. Because there is no preview environment, the only database
this touches is production. The additive-migration rule makes Vercel's instant rollback safe: the
previous build still works against the newer schema.

*Alternative:* migrate from CI before triggering the deploy. Rejected: it adds a deploy hook and a
second place that holds production database credentials.

### D2 — Sentry, errors only, inert without a DSN

The files follow the manual setup in Sentry's docs: `instrumentation.ts` (`register()` imports
`sentry.server.config` or `sentry.edge.config`, and `onRequestError = Sentry.captureRequestError`),
`instrumentation-client.ts`, and `withSentryConfig` in `next.config.ts` (source-map upload only when
`SENTRY_AUTH_TOKEN` is present). Each `init` is guarded by its DSN, and `tracesSampleRate` is
omitted. Explicit captures go through one helper, `reportHandledError(error, context)` in
`src/lib/report-handled-error/`, used by `SmtpEmailSender` and by the learner store's rollback path.
It strips personal data and is a no-op without Sentry.

*Alternative:* Vercel's built-in logs only. Rejected: they are fine for debugging, but give no
alerting, grouping or client-side errors.

### D3 — CI with service containers

`.github/workflows/ci.yml` has two jobs:

- `verify`: `pnpm install --frozen-lockfile`, then `pnpm verify`. The testcontainers suites start
  their own containers through the runner's Docker.
- `e2e`: `libsql` and `mailpit` service containers on `8081` and `1025`/`8025`, then
  `pnpm db:migrate`, `pnpm build`, `pnpm exec playwright install --with-deps chromium`, and
  `pnpm test:e2e --project=chromium` with `PLAYWRIGHT_BASE_URL` pointing at `pnpm start`.

Environment values come from a checked-in CI block: the Turnstile test keys, a throwaway
`BETTER_AUTH_SECRET`, and placeholder Google credentials. None of them are secrets. A small Vitest
test parses `ci.yml` and `compose.yaml` and asserts that the image tags match.

### D4 — Runbook, not automation

`DEPLOYMENT.md` sits at the repo root, because `docs/` is TypeDoc output and git-ignored. It is
ordered by dependency: Turso, then Resend, Google, Turnstile, Sentry, and finally Vercel. It uses
real variable names, and a test asserts every name in the `serverEnv` schema appears in it. The
region choice is written as a decision for the owner, with the rule "Vercel function region =
Turso primary location".

## Testing strategy

| Behavior | Layer | Mirrors |
|---|---|---|
| `vercel-build` order and fail-fast (script string) | Vitest unit reading `package.json` | — |
| `reportHandledError` is a no-op without a client and strips personal data | Vitest unit | — |
| Sentry init is skipped without a DSN | Vitest unit on the config modules | — |
| CI and Compose image tags match; every `serverEnv` variable is in `DEPLOYMENT.md` | Vitest unit (YAML and Markdown parsing) | the change-1 Compose/helper tag test |
| The workflow itself | Runs on the first push. Locally, `act` is not assumed | — |
| `global-error` renders without the intl provider | Vitest + RTL | `not-found.test.tsx` |

## Risks / Trade-offs

- **A migration runs even if the build later fails.** It is safe because migrations are additive.
  The previous deployment keeps serving.
- **CI e2e time.** Chromium only, one worker to start with. Add projects once it is stable.
- **Sentry bundle weight on the client.** Errors only, no replay or tracing, so the client SDK stays
  small. Revisit if the Lighthouse budget complains.

## Migration Plan

Merge, then follow `DEPLOYMENT.md` once, then push to trigger the first Vercel production build.
Rollback: Vercel instant rollback.

## Implementation Notes

- **Auth rate limiting in CI.** A production build rate-limits auth by default, and the e2e job
  serves one. Its hundreds of sign-ins share one IP and got 429s, so `AUTH_RATE_LIMIT`
  (`isAuthRateLimited` in `server-env`) overrides the `NODE_ENV` default. CI sets it to `false`,
  and `DEPLOYMENT.md` says never to set it in production.
- **Sentry is imported lazily.** `reportHandledError` imports `@sentry/nextjs` on its first call.
  Importing it eagerly put the SDK in the learner store's client chunk and in every Vitest file's
  setup, which roughly doubled the unit run.
- **`global-error` loads its catalogue dynamically.** A static import bundled all three message
  files (about 70 KB) into a chunk loaded on every page.
- **e2e specs that need the draft course.** The draft course's content is git-ignored, so specs
  that open it cannot pass in CI until they run on the basic course or the draft is published.
  Locally, run them against a build with `SHOW_DRAFT_COURSES=1`.
- **The header while the card loads.** The signed-in header held Sign out and the theme toggle
  until the learner card was known, which widened a 320px phone. It now holds the avatar's place.

## Open Questions

- Which region to deploy to (Turso primary and Vercel function region). The runbook asks the owner.
