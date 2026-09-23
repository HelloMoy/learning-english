## ADDED Requirements

### Requirement: Emails are React Email templates rendered to HTML and plain text

Every email the application sends SHALL be a React Email template under `src/emails/<name>/<name>.tsx`. Sending SHALL render the template to HTML and derive a plain-text alternative from it, and both SHALL go out in the same message. Each template SHALL declare preview props so the preview server can render it without a running app.

The first templates SHALL be `verify-email` and `reset-password`. Each SHALL carry exactly one call-to-action link, and the link SHALL also be printed as text for clients that do not render buttons.

#### Scenario: A verification email carries its link twice
- **WHEN** `verify-email` is rendered with a verification URL
- **THEN** the HTML holds a button linking to that URL and the URL printed as text, and the plain-text part holds the URL

#### Scenario: The preview server lists the templates
- **WHEN** `pnpm email:dev` runs
- **THEN** its preview lists `verify-email` and `reset-password` and renders both from their preview props

### Requirement: Emails are sent in the locale the learner acted in

An email SHALL be written in the locale of the route the learner was on when they caused it: the sign-up page's locale for verification and the forgot-password page's locale for a reset. Its subject, preview text, body and button SHALL come from the `Emails.<Template>.*` namespace of that locale's messages in `en`, `es` and `pt`. The link SHALL point back into that same locale.

#### Scenario: A Portuguese sign-up gets a Portuguese email
- **WHEN** a visitor signs up on `/pt/sign-up`
- **THEN** the verification email's subject and body render from `pt.json`, and its link returns to a `/pt/` route

### Requirement: Emails are sent over SMTP through a sender port

The application SHALL send email through an `EmailSender` interface with one SMTP implementation. The SMTP host, port, security, credentials and `from` address SHALL come from the validated server environment. In development they SHALL point at the Compose Mailpit service, which accepts any recipient and delivers nothing. In production they SHALL point at Resend's SMTP relay. No code path SHALL differ between the two.

A send that fails SHALL surface as a failure to its caller and SHALL be logged. It SHALL NOT be swallowed.

#### Scenario: Development mail lands in Mailpit
- **WHEN** a password reset is requested locally
- **THEN** the message appears in the Mailpit inbox at `http://localhost:8025`

#### Scenario: A refused send is reported
- **WHEN** the SMTP server rejects a message
- **THEN** the sender reports the failure to its caller instead of resolving as sent
