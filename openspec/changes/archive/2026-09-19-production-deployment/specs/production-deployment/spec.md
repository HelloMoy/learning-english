## ADDED Requirements

### Requirement: A production build migrates the database before building

The repository SHALL define a `vercel-build` script that applies pending migrations with `drizzle-kit migrate` against the environment's `TURSO_DATABASE_URL` and then runs `next build`, stopping at the first failure. A migration failure SHALL fail the deployment before any new code is served.

#### Scenario: A failed migration stops the deploy
- **WHEN** a migration fails during `vercel-build`
- **THEN** `next build` does not run and the script exits non-zero

#### Scenario: A clean database reaches the current schema on first deploy
- **WHEN** `vercel-build` runs against an empty database
- **THEN** every migration is applied and the build proceeds

### Requirement: Errors are reported to Sentry only when it is configured

The application SHALL initialize `@sentry/nextjs` for the server, edge and browser runtimes, report errors from Server Components, route handlers and the proxy through `onRequestError`, and render a localized-safe `global-error` boundary that reports the error. Initialization SHALL be skipped entirely when the DSN variables are unset, so development, tests and CI send nothing. A failed email send and a refused learner write SHALL be captured explicitly, because their callers handle them rather than throw. Sentry SHALL be configured for errors only, with no tracing or replay sampling.

#### Scenario: No DSN, no reporting
- **WHEN** the app runs without `SENTRY_DSN`
- **THEN** no Sentry client is initialized and no network request goes to Sentry

#### Scenario: A failed send is captured
- **WHEN** the SMTP sender reports a delivery failure in a configured environment
- **THEN** one Sentry event is captured for it, carrying no email address or message body

### Requirement: Continuous integration verifies every push

A GitHub Actions workflow SHALL run on every push and pull request with two jobs:

- `verify` runs `pnpm verify`, including the testcontainers suites, on a runner with Docker.
- `e2e` starts `libsql` and `mailpit` service containers with the same image tags as `compose.yaml`, applies migrations, builds the app, and runs the Playwright suite on chromium against it, using the Turnstile test keys and placeholder OAuth credentials.

Either job failing SHALL fail the workflow.

#### Scenario: A failing unit test fails CI
- **WHEN** a pushed commit breaks a Vitest test
- **THEN** the `verify` job fails and the workflow reports failure

#### Scenario: CI uses the same database image as development
- **WHEN** the workflow file and `compose.yaml` are compared
- **THEN** the `libsql` and `mailpit` image tags match

### Requirement: The provisioning runbook covers every external dependency

`DEPLOYMENT.md` SHALL list, in order, every manual step needed for a first production deploy: the Turso database, region and auth token; the Resend domain (DNS records) and API key; the Google OAuth production client and its redirect URI; the Turnstile widget and its hostname; the Sentry project and DSN; the Vercel project, its function region (matching Turso's) and every environment variable the server environment schema declares. It SHALL say how to roll back a bad deploy, which is Vercel's instant rollback and holds because migrations are additive.

#### Scenario: Every declared variable is documented
- **WHEN** the server environment schema's variable names are compared with `DEPLOYMENT.md`
- **THEN** every name appears in the runbook
