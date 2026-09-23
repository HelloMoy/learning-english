## ADDED Requirements

### Requirement: The change-email email confirms the move on the address on file

The application SHALL provide a `change-email` React Email template, localized under
`Emails.ChangeEmail.*` in `en`, `es` and `pt`, sent in the locale of the page where the change was
requested. It SHALL be addressed to the account's current address, SHALL name the address the account
would move to, and SHALL state that ignoring the email leaves the address unchanged. Like the other
templates, it SHALL render from the shared shell in the Immersion Cinema dark palette, carry exactly
one call-to-action link, also printed as text, and declare preview props.

The address the change would move to SHALL reach the template as a value passed to the message, so the
copy stays in the locale's message file and no address is built into it.

#### Scenario: The email names the new address and the escape
- **WHEN** `change-email` is rendered in English for a move to `ana.g@example.com`
- **THEN** it names `ana.g@example.com`, says that ignoring the email keeps the current address, and holds the link as a button and as text

#### Scenario: A Spanish request gets a Spanish email
- **WHEN** the change is requested from `/es/profile`
- **THEN** the email's subject and body render from `es.json` and its link returns to a `/es/` route

#### Scenario: The preview server lists the template
- **WHEN** the email preview server runs
- **THEN** it lists `change-email` and renders it from its preview props

## MODIFIED Requirements

### Requirement: An irreversible email's call to action is visually distinct

An account email SHALL declare which kind of action its link performs, and the shell SHALL style
the call to action accordingly. A routine action — confirming an address, choosing a new password,
approving a move to another address — SHALL use the gold `#e7b64c` primary with `#1a1200` text. A
destructive action SHALL instead use the destructive treatment: a `#b3402f`-tinted fill, a `#b3402f`
border and a `#ef9d8c` label, so the one irreversible link the course sends never wears the same
button as a routine one.

Both treatments SHALL meet WCAG 2.1 AA contrast against the ground they sit on.

#### Scenario: Confirming an address offers a gold button

- **WHEN** `verify-email`, `reset-password` or `change-email` is rendered
- **THEN** its call to action is the gold primary

#### Scenario: Deleting an account does not

- **WHEN** `delete-account` is rendered
- **THEN** its call to action uses the destructive treatment, and no gold button appears in the
  message
