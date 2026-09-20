## Why

Everything the learner does (completion, playback positions, profile, tickets, prizes) lives in one
browser's `localStorage`. It does not follow the learner to another device, a cleared browser loses
it, and the app cannot tell one learner from another. Moving that state to a server database needs
two things first: a database the app can reach in every environment, and a signed-in learner to
attach the state to. This change lays that foundation. Moving the state itself comes in the
follow-up changes `learner-progress-in-database` and `learner-achievements-in-database`.

## What Changes

- **Database foundation.** Turso (libSQL) accessed through Drizzle ORM and `@libsql/client`, with
  migrations versioned in git and applied with `drizzle-kit migrate`. The same code runs against
  `libsql-server` in Docker Compose locally and Turso Cloud in production. Only the connection URL
  changes.
- **Local stack.** A `compose.yaml` with two services: `libsql` (`ghcr.io/tursodatabase/libsql-server`,
  port `8081`, named volume) and `mailpit` (SMTP `1025`, inbox `8025`). New scripts: `db:migrate`,
  `db:generate`, `db:seed`, `db:reset`, `db:studio` and `email:dev`.
- **Validated server environment.** One `server-only` module parses every server variable with Zod
  at first use and fails with the variable's name when one is missing or malformed. `.env.example`
  documents the local defaults, and its stray "OpenUI / MiniMax" header goes.
- **Learner accounts (Better Auth).** Sign-up and sign-in with email and password, and with Google.
  Email sign-ups must verify their address before they can sign in. Password reset by email.
  Signing out. A Google sign-in on an address that already has a password account links to that
  account instead of creating a second one. Sessions and auth rate limits are stored in the
  database.
- **Bot protection.** Cloudflare Turnstile on sign-up, sign-in and forgot-password, through Better
  Auth's `captcha` plugin.
- **Transactional email.** Verification and password-reset emails built with React Email, localized
  in `en`, `es` and `pt`, sent over SMTP. Mailpit receives them locally and Resend's SMTP relay
  sends them in production.
- **BREAKING. Signing in is required.** Every course, module and lesson route, and My learning,
  Achievements, Profile and the onboarding, now requires a session. A visitor without one lands on
  `/[locale]/sign-in?next=<path>`. The home page and the account pages stay public.
- **BREAKING. Course URLs leave search.** The sitemap lists only the home in each locale, because
  every other URL now answers with the sign-in page. The account pages declare `noindex`.
- **The e2e suite runs as a signed-in learner.** It gets a per-test account fixture and runs
  against the Compose stack.

## Capabilities

### New Capabilities

- `learner-account`: signing up, verifying email, signing in (email/password and Google), resetting
  a password, signing out, account linking, bot protection, rate limiting, the session gate on
  personal routes and the validated `next` return path.
- `transactional-email`: localized React Email templates, the SMTP sender, the Mailpit inbox in
  development and the template preview server.
- `learner-database`: the Turso/libSQL database behind Drizzle, the validated server environment,
  versioned migrations, the Compose stack, the `db:*` scripts and the testcontainers pattern for
  database adapter tests.

### Modified Capabilities

- `learner-onboarding`: course routes require a session before they require a learner profile, and
  the server no longer renders course content to a visitor without one.
- `search-discoverability`: the sitemap lists only the home, and the account pages join the routes
  kept out of search.

## Non-goals

- Moving any learner state out of `localStorage`. Completion, playback, continue-watching and the
  profile move in `learner-progress-in-database`. Tickets and prizes move in
  `learner-achievements-in-database`. Until then, a signed-in learner's progress is still per
  device.
- Deleting an account (`account-deletion`).
- Production provisioning, CI, Sentry and the Vercel build (`production-deployment`).
- Importing existing `localStorage` data into the database. It is discarded, as decided.
- A public read-only mode for anonymous visitors.
- Preview deployments or a preview database. There are only local and production environments.
- Other sign-in providers (GitHub, magic link, passkeys) and two-factor authentication.
- Checking passwords against breach lists. Better Auth ships this only through its paid `sentinel`
  infrastructure.

## Impact

- **New dependencies:** `drizzle-orm`, `@libsql/client`, `better-auth`, `nodemailer`,
  `react-email` (components, `render` and the preview CLI in one package), `@marsidev/react-turnstile`. **Dev:** `drizzle-kit`,
  `testcontainers`, `@types/nodemailer`.
- **New files:** `compose.yaml`, `drizzle.config.ts`, `drizzle/` (migrations),
  `src/adapters/persistence/turso/**`, `src/adapters/email/**`, `src/emails/**`,
  `src/lib/auth/**`, `src/lib/server-env/**`, the account pages under `src/app/[locale]/(account)/`,
  `src/app/api/auth/[...all]/route.ts`.
- **Changed:** `src/proxy.ts` (session gate composed with next-intl), `src/app/sitemap.ts`,
  `SiteHeader` (sign-in link and sign-out), the home CTAs, `.env.example`, `playwright.config.ts`
  and every e2e spec that opens a protected route, and `src/messages/{en,es,pt}.json` (`Account.*`,
  `Emails.*`).
- **Environments:** local work now needs Docker Desktop running (`docker compose up -d`) and
  `pnpm db:migrate` once. Google OAuth needs a client with a local callback. Production needs Turso,
  Resend, Google and Turnstile credentials (provisioned in `production-deployment`).
