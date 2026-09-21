## 1. The locale carried by an app link

- [x] 1.1 Let `localeFromActionUrl` read the locale from the link's first path segment when it
      carries no `callbackURL`, keeping `callbackURL` as the preferred source and the default locale
      as the last resort. (TDD: test → impl)

## 2. The password-changed email

- [x] 2.1 Add `Emails.PasswordChanged.*` to `src/messages/{en,es,pt}.json`: the change, the sign-out
      of other devices, and a closing line that tells a learner who did not do it to recover the
      account through the link.
- [x] 2.2 Add `src/emails/password-changed/password-changed.tsx` with preview props and the routine
      action, mirroring `verify-email`. (TDD: test → impl)
- [x] 2.3 Add the `password-changed` kind to `composeAccountEmail`. (TDD: test → impl)
- [x] 2.4 Assert in the template's test that neither the HTML nor the plain text holds a `token`
      parameter. (TDD: test → impl)

## 3. The locale the learner acted in

- [x] 3.1 Have `useAccountSubmission` send `x-app-locale` on every account request, beside the
      Turnstile header. (TDD: test → impl)

## 4. Notifying on both routes

- [x] 4.1 Add a `notifyPasswordChanged` helper beside the auth instance that composes the notice for
      an address and a locale, links it to `/[locale]/forgot-password`, and logs rather than throws
      when the send fails. (TDD: test → impl)
- [x] 4.2 Wire `emailAndPassword.onPasswordReset` to it, reading the locale from the request header.
      (TDD: integration test → impl)
- [x] 4.3 Wire a `hooks.after` middleware filtered to `/change-password` to it, sending only when
      `ctx.context.returned` is the success body and taking the address from it.
      (TDD: integration test → impl)
- [x] 4.4 Cover the refusals: a wrong current password and a replayed reset token each notify
      nobody. (TDD: integration test → impl)
- [x] 4.5 Update the `createAuth` JSDoc to state both notice triggers.

## 5. End to end

- [x] 5.1 Extend `e2e/account-identity.spec.ts`: changing the password from `/es/profile` leaves a
      Spanish notice whose link opens `/es/forgot-password`.

## 6. Verification

- [x] 6.1 Run `pnpm verify` and fix every failure.
- [x] 6.2 Run `pnpm test:e2e` for `account-identity` and `learner-account`, and fix every failure.
- [x] 6.3 Send the notice to Mailpit and check it in the browser, in `es`.
- [x] 6.4 Run `/opsx:verify` for this change.
