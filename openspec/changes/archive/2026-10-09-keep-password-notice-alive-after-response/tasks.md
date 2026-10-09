## 1. The dependency

- [x] 1.1 (TDD: test → impl) `auth.test.ts`: give `buildAuth` an `afterResponse` option defaulting to an immediate runner, and add the failing test "a completed reset hands the notice to the after-response runner": with a recording runner, the reset answers 200, exactly one piece of work is registered, and running it puts the Portuguese notice in Mailpit.
- [x] 1.2 Add `afterResponse` to `AuthDependencies` with JSDoc, and make `notifyPasswordChanged` register the send through it instead of starting it. The log-and-swallow `catch` moves inside the registered work.

## 2. Both routes, and the refusals

- [x] 2.1 (TDD: test → impl) Same file: a completed change from the Profile endpoint registers exactly one piece of work, and running it delivers the notice in the locale the request stated.
- [x] 2.2 (TDD: test → impl) Same file: a change refused for the wrong current password registers nothing.
- [x] 2.3 (TDD: test → impl) Same file: replaying a spent reset token registers nothing a second time.
- [x] 2.4 (TDD: test → impl) Same file: work whose send fails settles without rejecting, so the platform never sees an unhandled rejection.

## 3. Production wiring

- [x] 3.1 (TDD: test → impl) A `describe` that needs no Docker: with the environment and database modules stubbed, the dependencies built for production carry Next's `after` as their runner.
- [x] 3.2 Wire `afterResponse: after` (from `next/server`) in `dependenciesFromEnv`.
- [x] 3.3 Update the `createAuth` remarks: the notice is deferred to after the response, not abandoned.

## 4. Verification

- [x] 4.1 Walk the `clean-code` checklist over the touched functions.
- [x] 4.2 Run `pnpm test:run src/lib/auth` with Docker up, so the integration suite is not skipped, then `pnpm verify`.
- [ ] 4.3 On the `develop` preview, replace a throwaway learner's password through the reset link and confirm the notice arrives.
- [ ] 4.4 After the production deploy, resolve `ENGLISH-COURSE-4` in Sentry.
