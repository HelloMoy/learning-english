## ADDED Requirements

### Requirement: A learner changes their password from a signed-in session

A learner whose account has a password SHALL be able to replace it without signing out. The request
SHALL carry the current password and the new one, and SHALL be refused unless the current password is
correct. The new password SHALL hold between 8 and 128 characters, checked in the browser before the
request leaves and again on the server. A successful change SHALL revoke the account's other sessions
and keep the one that made the change signed in. Every refusal SHALL show a localized message; a wrong
current password SHALL be named as such rather than reported as a generic failure.

An account that signs in only through Google has no password to verify the request with, so it SHALL
NOT be offered this flow, and a request made for such an account SHALL be refused.

#### Scenario: The new password replaces the old one
- **WHEN** a signed-in learner submits their correct current password and a valid new one
- **THEN** the change is confirmed, they stay signed in, signing in with the new password succeeds and signing in with the old one fails

#### Scenario: A wrong current password changes nothing
- **WHEN** the current password field holds the wrong password
- **THEN** the form says the current password is incorrect and the stored password is unchanged

#### Scenario: A short new password is refused before submitting
- **WHEN** the new password field holds 7 characters
- **THEN** the form shows the length error and sends nothing

#### Scenario: Other sessions are signed out
- **WHEN** the learner changes the password while a session from another browser is open
- **THEN** that other session no longer opens `/en/learning`, and the browser that made the change still does

#### Scenario: A Google-only account is not offered a password change
- **WHEN** a learner who only ever signed in with Google opens `/en/profile`
- **THEN** no change-password form is offered

### Requirement: A learner changes their email address by confirming on the old address and verifying on the new one

A learner whose account has a password SHALL be able to move it to a different email address. The
change SHALL take two links and SHALL NOT take effect before both are followed:

1. Submitting a new address SHALL send a confirmation email, in the active locale, to the address the
   account is registered with today. It names the requested address. Nothing changes yet.
2. Following that link SHALL send a verification email, in the same locale, to the requested address.
3. Following that second link SHALL set the account's address to the requested one, mark it verified,
   and keep the learner signed in.

Submitting an address that already belongs to another account SHALL produce the same confirmation the
learner sees for an unused address, and SHALL send nothing to that other account, so the form cannot be
used to discover who is registered. Submitting the address the account already holds SHALL be refused
with a localized message. An account that signs in only through Google SHALL NOT be offered this flow:
its address is the provider's.

After the address changes, signing in with the password SHALL require the new address, and the old one
SHALL no longer sign in.

#### Scenario: The first email goes to the address on file
- **WHEN** a learner registered as `ana@example.com` asks to move to `ana.g@example.com` from `/es/profile`
- **THEN** the page confirms that a link was sent to `ana@example.com`, Mailpit holds one Spanish email for `ana@example.com` naming `ana.g@example.com`, and nothing was sent to `ana.g@example.com`

#### Scenario: Confirming on the old address asks the new one to verify
- **WHEN** the learner opens the confirmation link from `ana@example.com`
- **THEN** Mailpit holds a verification email for `ana.g@example.com`, and the account's address is still `ana@example.com`

#### Scenario: Verifying on the new address completes the move
- **WHEN** the learner opens the verification link from `ana.g@example.com`
- **THEN** the account's address is `ana.g@example.com`, it is verified, and `/en/profile` names it

#### Scenario: Signing in follows the new address
- **WHEN** the learner signs in with their password after the change
- **THEN** `ana.g@example.com` signs in and `ana@example.com` does not

#### Scenario: A taken address is answered like a free one
- **WHEN** the learner submits an address that already belongs to another account
- **THEN** the page shows the same confirmation, and that other account receives no email

#### Scenario: The current address is refused
- **WHEN** the learner submits the address the account already holds
- **THEN** the form says the address is already theirs and sends nothing

#### Scenario: A Google-only account is not offered an email change
- **WHEN** a learner who only ever signed in with Google opens `/en/profile`
- **THEN** the page names their Google address and offers no change-email form
