## Why

A password is the one credential that opens everything a learner has, and today it can be replaced
in complete silence. Someone who gets hold of a live session can change the password from the
Profile page, and someone who gets hold of the inbox can reset it through the emailed link; in both
cases the owner learns nothing until they are already locked out, with no idea when it happened or
what to do about it.

The account already emails the learner about everything else that matters — verifying an address,
resetting a password, deleting the account, moving to a new address. The one event that ends with a
different password and every other device signed out is the one it says nothing about.

## What Changes

- Every completed password change SHALL email the account's address to say so. Both routes qualify:
  the change-password form on the Profile page, and a reset completed through the emailed link.
- The notice names what happened and when, and says that the other devices were signed out, so a
  learner who did it recognises it at a glance and one who did not sees the moment it happened.
- Its one link goes to `/[locale]/forgot-password` — the page where a learner asks for a reset — and
  **not** to a reset token. A notice that carried a ready-made key would hand the account to whoever
  is reading the inbox, which is exactly who the notice is warning about.
- A refused attempt SHALL send nothing. Better Auth runs its `after` hooks even when the endpoint
  answered with an error, so the notice is sent only when the request actually succeeded; otherwise
  a stolen session could flood the owner's inbox by submitting wrong passwords.
- A new localized `password-changed` email template, in `en`, `es` and `pt`.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `learner-account`: a completed password change — from the Profile form or from a reset link —
  notifies the account's address, and a refused attempt notifies nobody.
- `transactional-email`: a `password-changed` template, localized, whose link opens the
  forgot-password page rather than carrying a reset token.

## Impact

- `src/lib/auth/auth.ts` — `emailAndPassword.onPasswordReset` for the reset route, and a
  `hooks.after` middleware filtered to `/change-password` for the Profile route, both guarded
  against the error case.
- `src/lib/account-emails/account-emails.tsx` — the `password-changed` kind.
- `src/emails/password-changed/` — the new React Email template.
- `src/messages/{en,es,pt}.json` — `Emails.PasswordChanged.*`.
- `e2e/account-identity.spec.ts` and `e2e/learner-account.spec.ts` — the notice arriving on each
  route, and not arriving after a refusal.

## Non-goals

- Naming the device, browser or IP address the change came from. The app stores none of that today,
  and collecting it to put in an email is a privacy decision of its own.
- A notice for any other account event: signing in from a new device, linking or unlinking Google,
  or a session being revoked on its own.
- Letting the learner undo the change from the email, or freezing the account from it. The link
  offers the existing recovery route and nothing more.
- Changing what the password forms themselves do, or what they say on screen.
