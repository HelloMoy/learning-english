## Context

Four account emails exist today, all composed through `composeAccountEmail(kind, actionUrl, values)`
and rendered from the shared Immersion Cinema shell. Each is triggered by a Better Auth callback
that hands the composer a link, and the composer reads the locale out of that link's `callbackURL`
query parameter, because the callbacks run outside any request and have no intl context.

Two endpoints replace a password and neither says anything:

- `POST /change-password`, from the Profile form built in `account-identity-settings`. Better Auth
  offers no email callback for it at all.
- `POST /reset-password`, from the forgot-password link. Better Auth offers
  `emailAndPassword.onPasswordReset({ user }, request)`, which the app does not currently use.

Both revoke the account's other sessions, which is exactly the part a learner needs to be told
about: it is what they will notice first when their phone asks them to sign in again.

## Goals / Non-Goals

**Goals:**

- One notice, one template, both routes.
- Never send on a refused request, and never send anything that opens the account.
- Write the notice in the locale the learner was acting in.
- Keep the password forms as fast as they are now — the learner waits for the change, not the mail.

**Non-Goals:**

- Device, browser or IP details in the notice; the app collects none of that.
- Notices for any other event, or any way to act on the account from the email beyond the existing
  forgot-password page.

## Decisions

### Two hooks, because Better Auth only offers one

`emailAndPassword.onPasswordReset` covers `/reset-password` and is the supported callback for it.
`/change-password` has none, so it is covered by `hooks.after` — a `createAuthMiddleware` registered
on the auth instance and filtered to that one path.

_Alternative considered:_ `databaseHooks.account.update.after`, which would catch both routes in one
place. Rejected — it fires for every account-row update, including OAuth token refreshes, and would
have to reverse-engineer "was this a password change?" from the changed columns.

### The hook sends on the outcome, never on the attempt

Better Auth's dispatcher catches an endpoint's `APIError`, assigns it to `ctx.context.returned`, and
**then** runs the `after` hooks. So an after hook that does not check runs on failure too, and a
stolen session could fill the owner's inbox by submitting wrong passwords — turning a security
notice into a way to bury one.

The hook therefore sends only when `ctx.context.returned` is the endpoint's success body. That body
is `{ token, user }`, so it is also where the address comes from; no second read of the session is
needed, and the address is the one the server just acted on rather than one re-derived afterwards.

### The link is the forgot-password page, not a token

The notice exists for the case where the reader is not the person who made the change. Handing that
reader a live reset token would complete the takeover the email is warning about. The link is a
plain `/[locale]/forgot-password`, which asks for the address and mails a token to it — so only
someone who holds the address can go further, which is the whole point.

### The locale rides in the link's own path

`localeFromActionUrl` reads `?callbackURL=`, which is how Better Auth's own links carry it. This
notice's link has no query string: it is `https://host/es/forgot-password`, and its **first path
segment is already the locale**. The function gains that as a fallback, checked before the default.

No regression: today's links are all `/api/auth/...`, whose first segment is `api` and is not a
locale, so they keep falling through to the `callbackURL` reading and then to the default.

_Alternative considered:_ giving `composeAccountEmail` an explicit locale argument. Rejected — the
locale would then have two sources of truth, and a caller could pass one that disagrees with the
link it is sending.

### The client states the locale in a header

Neither hook can infer the locale: `/change-password` takes no `callbackURL`, and `/reset-password`
only carries a token. So the browser states it, in an `x-app-locale` header added centrally by
`useAccountSubmission` — the one place every account form already goes through to add the Turnstile
header. Every account request gains it; the two hooks are the only readers for now.

A missing or unknown value falls back to the default locale, so a request made outside the app's own
forms still produces a readable email.

_Alternative considered:_ the `Referer` header. Rejected — it is stripped by privacy settings and by
some proxies, and would fail exactly for the most privacy-conscious learners.

### Sending does not block the answer

The two hooks fire the send without awaiting it, and swallow-and-log a failure the way
`accountEmailSender` already logs one. A password change that succeeded must not be reported as
failed because the SMTP relay was slow, and the learner has nothing to do with the outcome of the
send.

## Risks / Trade-offs

- **The notice arrives after the learner is already signed out elsewhere** → Unavoidable: the
  revocation and the notice are triggered by the same request. The copy names the sign-out so the
  effect is explained rather than mysterious.
- **A send that fails leaves no notice** → Logged, not retried. Adding a retry queue for one email
  is more machinery than the risk justifies, and the learner is not blocked either way.
- **`x-app-locale` is client-supplied** → It only decides which of three shipped catalogues writes
  the email, and it is validated with `hasLocale` before use, so the worst a forged value does is
  pick the default.
- **Two hooks can drift apart** → Both call one `notifyPasswordChanged` helper, so the decision of
  what to send and where to link lives in one place; only the trigger differs.

## Testing strategy

Red before green on every task.

**Vitest unit** (colocated):

- `src/lib/account-emails/account-emails.test.ts` — extended: `localeFromActionUrl` reads a locale
  from an app path's first segment, still prefers `callbackURL` when both are present, and still
  defaults for `/api/auth/...`; the `password-changed` kind renders in that locale.
- `src/emails/password-changed/password-changed.test.tsx` — mirrors the other template tests: one
  link as button and as text, every copy line, plain text, preview props, the gold call to action,
  and that neither the HTML nor the text holds a `token` parameter.

**Vitest component + RTL**:

- `src/hooks/use-account-submission/use-account-submission.test.ts` — extended: every request
  carries `x-app-locale`, alongside the Turnstile header when challenged.

**Vitest integration** (`src/lib/auth/auth.test.ts`, against the libSQL and Mailpit containers,
under the suite timeout that file already sets):

- A successful `/change-password` puts one notice in the account's inbox, in the locale the header
  named, and its link has no token.
- A `/change-password` refused with the wrong current password puts nothing there.
- A successful `/reset-password` puts a notice there, in addition to the reset email.
- Replaying a spent reset token puts no second notice there.

**Playwright e2e** (`e2e/account-identity.spec.ts`, extended): changing the password from `/es/profile`
leaves a Spanish notice in the real Mailpit inbox whose link opens `/es/forgot-password`. The refusal
case stays at the integration layer, where counting an inbox that must not grow is deterministic.
