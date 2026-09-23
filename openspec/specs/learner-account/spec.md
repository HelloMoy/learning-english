# learner-account Specification

## Purpose
TBD - created by archiving change auth-and-database-foundation. Update Purpose after archive.
## Requirements
### Requirement: A learner signs up with email and password and verifies the address

The application SHALL offer a sign-up page at `/[locale]/sign-up` that takes a name, an email address and a password, and creates a learner account through Better Auth. The password SHALL hold between 8 and 128 characters. Submitting SHALL send a verification email in the active locale and show a "check your inbox" confirmation that names the address. It SHALL NOT sign the learner in.

An account whose email is not verified SHALL NOT be able to sign in with its password. Following the verification link SHALL verify the address, sign the learner in and open the validated `next` path, or `/[locale]/learning` when there is none.

Signing up with an address that already has an account SHALL NOT reveal that the account exists. The learner sees the same "check your inbox" confirmation.

From the moment the form is submitted until the confirmation replaces it, the wait SHALL be covered by the account wait indicator: the arc on the submit button, the beam across the card, the dimmed and inert fields, and the single announcement. See the `account-wait-indicator` capability.

#### Scenario: A new learner signs up
- **WHEN** a visitor submits `/en/sign-up` with a name, a new address and a valid password
- **THEN** the page confirms that a verification email was sent to that address, and Mailpit holds one English verification email for it

#### Scenario: An unverified learner cannot sign in
- **WHEN** a learner who has not followed the verification link signs in with the correct password
- **THEN** sign-in is refused with a message saying the address must be verified first

#### Scenario: Following the link signs the learner in
- **WHEN** the learner opens the verification link from the email
- **THEN** the address is verified, a session exists, and the learner lands on `/en/learning`

#### Scenario: A short password is refused before submitting
- **WHEN** the password field holds 7 characters
- **THEN** the form shows the length error and sends nothing

#### Scenario: The wait before the confirmation is covered
- **WHEN** the sign-up request is in flight
- **THEN** the name, email and password fields are dimmed and inert, the submit button shows its pending label with the arc, and the surface exposes exactly one `role="status"`

### Requirement: A learner signs in with email and password

The application SHALL offer a sign-in page at `/[locale]/sign-in` that signs a verified learner in with their email and password. On success it SHALL open the validated `next` path, or `/[locale]/learning` when there is none. A wrong email or a wrong password SHALL produce one and the same localized message, so the form never reveals which of the two was wrong.

From the moment the form is submitted until the navigation takes the page away, the wait SHALL be covered by the account wait indicator. Once the credentials are accepted the form SHALL NOT come back: the indicator SHALL stay up across the gap between the response and the navigation, so the form does not flash back into view. Only a refusal SHALL return the form. The destination's own loading shell SHALL carry the wait from the navigation onwards.

#### Scenario: Correct credentials open the requested route
- **WHEN** a verified learner signs in from `/en/sign-in?next=%2Fcourses%2Fc`
- **THEN** a session exists and the learner lands on `/en/courses/c`

#### Scenario: Wrong credentials do not say which part was wrong
- **WHEN** a learner signs in with a registered address and a wrong password, and then with an unregistered address
- **THEN** both attempts show the same "email or password is incorrect" message

#### Scenario: The form does not flash back once the credentials are accepted
- **WHEN** the credentials request resolves successfully
- **THEN** the indicator stays up until the navigation takes the page, and the fields do not become live again

#### Scenario: A refusal returns the form with the learner's typing
- **WHEN** the credentials are refused
- **THEN** the fields are live again holding what was typed, and the refusal's message is shown

### Requirement: A learner signs in with Google

The sign-in and sign-up pages SHALL offer "Continue with Google". Completing Google's consent SHALL sign the learner in, creating the account on first use, and SHALL open the validated `next` path or `/[locale]/learning`. An account created through Google SHALL count as verified.

When the Google account's address already belongs to an email-and-password account, the two SHALL be linked into one account rather than creating a second one.

#### Scenario: First Google sign-in creates the account
- **WHEN** a visitor with no account completes Google sign-in
- **THEN** an account exists for that Google address, marked verified, and a session is open

#### Scenario: Google links to an existing password account
- **WHEN** a learner who signed up with `ana@example.com` and a password later completes Google sign-in as `ana@example.com`
- **THEN** there is still exactly one account for that address, and it can sign in both ways

### Requirement: A learner resets a forgotten password by email

The application SHALL offer `/[locale]/forgot-password`, which takes an email address and sends a password-reset email in the active locale. It SHALL show the same confirmation whether or not the address has an account. The email's link SHALL open `/[locale]/reset-password?token=<token>`, where a new password (8–128 characters) replaces the old one. A reset SHALL revoke the account's other sessions. An expired or already-used token SHALL show a localized error that offers to request a new email.

Both pages SHALL cover their wait with the account wait indicator, on the same terms as the other account forms.

#### Scenario: A reset email arrives in the learner's language
- **WHEN** a learner submits their address on `/es/forgot-password`
- **THEN** Mailpit holds one Spanish reset email whose link opens `/es/reset-password`

#### Scenario: The new password works and the old one does not
- **WHEN** the learner sets a new password through the link
- **THEN** signing in with the new password succeeds, and signing in with the old one fails

#### Scenario: An unknown address gets the same confirmation
- **WHEN** an address without an account is submitted
- **THEN** the page shows the same confirmation, and no email is sent

#### Scenario: A used link is refused
- **WHEN** the reset link is opened a second time after a successful reset
- **THEN** the page reports that the link is no longer valid and offers to send a new one

#### Scenario: Both waits are covered
- **WHEN** the reset-request or the new-password request is in flight
- **THEN** that page's fields are dimmed and inert, its button shows its pending label with the arc, and the page exposes exactly one `role="status"`

### Requirement: A learner signs out from the avatar menu

The avatar menu SHALL offer "Sign out". Signing out SHALL end the session on the server, clear its cookie and open the home page. A visitor without a session SHALL see a "Sign in" link in the header in place of the avatar menu.

#### Scenario: Signing out ends the session
- **WHEN** a signed-in learner chooses Sign out
- **THEN** they land on `/en`, and opening `/en/learning` sends them to sign-in

#### Scenario: An anonymous header offers sign-in
- **WHEN** a visitor without a session opens `/en`
- **THEN** the header shows a Sign in link and no avatar menu

### Requirement: Personal routes require a session

Every course, module and lesson route, and `/[locale]/learning`, `/[locale]/achievements`, `/[locale]/profile`, `/[locale]/start` and `/[locale]/start/avatar`, SHALL require a session. A request without a session cookie SHALL be redirected by the proxy to `/[locale]/sign-in?next=<path>`, where `<path>` is the requested path without the locale prefix and with its query string. Every such page SHALL also verify the session on the server before rendering anything personal, and SHALL redirect to `/[locale]/sign-in` when the cookie is present but the session is not valid. That server check runs in layouts, which do not know the requested path, so it carries no `next`.

The home page, the account pages, `/api/auth/**` and static assets SHALL stay reachable without a session.

#### Scenario: A lesson link without a session opens sign-in
- **WHEN** a visitor without a session opens `/en/courses/c/modules/m/lessons/l`
- **THEN** they land on `/en/sign-in?next=%2Fcourses%2Fc%2Fmodules%2Fm%2Flessons%2Fl`

#### Scenario: A forged cookie does not open the page
- **WHEN** a request carries a session cookie whose session does not exist
- **THEN** the server redirects it to sign-in and renders no personal content

#### Scenario: The home stays public
- **WHEN** a visitor without a session opens `/pt`
- **THEN** the home renders

### Requirement: Only internal personal paths are accepted as the sign-in return

The account pages SHALL treat `next` as valid only when it is one of the personal routes listed in "Personal routes require a session" (a course path, `/learning`, `/achievements`, `/profile`, `/start` or `/start/avatar`, optionally with a query string), and when it has no scheme, no host, no `//` sequence, no backslash and no `..` segment. An invalid or missing `next` SHALL be ignored, and the learner lands on `/[locale]/learning`.

#### Scenario: An external URL is ignored
- **WHEN** a learner signs in from `/en/sign-in?next=https%3A%2F%2Fevil.example`
- **THEN** they land on `/en/learning`

#### Scenario: A personal path is honoured
- **WHEN** a learner signs in from `/en/sign-in?next=%2Fachievements`
- **THEN** they land on `/en/achievements`

### Requirement: Account forms are protected against bots and bursts

The sign-up, sign-in and forgot-password forms SHALL carry a Cloudflare Turnstile challenge, and the server SHALL reject those requests when the challenge token is missing or invalid. Better Auth's rate limiting SHALL be enabled in production builds and stored in the database, so that limits hold across server instances. It SHALL stay off in development and in the e2e suite, where many parallel sign-ins share one address. Every refusal SHALL show a localized message rather than a raw error.

Local development and the e2e suite SHALL use Cloudflare's published always-pass test keys, so no real challenge is ever solved in automation.

#### Scenario: A request without a challenge token is refused
- **WHEN** a sign-in request reaches the server without a Turnstile token
- **THEN** it is refused, and no session is created

#### Scenario: Bursts are limited
- **WHEN** a production build's sign-in endpoint receives more attempts from one client than the configured window allows
- **THEN** further attempts are refused with a localized "too many attempts" message until the window passes, and the counter lives in the database

### Requirement: Account pages are localized and accessible

Every string on the account pages (labels, placeholders, buttons, confirmations, validation and server errors) SHALL come from the `Account.*` namespace of the active locale's messages in `en`, `es` and `pt`. Every field SHALL have a visible label. Errors SHALL be announced to assistive technology and linked to their field.

#### Scenario: Sign-in in Portuguese
- **WHEN** `/pt/sign-in` renders
- **THEN** its heading, labels, buttons and links render from `pt.json`

#### Scenario: A field error is announced
- **WHEN** the email field is submitted empty
- **THEN** the error text is referenced by the field's `aria-describedby` and announced in a live region

### Requirement: A learner deletes their account after confirming by email

A signed-in learner SHALL be able to request deletion of their account. The request SHALL send a confirmation email in the active locale and SHALL NOT delete anything by itself. Following the email's link while signed in to that same account SHALL delete the user and, through the database cascade, their sessions, linked sign-in methods, profile, completions, playback positions, continue-watching location, earned tickets and prize claims. The learner SHALL then land on `/[locale]/account-deleted`, signed out.

Following the link without a session for that account SHALL NOT delete anything.

While the confirmation email is being requested, the section SHALL wait the same way every other account surface waits: the same arc on its button, the same beam across its surface, and the same single announcement. Its own confirmation and error messages, and the fact that its button stays disabled once the email has been sent, SHALL be unchanged.

#### Scenario: Requesting deletion only sends an email
- **WHEN** a learner confirms the deletion dialog
- **THEN** Mailpit holds one confirmation email for their address, and the account still exists

#### Scenario: Following the link deletes everything
- **WHEN** the signed-in learner opens the confirmation link
- **THEN** they land on `/en/account-deleted`, no learner table holds a row for their former user id, and signing in with their old credentials fails

#### Scenario: The link needs the account's session
- **WHEN** the confirmation link is opened in a browser without that learner's session
- **THEN** the account still exists

#### Scenario: A Google account deletes the same way
- **WHEN** a learner who only ever signed in with Google requests deletion and follows the link
- **THEN** the account and its data are deleted without asking for a password

#### Scenario: The deletion request waits like every other account request
- **WHEN** the learner has confirmed the dialog and the request is in flight
- **THEN** the delete button shows its pending label with the arc and is disabled, the beam sweeps the section, and the section exposes exactly one `role="status"`

#### Scenario: The terminal states are untouched
- **WHEN** the request resolves
- **THEN** the section shows its existing "email sent" status with the button still disabled, or its existing error alert with the button live again

### Requirement: The account-deleted page closes the loop

`/[locale]/account-deleted` SHALL be public and `noindex`. It SHALL state in the active locale that the account and its progress were deleted, and SHALL offer a link to the home. Rendering it SHALL clear the device-local pending-prize announcement record.

#### Scenario: The page confirms in the learner's language
- **WHEN** `/es/account-deleted` renders
- **THEN** its confirmation copy comes from `es.json` and it links to `/es`

#### Scenario: A waiting prize announcement is cleared
- **WHEN** the device held a pending-prize announcement record and the page renders
- **THEN** the record is gone

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

### Requirement: A completed password change notifies the account

Whenever an account's password is actually replaced, the application SHALL email the address the
account is registered with to say so, in the locale the learner acted in. Both routes that replace a
password SHALL notify: the change-password form on the Profile page, and a reset completed through
the emailed link.

The notice SHALL state that the password changed and that the account's other sessions were signed
out. It SHALL NOT carry a reset token, a password, or any part of one. Its one link SHALL open
`/[locale]/forgot-password`, so a learner who did not make the change asks for a reset themselves
from a page that proves they hold the address — a notice carrying a ready-made key would hand the
account to whoever is reading the inbox, which is the very person it warns about.

A request that was refused SHALL send nothing. Sending is decided on the outcome, not on the
attempt, so a wrong current password, a spent reset token or a rate-limited burst notifies nobody.
Better Auth runs its `after` hooks even for a request that answered with an error, so the check is
explicit rather than implied.

The notice SHALL NOT block the response: a learner who changed their password waits for the change,
not for the mail server.

#### Scenario: Changing the password from the Profile page notifies the learner
- **WHEN** a signed-in learner completes the change-password form on `/es/profile`
- **THEN** Mailpit holds one Spanish notice for their address, saying the password changed and the other devices were signed out

#### Scenario: A reset through the emailed link notifies too
- **WHEN** a learner sets a new password through the link from `/en/forgot-password`
- **THEN** Mailpit holds a notice for their address, in addition to the reset email that started the flow

#### Scenario: A wrong current password notifies nobody
- **WHEN** the change-password form is submitted with the wrong current password
- **THEN** the request is refused and no notice is sent

#### Scenario: A spent reset link notifies nobody
- **WHEN** a reset link is opened and submitted a second time
- **THEN** the request is refused and no second notice is sent

#### Scenario: The notice cannot be used to take the account over
- **WHEN** the notice is rendered
- **THEN** it holds no reset token and its only link opens the forgot-password page

