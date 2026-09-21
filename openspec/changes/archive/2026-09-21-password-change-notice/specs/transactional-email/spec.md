## ADDED Requirements

### Requirement: The password-changed email warns without carrying a key

The application SHALL provide a `password-changed` React Email template, localized under
`Emails.PasswordChanged.*` in `en`, `es` and `pt`, sent in the locale the learner acted in. It SHALL
say that the account's password was changed and that the other sessions were signed out, and its
closing line SHALL tell a learner who did not make the change to recover the account through the
link rather than to ignore the message — the one account email whose "if this was not you" is an
instruction instead of a reassurance.

Like the other templates, it SHALL render from the shared shell in the Immersion Cinema dark
palette, carry exactly one call-to-action link, also printed as text, and declare preview props. Its
action SHALL be routine, so the call to action wears the gold primary.

The link SHALL be a locale-qualified `/[locale]/forgot-password` path and SHALL carry no token.

#### Scenario: The email states the change and offers recovery
- **WHEN** `password-changed` is rendered in English
- **THEN** it says the password changed and the other devices were signed out, and its button opens the forgot-password page

#### Scenario: The email carries nothing that opens the account
- **WHEN** `password-changed` is rendered
- **THEN** its HTML and its plain text hold no `token` query parameter

#### Scenario: A Spanish change gets a Spanish notice
- **WHEN** the password is changed from `/es/profile`
- **THEN** the notice's subject and body render from `es.json` and its link opens `/es/forgot-password`

#### Scenario: The preview server lists the template
- **WHEN** the email preview server runs
- **THEN** it lists `password-changed` and renders it from its preview props

## MODIFIED Requirements

### Requirement: An irreversible email's call to action is visually distinct

An account email SHALL declare which kind of action its link performs, and the shell SHALL style
the call to action accordingly. A routine action — confirming an address, choosing a new password,
approving a move to another address, recovering an account after a password notice — SHALL use the
gold `#e7b64c` primary with `#1a1200` text. A destructive action SHALL instead use the destructive
treatment: a `#b3402f`-tinted fill, a `#b3402f` border and a `#ef9d8c` label, so the one irreversible
link the course sends never wears the same button as a routine one.

Both treatments SHALL meet WCAG 2.1 AA contrast against the ground they sit on.

#### Scenario: Confirming an address offers a gold button

- **WHEN** `verify-email`, `reset-password`, `change-email` or `password-changed` is rendered
- **THEN** its call to action is the gold primary

#### Scenario: Deleting an account does not

- **WHEN** `delete-account` is rendered
- **THEN** its call to action uses the destructive treatment, and no gold button appears in the
  message
