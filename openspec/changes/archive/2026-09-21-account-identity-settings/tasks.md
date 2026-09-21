## 1. Reading the account's identity

- [x] 1.1 Add `currentAccount()` in `src/lib/auth/current-account/current-account.ts`, returning the
      signed-in account's name, email and sign-in methods (`password`, `google`), or `null`.
      (TDD: test → impl) — mirror `current-learner-snapshot.test.ts`; cover no session, password only,
      Google only, both, and an unknown `providerId` being dropped.
- [x] 1.2 JSDoc `currentAccount`, `LearnerAccountIdentity` and `SignInMethod` for TypeDoc.

## 2. Schemas and refusal messages

- [x] 2.1 Add `changePasswordSchema` (current + new password) and `changeEmailSchema` (new address) to
      `src/lib/account-form-schemas/account-form-schemas.ts`, reusing the shared `password` and `email`
      pieces. (TDD: test → impl)
- [x] 2.2 Map `INVALID_PASSWORD → invalidPassword` and `CREDENTIAL_ACCOUNT_NOT_FOUND → noPassword` in
      `src/lib/account-error-key/account-error-key.ts`. (TDD: test → impl)
- [x] 2.3 Add `Account.errors.invalidPassword`, `Account.errors.noPassword` and
      `Account.validation.emailUnchanged` to `src/messages/{en,es,pt}.json`.

## 3. The change-email transactional email

- [x] 3.1 Let `composeAccountEmail` take values and pass them to every `t(key, values)` call, and add the
      `change-email` kind pointing at the new template and the `Emails.ChangeEmail` namespace.
      (TDD: test → impl) — extend `src/lib/account-emails/account-emails.test.ts`.
- [x] 3.2 Add `src/emails/change-email/change-email.tsx` with preview props, one call-to-action link
      printed as button and text, mirroring `delete-account`. (TDD: test → impl)
- [x] 3.3 Add `Emails.ChangeEmail.*` to `src/messages/{en,es,pt}.json`, with `{newEmail}` in the body and
      an `ignore` line saying the address stays as it is.

## 4. Enabling the email change in Better Auth

- [x] 4.1 Enable `user.changeEmail` with `sendChangeEmailConfirmation` in `createAuth`, sending the
      `change-email` email to the account's current address and naming the requested one.
      (TDD: test → impl) — extend `src/lib/auth/auth.test.ts`.
- [x] 4.2 Update the `createAuth` JSDoc to state the confirm-then-verify flow.

## 5. The onboarding name

- [x] 5.1 Extract the card's name input into
      `src/components/learner-card-name-field/learner-card-name-field.tsx`, with colocated stories, tests
      and JSDoc. (TDD: test → impl)
- [x] 5.2 Give `OnboardingNameStep` an `accountName` prop that seeds the field's initial value, blank
      names included. (TDD: test → impl)
- [x] 5.3 Pass `currentAccount()`'s name from `src/app/[locale]/start/page.tsx` into the step.
- [x] 5.4 Give `OnboardingAvatarStep` the same editable name field, seeded from the stored profile,
      saving name and avatar together on Continue and disabling Continue on a blank name.
      (TDD: test → impl)
- [x] 5.5 Add `Onboarding.avatar.*` keys for the step-2 field to `src/messages/{en,es,pt}.json` if step 1's
      existing keys do not cover it, and update the steps' JSDoc.

## 6. The Profile page's Account section

- [x] 6.1 Add `src/components/account-section/account-section.tsx`: the address as text, the sign-in
      methods, the Google-managed note, and the two forms only when the account has a password. Stories,
      tests and JSDoc colocated. (TDD: test → impl)
- [x] 6.2 Add `src/components/change-password-section/change-password-section.tsx` calling
      `authClient.changePassword` with `revokeOtherSessions: true`, clearing both fields and announcing a
      status on success, showing an alert and keeping the values on refusal. Stories, tests, JSDoc.
      (TDD: test → impl)
- [x] 6.3 Add `src/components/change-email-section/change-email-section.tsx` calling
      `authClient.changeEmail` with a locale-qualified `/profile` callback, refusing the current address
      before submitting, and replacing the form with a confirmation naming the address on file. Stories,
      tests, JSDoc. (TDD: test → impl)
- [x] 6.4 Render the section in `ProfileView` between the card form and the delete-account section, from
      a new `account` prop. (TDD: test → impl)
- [x] 6.5 Pass `currentAccount()` from `src/app/[locale]/profile/page.tsx` into `ProfileView`.
- [x] 6.6 Add `Profile.account.*`, `Profile.password.*` and `Profile.email.*` to
      `src/messages/{en,es,pt}.json`.

## 7. End to end

- [x] 7.1 Add `e2e/account-identity.spec.ts` covering the password change: the new password signs in, the
      old one does not, and a session opened in another context before the change can no longer reach
      `/en/learning`. (TDD: spec → impl already in place)
- [x] 7.2 Extend it with the address change: the Spanish confirmation reaches the address on file and
      names the new one, opening it mails the new address, opening that one moves the account, and
      signing in follows the new address.
- [x] 7.3 Extend it with the enumeration case: a `newEmail` that belongs to another account gets the same
      confirmation and leaves that account's inbox empty.

## 8. Verification

- [x] 8.1 Run `pnpm verify` (typecheck, format, lint, `pnpm test:run`) and fix every failure.
- [x] 8.2 Run `pnpm test:e2e` for the touched specs (`account-identity`, `learner-account`,
      `account-deletion`, `course-onboarding-gate`) and fix every failure.
- [x] 8.3 Verify both flows and both onboarding steps in the browser with Playwright MCP, in `es`.
- [x] 8.4 Run `/opsx:verify` for this change.
