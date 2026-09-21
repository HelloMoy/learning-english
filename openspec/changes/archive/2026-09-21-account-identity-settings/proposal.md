## Why

A learner types their name once on the sign-up form and then, minutes later, is asked for it
again on an empty learner card — the app already knows the answer and does not use it. And once
the account exists there is nowhere to see or change the two things that identify it: the address
it is registered with and the password that opens it. A learner who wants a new password today has
to sign out and pretend to have forgotten the old one; a learner who wants a new address cannot get
one at all.

## What Changes

- Onboarding step 1 opens with the learner card's name field already holding the name the account
  was created with (typed on sign-up, or supplied by Google). The learner can clear it or rewrite
  it; everything else about the step is unchanged.
- Onboarding step 2 gains the same editable name field inside the card it already shows, so a
  learner who sees the name on the card at step 2 can fix it there instead of going back.
- The Profile page gains an **Account** section that names the address the learner is signed in
  with and how they sign in (email and password, Google, or both).
- That section lets a learner with a password change it: current password, new password, and every
  other session is signed out on success.
- That section lets a learner with a password change their address, through Better Auth's
  confirm-then-verify flow: a confirmation link goes to the **current** address first, and only
  after it is opened does a verification link go to the new one. The address changes when that
  second link is opened. An address that already belongs to another account is answered exactly
  like one that does not, so the form cannot be used to discover who is registered.
- A learner whose only sign-in method is Google sees their Google address and is told the address
  is managed there; no password or email form is offered, because there is no password to verify
  the request with.
- A new localized `change-email` email template carries the confirmation link and names the address
  the change would move to.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `learner-onboarding`: step 1 seeds the card's name field from the account's name; step 2 gains an
  editable name field on its card and saves it with the avatar.
- `profile-page`: a new Account section showing the address and the sign-in methods, and holding the
  change-password and change-email forms.
- `learner-account`: two new account-security flows — changing the password from a signed-in
  session, and changing the email address by confirming on the current address and verifying on the
  new one — plus the rule that both are offered only to an account that has a password.
- `transactional-email`: a `change-email` template, localized, that names the new address and
  states that ignoring it leaves the address unchanged.

## Impact

- `src/lib/auth/auth.ts` — enable `user.changeEmail` with `sendChangeEmailConfirmation`, and add the
  `change-email` kind to the account email sender.
- `src/lib/account-emails/account-emails.tsx` — a third template kind, and the ability to pass values
  (the new address) into the message.
- `src/emails/change-email/` — the new React Email template.
- `src/lib/auth/` — a server helper that reports the signed-in account's name, address and linked
  sign-in providers, built on `getSession` and `listUserAccounts`.
- `src/components/onboarding-name-step/`, `src/components/onboarding-avatar-step/`,
  `src/app/[locale]/start/**` — the seeded and editable name.
- `src/components/profile-view/` plus new `change-password-section` and `change-email-section`
  components, and `src/app/[locale]/profile/page.tsx` to feed them the account.
- `src/lib/account-form-schemas/`, `src/lib/account-error-key/` — schemas and refusal keys for the
  two new forms.
- `src/messages/{en,es,pt}.json` — `Profile.account.*`, `Profile.password.*`, `Profile.email.*`,
  `Emails.ChangeEmail.*` and the new validation and error keys.
- `e2e/` — a spec covering both flows end to end against Mailpit.

## Non-goals

- Setting a first password for an account that only signs in with Google, and linking or unlinking
  sign-in providers from the Profile page.
- Two-factor authentication, a session list, or a "sign out everywhere" control of its own.
- Changing what the learner card's name means: it stays the card's name, saved with the profile.
  Editing it does not rename the account, and renaming the account does not rewrite an existing card.
- Any change to the sign-up, sign-in, forgot-password or delete-account flows.
