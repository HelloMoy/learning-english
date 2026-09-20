## Context

The app has no server-side state and no identity. Learner state lives in `localStorage` behind four
`browser-local-storage` adapters and six hooks that read it directly. The server graph
(`getCoursePlatformDeps`) holds only the catalog, plus ephemeral in-memory stubs for progress and
positions.

This change adds the pieces every later change depends on: a database, a validated environment,
accounts, email and the session gate. It deliberately moves no learner state. The follow-ups
`learner-progress-in-database` and `learner-achievements-in-database` do that on top of this
foundation, and `account-deletion` and `production-deployment` close the sequence.

Constraints that shaped the design:

- Hexagonal boundaries. `src/domain/**` imports only `zod` and `neverthrow`, so auth and the
  database live in adapters and `src/lib`.
- Port `3000` on this machine belongs to Open WebUI, and `8080` to `pnpm docs:serve`.
- There are only two environments, local and production. There is no preview deployment.
- Stored memory: database adapters are tested against a real database with testcontainers, never
  mocks.

## Goals / Non-Goals

**Goals:**

- One database access path (Drizzle + libSQL) that works unchanged against Compose and Turso Cloud.
- Accounts with email/password (verified), Google, reset, sign-out and linking, gated by Turnstile.
- Every personal route requires a valid session, checked optimistically in the proxy and
  authoritatively on the server.
- Localized transactional email that is testable locally without any external account.
- An e2e suite that keeps passing, now as signed-in learners.

**Non-Goals:**

- Moving learner state to the database (the next two changes).
- Account deletion, production provisioning, CI and Sentry (later changes).
- A public read-only mode, and preserving course SEO. Both were ruled out by the product decision
  that login is mandatory.

## Decisions

### D1 — Drizzle ORM over `@libsql/client`

The schema lives in `src/adapters/persistence/turso/schema/schema.ts`, the client factory in
`src/adapters/persistence/turso/database/database.ts` (`server-only`), and migrations in `drizzle/`.
`drizzle.config.ts` uses `dialect: "turso"`, which covers both `http://127.0.0.1:8081` and
`libsql://…`. `turso` joins the watched roots of the `folder-per-entity` ESLint rule, like `in-memory`.

*Alternatives:* Prisma supports Turso only through a driver adapter, and its migration story there
is weaker. Raw `@libsql/client` gives no schema types, and Better Auth would need its Kysely
adapter, a second query layer.

### D2 — One validated server environment

`src/lib/server-env/server-env.ts` (`server-only`) declares every server variable in one Zod v4
schema and exposes `serverEnv()`, which parses lazily and memoizes. Lazy parsing matters:
`next build` evaluates modules that must not demand production secrets at import time. A refinement
requires `TURSO_AUTH_TOKEN` exactly when the URL scheme is `libsql:`. The one public variable,
`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, is read directly where it is used, because Next inlines it at
build time.

Variables: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN?`, `BETTER_AUTH_SECRET` (≥ 32 chars),
`BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TURNSTILE_SECRET_KEY`, `SMTP_HOST`,
`SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER?`, `SMTP_PASSWORD?`, `EMAIL_FROM`.

*Alternative:* `@t3-oss/env-nextjs`. Rejected as a dependency that duplicates twenty lines of Zod.

### D3 — Better Auth, configured in `src/lib/auth/auth.ts`

- `drizzleAdapter(db, { provider: "sqlite", schema })`. The auth tables (`user`, `session`,
  `account`, `verification`, `rate_limit`) come from `@better-auth/cli generate` into the Drizzle
  schema and are then migrated like any other table. Snake-case column names keep SQL readable.
- `emailAndPassword`: `enabled`, `requireEmailVerification: true`, `minPasswordLength: 8`,
  `maxPasswordLength: 128`, `revokeSessionsOnPasswordReset: true`, `sendResetPassword`.
- `emailVerification`: `sendOnSignUp: true`, `autoSignInAfterVerification: true`,
  `sendVerificationEmail`.
- `socialProviders.google`, plus `account.accountLinking: { enabled: true, trustedProviders: ["google"] }`.
  Google verifies the address, so linking by email is safe for that provider only.
- `rateLimit: { storage: "database" }`, left at Better Auth's default of production-only. Parallel
  e2e sign-ins from one IP would otherwise trip it.
- `plugins: [captcha({ provider: "cloudflare-turnstile", secretKey }), nextCookies()]`, with
  `nextCookies` last as the docs require.
- `src/app/api/auth/[...all]/route.ts` exports `toNextJsHandler(auth)`.
- `src/lib/auth-client/auth-client.ts` exports `createAuthClient()` for the forms.

The auth module is constructed lazily through `getAuth()`, for the same build-time reason as D2.

*Alternatives:* Auth.js. It has a weaker email/password story and no built-in verification or
reset flow. Clerk and other hosted auth were rejected because the data would leave Turso and add a
vendor.

### D4 — The account forms call the Better Auth client, not Server Actions

Sign-in, sign-up, forgot and reset are client components that call `authClient.signIn.email`,
`authClient.signUp.email`, `authClient.requestPasswordReset`, `authClient.resetPassword` and
`authClient.signIn.social`. The client already handles cookies, the OAuth redirect and the
`x-captcha-response` header (`fetchOptions.headers`). Wrapping it in `next-safe-action` would add a
hop without adding validation: the forms validate with Zod before calling, and Better Auth
validates again on the server. Better Auth's error `code`s map to `Account.errors.<code>` keys,
with a generic fallback, so no raw server message reaches the UI.

Every call passes a locale-qualified `callbackURL` or `redirectTo` (`/es/learning`,
`/es/reset-password`). That is how the email callbacks know the locale (D6).

### D5 — The session gate is two layers

1. **Proxy (optimistic).** `src/proxy.ts` composes a gate in front of `createMiddleware(routing)`.
   For a personal path (`isPersonalPath`, a pure function in `src/lib/personal-routes/`) without a
   Better Auth session cookie (`getSessionCookie`), it redirects to `/<locale>/sign-in?next=<path>`.
   Everything else falls through to next-intl unchanged. A route's `opengraph-image` is let
   through: it is a metadata image route that no layout wraps, it renders catalog titles only,
   and link-preview crawlers fetch it without a session.
2. **Server (authoritative).** `requireLearnerSession(locale)` in
   `src/lib/auth/require-learner-session/` calls `auth.api.getSession({ headers: await headers() })`
   and `redirect`s to sign-in (without `next`: a layout does not know the requested path) when there is no session. It is called from `courses/layout.tsx` and
   from new `layout.tsx` files for `learning`, `achievements`, `profile` and `start`. It returns the
   session, which the next change uses to scope the learner's data.

The `next` validator (`src/lib/sign-in-return-path/`) generalizes the rule in
`onboarding-return-path`: it uses the same unsafe-path pattern, with an allowlist of personal
prefixes instead of `/courses/` only. The onboarding keeps its own, narrower rule.

Reading `headers()` makes these routes dynamic. That is acceptable: they are now per-learner by
definition. The locale layout also reads the session, to tell `SiteHeader` whether to show the
avatar menu or a Sign in link, so the home becomes dynamic too.

*Alternative:* gate only in the proxy. Rejected, because Better Auth's own docs flag the cookie
check as not secure on its own.

### D6 — Email: React Email templates, an SMTP sender, and the locale from the callback URL

- `src/adapters/email/email-sender.ts` holds the interface
  `EmailSender { send(message): ResultAsync<void, EmailDeliveryError> }`.
  `src/adapters/email/smtp-email-sender/` is the nodemailer implementation.
- `src/emails/verify-email/verify-email.tsx` and `src/emails/reset-password/reset-password.tsx`
  receive already-translated copy and the URL as props, plus `PreviewProps`.
- `src/lib/account-emails/account-emails.ts` composes a message: it resolves the locale, loads that
  locale's messages, builds the copy with next-intl's `createTranslator` (no request context
  needed), then calls `render` and `toPlainText` from `react-email`.
- The locale comes from the locale-qualified `callbackURL` inside the verification URL, or from
  `redirectTo` inside the reset URL (D4). It falls back to `routing.defaultLocale`.
- Mailpit in development and Resend's SMTP relay (`smtp.resend.com:465`, user `resend`, password =
  API key) in production. Only the environment differs.

*Alternatives:* the Resend SDK. It would give one code path in production and a different one in
development, so the production path would never run locally. Storybook for emails was rejected
because it does not render like a mail client. The React Email preview (`pnpm email:dev`, port
3030) replaces it for `src/emails/**`, a documented exception to the stories rule.

### D7 — Turnstile through Better Auth's `captcha` plugin

A `TurnstileChallenge` component (`src/components/turnstile-challenge/`) wraps
`@marsidev/react-turnstile` and hands its token to the form, which sends it as
`x-captcha-response`. Local and e2e use Cloudflare's always-pass test pair (site
`1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`) from `.env.example`. The
Google button needs no challenge: Google is the one proving the human.

### D8 — Docker Compose for the local stack, testcontainers for the tests

`compose.yaml` holds `libsql` (`8081:8080`, volume `libsql-data`) and `mailpit` (`1025`, `8025`),
each at a pinned tag. The libSQL image tag is also exported from
`src/test-setup/libsql-container/libsql-container.ts`, the helper database suites use to start a
`GenericContainer`, wait for the port, and run Drizzle's `migrate()` against it. A test pins
`compose.yaml` and the helper to the same tag, so they cannot drift. Suites carry
`// @vitest-environment node`, because the project default is jsdom, and they use the existing
`describe.skipIf(!DOCKER_AVAILABLE)` guard.

### D9 — e2e runs as a fresh learner per test

`e2e/learner-account-fixture.ts` gives each test its own account:

1. Sign up through the app's own `POST /api/auth/sign-up/email`, with the test Turnstile token
   header and a faker address.
2. Mark the address verified with one SQL `UPDATE`, through `@libsql/client` against the Compose
   database. This is the only step that skips the real flow. Driving Mailpit for every test would
   cost seconds and prove nothing new.
3. Sign in through `POST /api/auth/sign-in/email` on the page's request context, so the cookie lands
   in the browser context.

`learner-profile-fixture.ts` builds on it. The verification and reset flows get dedicated specs
that do go through Mailpit's API (`GET http://localhost:8025/api/v1/messages`). Per-test accounts
keep the suite parallel-safe once state moves to the database in the next change.

### D9b — What the header and home show

`SiteHeader` gains a `signedIn` prop from the locale layout. Anonymous visitors see a Sign in link.
Signed-in learners see the existing avatar menu, which gains a Sign out item. The home's CTAs keep
their course links. The proxy turns those into sign-in for anonymous visitors, with `next`
preserved, so no CTA needs to know about auth.

## Testing strategy

| Behavior | Layer | Mirrors |
|---|---|---|
| `serverEnv()` parsing, `TURSO_AUTH_TOKEN` refinement, error names the variable | Vitest unit | `src/lib/site-url/site-url.test.ts` (env-driven) |
| `isPersonalPath`, `signInReturnPath` validation | Vitest unit | `src/lib/onboarding-return-path/onboarding-return-path.test.ts` |
| Proxy: redirect with `next`, public paths fall through | Vitest unit on the exported gate function with `NextRequest` | — |
| `localeFromActionUrl`, message composition (subject, HTML link twice, text part) per locale | Vitest unit | — |
| `verify-email` and `reset-password` templates render copy and URL | Vitest unit (`render` → string assertions) | — |
| `SmtpEmailSender` delivers to a real SMTP server and reports refusals | Vitest integration + testcontainers (`axllent/mailpit`) | `s3-blob-store.test.ts` |
| Migrations apply to an empty libSQL; the Compose and helper tags match | Vitest integration + testcontainers | `s3-blob-store.test.ts` |
| Better Auth sign-up → verify → sign-in, reset, linking config, captcha refusal, against a real libSQL | Vitest integration + testcontainers, calling `auth.api.*` | — |
| Forms: validation, error mapping, `aria-describedby`, token forwarding, redirect to `next` | Vitest + RTL (auth client mocked at the module boundary) | `onboarding-name-step.test.tsx` |
| `SiteHeader` anonymous vs signed-in, Sign out | Vitest + RTL | `site-header.test.tsx` |
| Sitemap lists only the home, account pages are `noindex` | Vitest unit | `src/app/sitemap.test.ts` |
| Anonymous redirect with `next`; sign-up → Mailpit → verify → lands signed in; reset via Mailpit; sign-out | Playwright | `course-onboarding-gate.spec.ts` |
| Every existing spec that opens a personal route runs as a fixture learner | Playwright | `learner-profile-fixture.ts` |

The Google round-trip itself cannot run in automation without real Google credentials. Its
configuration is covered by the Better Auth integration test, and Playwright asserts that the button
navigates to `accounts.google.com` with the expected `redirect_uri`.

## Risks / Trade-offs

- **Course URLs drop out of search, and shared links preview the sign-in page.** This is the
  accepted cost of mandatory login. The home keeps its SEO and share card.
- **Protected pages lose static rendering.** Mitigation: the catalog is still in-memory and cheap.
  Watch response times after the change.
- **Local work now needs Docker Desktop.** It is already needed for the blob-store suites.
  `pnpm test:run` still passes without it, because the suites skip.
- **e2e needs the Compose stack and a migrated database.** The Playwright config documents it, and
  a global setup fails fast with the exact command when `127.0.0.1:8081` does not answer.
- **Progress is still per device until the next change,** so a learner who signs in on a second
  device sees none. The change is short-lived by design and ships together with the next one.
- **Better Auth version drift.** Pin the minor version, and keep the generated auth schema under
  test through the migration check.

## Migration Plan

1. `docker compose up -d`, then `pnpm db:migrate`, then `pnpm db:seed`.
2. Copy the new block of `.env.example` into `.env.local`. It works as-is against Compose, except
   for the Google keys.
3. For Google locally: create an OAuth client with the redirect URI
   `http://localhost:<dev port>/api/auth/callback/google`.

Rollback: revert the change. No production data exists yet.

## Open Questions

- None blocking. Production credentials and hosting are settled in `production-deployment`.
