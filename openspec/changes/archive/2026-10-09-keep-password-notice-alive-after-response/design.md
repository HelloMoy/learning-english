## Context

`createAuth(dependencies)` in `src/lib/auth/auth.ts` builds the Better Auth instance from injected ports: a database, an `EmailSender`, secrets. `notifyPasswordChanged` is a closure inside it, called from two places:

- `emailAndPassword.onPasswordReset` — Better Auth **awaits** this callback (`await ctx.context.options.emailAndPassword.onPasswordReset(...)`, better-auth 1.7.5), but the callback returns `Promise.resolve(notifyPasswordChanged(...))`, and `notifyPasswordChanged` returns `void`. Nothing is awaited.
- the `hooks.after` middleware for `/change-password`, which calls it and returns.

Both therefore leave an unobserved promise running after the response. `src/app/api/auth/[...all]/route.ts` is a Route Handler on Vercel; the platform has no reason to keep the invocation alive.

`src/lib/auth/auth.test.ts` is an integration suite: a libsql container, a Mailpit container, a siteverify stub, and `createAuth` called directly with them. It never runs inside a Next request.

## Goals / Non-Goals

**Goals:**

- The notice is delivered in production.
- The learner still does not wait for the mail server.
- A failed notice still never fails the password change.
- The rule is expressed in the type, so the next after-response email cannot be written as a bare `void`.

**Non-Goals:**

- Retries, queues, or a different transport.
- Changing when Better Auth's own emails are sent.

## Decisions

### 1. Inject the after-response runner; do not call `after()` inside `createAuth`

`AuthDependencies` gains one member:

```ts
/** Runs work once the response is out, keeping the invocation alive until it settles. */
afterResponse: (work: () => Promise<void>) => void;
```

`dependenciesFromEnv` wires it to `after` from `next/server`, whose signature it already matches.

`after()` throws when called outside a request scope (`` `after` was called outside a request scope ``, Next 16.2.9 docs). The integration suite calls `createAuth` outside one, so a direct import would break every notifying test — and would make `auth.ts` depend on being inside Next to be constructed at all. Injection is also how this module already treats everything else that touches the outside world.

**Alternative — `waitUntil` from `@vercel/functions`.** Does the same job, but adds a dependency and names the host in application code. `after()` uses the platform's `waitUntil` on Vercel and simply runs the work after the response on a long-lived server (`next start`, development), so one call is right everywhere.

**Alternative — Better Auth's `advanced.backgroundTasks.handler`.** It only reaches promises Better Auth itself creates. `onPasswordReset` receives no context to hand a promise to, and enabling it would also move the reset and verification emails to the background, which is out of scope.

**Alternative — await the send.** Rejected by the spec ("waits for the change, not for the mail server").

### 2. `notifyPasswordChanged` registers work; it does not start it

```ts
const notifyPasswordChanged = (to: string, locale: string): void => {
  dependencies.afterResponse(() => sendPasswordChangedNotice(to, locale));
};
```

The work is a thunk, so nothing touches SMTP until the platform runs it. The existing `catch` that logs and swallows moves inside the work: a rejected after-response task must not surface as an unhandled rejection, and the sender has already reported the failure to Sentry.

`onPasswordReset` keeps returning a resolved promise; the Better Auth type asks for one.

### 3. The request scope is present at both call sites

Both calls happen inside Better Auth's handler, which runs inside the Route Handler (`/api/auth/*`) or inside a Server Action that calls `auth.api.*`. `after()` is supported in both. If a future caller invokes these endpoints from a script, `after()` will throw loudly rather than drop the email silently — the better failure.

## Risks / Trade-offs

- [The wiring line `afterResponse: after` is production-only] → covered by a unit test of `dependenciesFromEnv` with the environment and database modules stubbed, asserting the injected runner is Next's `after`. Without it, the type would be satisfied by any function, including the bug.
- [`after()` semantics change in a Next upgrade] → the dependency is one line; the integration suite does not depend on Next at all.
- [The work runs after the response, so an error can no longer reach the learner] → already true today, and intended. Failures reach Sentry through the sender.
- [The fix cannot be observed in Sentry directly — "no new event" is weak evidence] → verify on the `develop` preview by replacing a throwaway learner's password and confirming the notice arrives.

## Testing strategy

| Behaviour | Layer | Where |
| --- | --- | --- |
| A completed reset registers exactly one piece of after-response work, and nothing is sent until it runs | Vitest integration (testcontainers) | `src/lib/auth/auth.test.ts`, next to "a completed reset notifies the account too" |
| A completed Profile change does the same | Vitest integration | same file, next to "a completed password change notifies the account…" |
| A refused change and a spent reset token register nothing | Vitest integration | same file, next to the two "notifies nobody" tests |
| Running the registered work delivers the localized notice | Vitest integration | same assertions the suite already makes against Mailpit |
| Production injects Next's `after` | Vitest unit | `src/lib/auth/auth.test.ts`, a separate `describe` that does not need Docker |

The suite's `buildAuth` takes the runner as an option. The existing notice tests keep an immediate runner (`(work) => void work()`), so they still read the email from Mailpit; the new tests use a recording runner that holds the work, which is what makes "registered, not started" assertable without waiting on a clock.

No component or e2e layer: nothing a learner can see changes.

## Migration Plan

Ships with a normal deploy. No data, no environment variable. Rollback is a revert.

## Open Questions

None.
