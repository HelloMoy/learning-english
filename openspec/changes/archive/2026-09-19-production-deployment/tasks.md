## 1. Build step

- [x] 1.1 `vercel-build` script: `drizzle-kit migrate && next build`. Test that the script chains migrate before build with `&&` (TDD: test → impl)

## 2. Error reporting

- [x] 2.1 Add `@sentry/nextjs`, plus the optional `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` and `SENTRY_AUTH_TOKEN` in `serverEnv` and `.env.example` (config, env test updated first)
- [x] 2.2 `reportHandledError(error, context)` in `src/lib/report-handled-error/`: a no-op without a client, and strips email addresses and bodies (TDD: test → impl)
- [x] 2.3 `instrumentation.ts`, `instrumentation-client.ts`, `sentry.server.config.ts` and `sentry.edge.config.ts`, all guarded by the DSN, errors only. Wrap `next.config.ts` in `withSentryConfig` (TDD: test on the guard → impl)
- [x] 2.4 `src/app/global-error.tsx` reports and renders a minimal bilingual-safe fallback (TDD: test → impl)
- [x] 2.5 Call `reportHandledError` from `SmtpEmailSender` failures and the learner store rollback (TDD: test → impl)

## 3. CI

- [x] 3.1 `.github/workflows/ci.yml` with the `verify` and `e2e` jobs, service containers and the test env block (config)
- [x] 3.2 Test: `ci.yml` service image tags equal the `compose.yaml` tags (TDD: test → impl)

## 4. Runbook

- [x] 4.1 `DEPLOYMENT.md`: Turso, Resend (DNS), Google OAuth, Turnstile, Sentry, Vercel (region and env vars), and rollback. Test: every `serverEnv` variable name appears in it (TDD: test → impl)

## 5. Verification

- [x] 5.1 Run `pnpm verify` and `pnpm build` locally with no Sentry variables (the build must not need them), and `pnpm test:e2e --project=chromium` against `pnpm build && pnpm start` with the Compose stack
- [x] 5.2 Findings from the production e2e run: auth rate limiting is on in production builds, so add the `AUTH_RATE_LIMIT` override (off in CI only); the signed-in header held Sign out and the theme toggle while the card loaded, widening a 320px phone, so it now holds the avatar's place; the 320px header-controls specs run as a visitor again (TDD: test → impl)
