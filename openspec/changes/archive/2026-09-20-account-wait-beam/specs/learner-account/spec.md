## MODIFIED Requirements

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
