## Why

Once progress, profile and rewards are stored per account, the app holds personal data (an email
address, a name, a learning history) with no way for the learner to remove it. A learner must be
able to delete their account and everything tied to it, without writing to anyone. The previous
changes declared every learner table `ON DELETE CASCADE` so this could stay small.

## What Changes

- **A "Delete account" section on the Profile page.** It opens a confirmation dialog that states
  what will be lost (progress, tickets, prizes, profile) and that deletion cannot be undone.
- **Email confirmation.** Confirming sends a localized "confirm account deletion" email (React
  Email, same SMTP path). The account is deleted only when the learner, still signed in, follows the
  link. This works the same for password and Google accounts, with no re-authentication step.
- **Deletion removes everything.** The user row goes, and the cascade removes sessions, linked
  accounts and every learner table. The learner lands on a public `/[locale]/account-deleted` page,
  signed out, and the device-local pending-prize flag is cleared.
- **Better Auth `user.deleteUser`** is enabled with `sendDeleteAccountVerification`.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `learner-account`: adds requesting, confirming and completing account deletion.
- `transactional-email`: adds the `delete-account` template.
- `profile-page`: adds the Delete account section and its confirmation dialog.

## Non-goals

- A grace period or undo. Deletion is immediate once confirmed.
- Exporting the learner's data before deletion.
- Admin-side deletion or bulk deletion.
- Deleting device preferences (theme, seek step). They are not account data.

## Impact

- `src/lib/auth/auth.ts` (`user.deleteUser`), `src/emails/delete-account/`, `Emails.DeleteAccount.*`
  and `Profile.deleteAccount.*` and `Account.accountDeleted.*` messages in three locales.
- A new `DeleteAccountModal` (NiceModal + shadcn `Dialog`) and a `DeleteAccountSection` component,
  both with stories, tests and JSDoc. The `/[locale]/account-deleted` page.
- The e2e flow through Mailpit.
