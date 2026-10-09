## Why

Sentry issue `ENGLISH-COURSE-4` (production, 2026-10-06): `Error: Greeting never received`, raised by nodemailer inside `POST /api/auth/reset-password` and reported by the SMTP sender. A learner replaced their password through the emailed link and the notice that says "your password was changed" never left the server.

The notice is sent fire-and-forget:

```ts
void sendAccountEmail("password-changed", to, recovery).catch(…);
```

That satisfies the spec's "the notice SHALL NOT block the response", and it works on a long-lived server, which is what development and the integration tests are. Production is a Vercel function. Once the response is out, nothing tells the platform that work is still pending, so the invocation can be suspended with the SMTP connection half-open. The event is consistent with exactly that: the request's last database call is at 03:28:01, and nodemailer's 30-second greeting timer fires at 03:28:38 — seven seconds later than a timer on a running process would, which is what a suspended instance thawing onto a dead socket looks like. The timing is an inference; the unregistered send is a fact of the code.

**What was reproduced, and what was not** (locally, 2026-10-09, against `develop`): with the local mail server frozen so that it accepts the connection and never greets — the condition in the event — a request whose email is awaited (`/request-password-reset`) hangs, while `/change-password` answers `200` in 0.2 s with its notice still unsent. The notice arrived only once the mail server was thawed. That proves the response does not wait for the send and nothing else holds it. It does **not** prove the production event was a suspended invocation: a mail relay that was slow to connect and then silent would produce the same error and the same 37 seconds. The suspension itself can only be observed on Vercel. Either way the send is unprotected, and this change removes that exposure; if the relay was at fault, the issue can recur and a retry becomes the next question.

This is the one email in the application that exists for security, and it is the only one sent this way. Every other account email is awaited by Better Auth and arrives.

## What Changes

- The password-changed notice is still sent without making the learner wait for the mail server, but the send is now **registered with the platform**, so the invocation stays alive until the mail server has answered.
- The auth configuration takes the "run this once the response is out" capability as an injected dependency, like its database and email sender. Production wires it to Next's `after()`; the integration tests wire a runner they control.
- Both routes that replace a password get the fix, because they share one helper: the reset link (`onPasswordReset`) and the Profile form (the `/change-password` after-hook).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `learner-account`: "A completed password change notifies the account" said only that the notice must not block the response. It now also says the notice must outlive the response.

## Impact

- **Modified**: `src/lib/auth/auth.ts` (`AuthDependencies`, `notifyPasswordChanged`, `dependenciesFromEnv`), `src/lib/auth/auth.test.ts`.
- **Spec**: `openspec/specs/learner-account/spec.md`.
- No new dependency: `after` ships with `next` 16.2.9.
- No schema, message-catalogue or UI change.

## Non-goals

- **Awaiting the notice inside the request.** It would also fix the loss, and it is simpler, but it puts an SMTP round trip in front of every password change, which the spec forbids on purpose.
- **Retrying a failed send.** A mail server that is down stays a reported, handled error. This change is about a send that was never given the chance to finish.
- **Moving Better Auth's own emails to the background.** `advanced.backgroundTasks` would do that for the reset link and the verification email. They are awaited today and they arrive; changing their timing is a separate decision with its own trade-off (enumeration timing versus response time).
- **Replacing SMTP with Resend's HTTP API.** One transport in every environment is a stated property of `transactional-email`.
