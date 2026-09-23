## ADDED Requirements

### Requirement: A learner signs up with email and password and verifies the address

The application SHALL offer a sign-up page at `/[locale]/sign-up` that takes a name, an email address and a password, and creates a learner account through Better Auth. The password SHALL hold between 8 and 128 characters. Submitting SHALL send a verification email in the active locale and show a "check your inbox" confirmation that names the address. It SHALL NOT sign the learner in.

An account whose email is not verified SHALL NOT be able to sign in with its password. Following the verification link SHALL verify the address, sign the learner in and open the validated `next` path, or `/[locale]/learning` when there is none.

Signing up with an address that already has an account SHALL NOT reveal that the account exists. The learner sees the same "check your inbox" confirmation.

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

### Requirement: A learner signs in with email and password

The application SHALL offer a sign-in page at `/[locale]/sign-in` that signs a verified learner in with their email and password. On success it SHALL open the validated `next` path, or `/[locale]/learning` when there is none. A wrong email or a wrong password SHALL produce one and the same localized message, so the form never reveals which of the two was wrong.

#### Scenario: Correct credentials open the requested route
- **WHEN** a verified learner signs in from `/en/sign-in?next=%2Fcourses%2Fc`
- **THEN** a session exists and the learner lands on `/en/courses/c`

#### Scenario: Wrong credentials do not say which part was wrong
- **WHEN** a learner signs in with a registered address and a wrong password, and then with an unregistered address
- **THEN** both attempts show the same "email or password is incorrect" message

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
