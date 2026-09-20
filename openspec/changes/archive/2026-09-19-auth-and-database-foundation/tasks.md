## 1. Tooling and local stack

- [x] 1.1 Add dependencies: `drizzle-orm`, `@libsql/client`, `better-auth`, `nodemailer`, `react-email`, `@marsidev/react-turnstile`. Add dev dependencies: `drizzle-kit`, `testcontainers`, `@types/nodemailer`. Check afterwards that `shadcn` did not re-add `cn` (config, no TDD)
- [x] 1.2 Add `compose.yaml` with `libsql` (pinned tag, `8081:8080`, volume `libsql-data`) and `mailpit` (pinned tag, `1025`, `8025`). Verify with `docker compose up -d` and a health probe (config, no TDD)
- [x] 1.3 Add `drizzle.config.ts` (`dialect: "turso"`, schema path, `out: "drizzle"`) and the scripts `db:generate`, `db:migrate`, `db:studio`, `email:dev` (`email dev --dir src/emails --port 3030`) (config, no TDD)
- [x] 1.4 Add `src/adapters/persistence/turso` to the watched roots of `local-structure/folder-per-entity` in `eslint.config.mjs`, and rewrite `.env.example`: drop the stray OpenUI/MiniMax header, add the new variables with their Compose and test-key defaults (config, no TDD)

## 2. Server environment

- [x] 2.1 `serverEnv()` in `src/lib/server-env/`: Zod schema, lazy and memoized, requires `TURSO_AUTH_TOKEN` for `libsql:` URLs, errors name the variable (TDD: test → impl)

## 3. Database

- [x] 3.1 Testcontainers helper `src/test-setup/libsql-container/`: starts the pinned `libsql-server`, returns a Drizzle client, applies migrations. Include a test asserting its tag equals the one in `compose.yaml` (TDD: test → impl)
- [x] 3.2 `createDatabase(env)` in `src/adapters/persistence/turso/database/` (`server-only`) and the empty `schema/schema.ts` (TDD: test → impl)
- [x] 3.3 Generate the Better Auth tables (`user`, `session`, `account`, `verification`, `rate_limit`) into the Drizzle schema, run `db:generate` for the first migration, and add an integration test that migrates a fresh container and asserts every table exists (TDD: test → impl)
- [x] 3.4 `scripts/db-seed.ts` (verified learner `learner@example.com` with a known password) and `scripts/db-reset.ts`, wired as `db:seed` and `db:reset` (TDD: test → impl on the seed's pure user-builder)

## 4. Email

- [x] 4.1 `EmailSender` interface and `EmailDeliveryError` in `src/adapters/email/email-sender.ts` (types only, no TDD)
- [x] 4.2 `SmtpEmailSender` in `src/adapters/email/smtp-email-sender/`: sends HTML plus text, and reports refusals as `Err`. Integration test against a Mailpit testcontainer, reading the message back through its API (TDD: test → impl)
- [x] 4.3 `Emails.VerifyEmail.*` and `Emails.ResetPassword.*` keys in `en`, `es` and `pt` (content, covered by 4.4 and 4.5 tests)
- [x] 4.4 `verify-email` and `reset-password` React Email templates with `PreviewProps`. Tests assert copy, a button with the URL, and the URL as text (TDD: test → impl)
- [x] 4.5 `localeFromActionUrl` and `composeAccountEmail(kind, { url, locale })` in `src/lib/account-emails/`: `createTranslator`, then `render` and `toPlainText`, one test per locale (TDD: test → impl)

## 5. Auth core

- [x] 5.1 `getAuth()` in `src/lib/auth/`: Better Auth with the Drizzle adapter, email/password (verification required, 8–128, revoke on reset), Google, linking with `google` trusted, rate limit on database storage, `captcha` (Turnstile), and `nextCookies` last. Email callbacks go through `composeAccountEmail` and `SmtpEmailSender` (TDD: test → impl)
- [x] 5.2 Integration tests against libSQL and Mailpit containers: sign-up sends a verification email in the callback's locale; unverified sign-in is refused; verification signs in; reset replaces the password and revokes sessions; a request without a captcha token is refused (TDD: test → impl)
- [x] 5.3 Route handler `src/app/api/auth/[...all]/route.ts` (`toNextJsHandler`) and `authClient` in `src/lib/auth-client/` (thin wiring, covered by 5.2 and e2e)

## 6. Session gate

- [x] 6.1 `isPersonalPath` in `src/lib/personal-routes/`, and `isSignInReturnPath` / `signInPath(locale, next)` in `src/lib/sign-in-return-path/` (TDD: test → impl)
- [x] 6.2 Proxy gate: export `sessionGate(request)` and compose it before `createMiddleware(routing)` in `src/proxy.ts`. Personal path without a cookie → redirect with `next`, including the query. Everything else unchanged (TDD: test → impl)
- [x] 6.3 `requireLearnerSession()` in `src/lib/auth/require-learner-session/`: validates through `auth.api.getSession` and redirects otherwise. Call it from `courses/layout.tsx` and from new `layout.tsx` files for `learning`, `achievements`, `profile` and `start` (TDD: test → impl)

## 7. Account UI

- [x] 7.1 `Account.*` messages in `en`, `es` and `pt`: pages, fields, buttons, confirmations, and `errors.<better-auth code>` with a generic fallback (content, covered by component tests)
- [x] 7.2 `accountErrorKey(code)` mapping in `src/lib/account-error-key/` (TDD: test → impl)
- [x] 7.3 `TurnstileChallenge` component with story, test and JSDoc (TDD: test → impl)
- [x] 7.4 `AccountShell` layout component (heading, card, footer links) with story, test and JSDoc (TDD: test → impl)
- [x] 7.5 `GoogleSignInButton` (calls `authClient.signIn.social` with a locale-qualified `callbackURL`) with story, test and JSDoc (TDD: test → impl)
- [x] 7.6 `SignUpForm`: Zod validation, token forwarding, "check your inbox" state. Story, test and JSDoc (TDD: test → impl)
- [x] 7.7 `SignInForm`: one message for any wrong-credentials case, the unverified-email message, redirect to the validated `next`. Story, test and JSDoc (TDD: test → impl)
- [x] 7.8 `ForgotPasswordForm` (same confirmation whatever the address) and `ResetPasswordForm` (invalid-token state with a re-request link). Stories, tests and JSDoc (TDD: test → impl)
- [x] 7.9 Pages under `src/app/[locale]/(account)/`: `sign-in`, `sign-up`, `forgot-password`, `reset-password`. Each has `noindex` metadata and redirects to `/learning` when already signed in (TDD: test → impl on metadata and redirect)
- [x] 7.10 `SiteHeader`: `signedIn` prop from the locale layout, Sign in link when anonymous, Sign out item in the avatar menu (`authClient.signOut`, then home). Update the stories (TDD: test → impl)

## 8. Search

- [x] 8.1 Sitemap lists only the home per locale, with alternates (TDD: test → impl)

## 9. End-to-end

- [x] 9.1 Playwright global setup that fails fast with the exact `docker compose up -d && pnpm db:migrate` hint when libSQL at `127.0.0.1:8081` does not answer (config, no TDD)
- [x] 9.2 `e2e/learner-account-fixture.ts` (sign-up over HTTP, verify via SQL, sign-in into the context). Rebase `learner-profile-fixture.ts` and every spec that opens a personal route on it (test infrastructure)
- [x] 9.3 `e2e/learner-account.spec.ts`: anonymous redirect with `next`; sign-up → Mailpit → verification link → lands signed in; forgot → Mailpit → reset → new password works; sign-out; the Google button targets `accounts.google.com` (TDD: spec first, red, then fix)
- [x] 9.4 Update `course-onboarding-gate.spec.ts` for the session-then-profile order (TDD: spec first)

## 10. Verification

- [x] 10.1 Run `pnpm verify` (typecheck, format, lint, `test:run` including the container suites with Docker up) and `pnpm test:e2e --project=chromium` against the Compose stack, and check the account pages in the browser with Playwright MCP
