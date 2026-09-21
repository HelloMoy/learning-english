# transactional-email Specification

## Purpose
TBD - created by archiving change auth-and-database-foundation. Update Purpose after archive.
## Requirements
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

### Requirement: The delete-account email confirms an irreversible action

The application SHALL provide a `delete-account` React Email template, localized under `Emails.DeleteAccount.*` in `en`, `es` and `pt`, sent in the locale of the page where deletion was requested. It SHALL state that following the link deletes the account and all progress permanently, that nothing happens if the learner ignores the email, and that the learner must be signed in when following it. Like the other templates, it SHALL carry exactly one call-to-action link, also printed as text, and it SHALL declare preview props.

#### Scenario: The email states the consequence and the escape
- **WHEN** `delete-account` is rendered in English
- **THEN** it says the deletion is permanent, says that ignoring the email keeps the account, and holds the link as a button and as text

### Requirement: Account emails render in the Immersion Cinema dark palette

Every account email SHALL render in the Immersion Cinema dark palette, from one shared shell, so
the message a learner reads matches the app they are about to open. The shell SHALL ground the
message on `#08080b`, set body text in `#f4f1ea` and fine print in `#9b968c`, and print the
`ENGLISH·COURSE` wordmark with its gold `#e7b64c` middle dot above the heading.

The shell SHALL carry the `CinemaBackground` gradient — its two radial layers and its letterbox
scrim — as static colour values, because mail clients do not support `color-mix()`. Those layers
SHALL sit on top of a `background-color` of `#08080b`, so a client that drops background images
renders flat near-black rather than falling back to white.

The message SHALL declare a dark colour scheme, so clients that adapt colours for dark mode leave
an already-dark palette alone.

The emails SHALL NOT offer a light variant. Immersion Cinema is a dark design and an email cannot
read the learner's stored theme, so the palette is baked.

#### Scenario: The shell renders on the cinema ground

- **WHEN** any account email is rendered
- **THEN** its body carries the `#08080b` background colour, the two radial gradient layers and the
  letterbox scrim, and prints the `ENGLISH·COURSE` wordmark

#### Scenario: A client that drops background images still reads

- **WHEN** a client strips `background-image` from the message
- **THEN** the remaining `background-color` is `#08080b` and every text colour on it stays legible

#### Scenario: A dark-mode client is told not to invert

- **WHEN** the message is rendered
- **THEN** its head declares `color-scheme` and `supported-color-schemes` as dark

### Requirement: The letterbox composition frames every account email

The shared shell SHALL use the letterbox composition: a solid black bar across the top of the
message and another across the bottom, cropping the glow into a film frame, with the heading, body,
call to action, link and closing line centred between them.

#### Scenario: Black bars crop the frame

- **WHEN** any account email is rendered
- **THEN** a solid black bar sits above the content and another below it, and the content between
  them is centre-aligned

### Requirement: An irreversible email's call to action is visually distinct

An account email SHALL declare which kind of action its link performs, and the shell SHALL style
the call to action accordingly. A routine action — confirming an address, choosing a new password —
SHALL use the gold `#e7b64c` primary with `#1a1200` text. A destructive action SHALL instead use
the destructive treatment: a `#b3402f`-tinted fill, a `#b3402f` border and a `#ef9d8c` label, so
the one irreversible link the course sends never wears the same button as a routine one.

Both treatments SHALL meet WCAG 2.1 AA contrast against the ground they sit on.

#### Scenario: Confirming an address offers a gold button

- **WHEN** `verify-email` or `reset-password` is rendered
- **THEN** its call to action is the gold primary

#### Scenario: Deleting an account does not

- **WHEN** `delete-account` is rendered
- **THEN** its call to action uses the destructive treatment, and no gold button appears in the
  message

