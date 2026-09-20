## Why

After the first four changes, the app works end to end locally against Docker Compose, but nothing
describes how it reaches production. There is no CI, no production build step that migrates the
database, and no error reporting, so a failed Turso write or SMTP send in production would go
unnoticed. The repository already assumes Vercel (`site-url` and `robots` read `VERCEL_*`), and the
published course needs no bucket: its 25 MB of assets are in git and its videos are on YouTube.
The 15 GB draft course stays local and hidden.

## What Changes

- **Vercel build migrates first.** A `vercel-build` script runs `pnpm db:migrate` and then
  `next build`, so the production database is always at the schema the code expects. Migrations
  stay additive (the `learner-database` rule).
- **Sentry** (`@sentry/nextjs`): server, edge and client initialization, `onRequestError`, and a
  `global-error` boundary. The Next config is wrapped with `withSentryConfig`. It is fully inert
  when `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` are unset, so local work and CI send nothing.
  Failed email sends and refused learner writes are captured explicitly.
- **GitHub Actions CI** on pushes and pull requests:
  - a `verify` job that runs `pnpm verify`, including the testcontainers suites, since Docker is
    available on the runner;
  - an `e2e` job that runs Playwright (chromium) against a production build, with `libsql` and
    `mailpit` as service containers and the Turnstile test keys.
- **`DEPLOYMENT.md`**, a runbook for the one-time manual provisioning that code cannot do: the
  Turso production database and token, the Resend domain and API key, the Google OAuth production
  client, the Turnstile widget, the Sentry project, the Vercel project, its region and its
  environment variables.
- **Environment schema:** the Sentry variables are added as optional.

## Capabilities

### New Capabilities

- `production-deployment`: the migrate-then-build step, CI, error reporting and the provisioning
  runbook.

### Modified Capabilities

- None.

## Non-goals

- Preview deployments and a preview database. There are only local and production environments.
- Moving course content to a bucket. The published course ships from git, and the draft course is
  not deployed.
- Actually provisioning accounts, secrets, DNS or the Vercel project. That needs the owner's
  credentials, so this change documents it in the runbook.
- Performance monitoring, session replay and product analytics. Sentry is set up for errors only.
- Committing or pushing. That stays the owner's call.

## Impact

- `package.json` (`vercel-build`, `@sentry/nextjs`), `next.config.ts` (`withSentryConfig`),
  `instrumentation.ts`, `instrumentation-client.ts`, `sentry.server.config.ts`,
  `sentry.edge.config.ts`, `src/app/global-error.tsx`, `.github/workflows/ci.yml`, `DEPLOYMENT.md`,
  `src/lib/server-env` (optional Sentry variables), and `.env.example`.
- The email sender and the learner write path report failures to Sentry, a no-op when it is
  unconfigured.
