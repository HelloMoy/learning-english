## ADDED Requirements

### Requirement: A learner deletes their account after confirming by email

A signed-in learner SHALL be able to request deletion of their account. The request SHALL send a confirmation email in the active locale and SHALL NOT delete anything by itself. Following the email's link while signed in to that same account SHALL delete the user and, through the database cascade, their sessions, linked sign-in methods, profile, completions, playback positions, continue-watching location, earned tickets and prize claims. The learner SHALL then land on `/[locale]/account-deleted`, signed out.

Following the link without a session for that account SHALL NOT delete anything.

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

### Requirement: The account-deleted page closes the loop

`/[locale]/account-deleted` SHALL be public and `noindex`. It SHALL state in the active locale that the account and its progress were deleted, and SHALL offer a link to the home. Rendering it SHALL clear the device-local pending-prize announcement record.

#### Scenario: The page confirms in the learner's language
- **WHEN** `/es/account-deleted` renders
- **THEN** its confirmation copy comes from `es.json` and it links to `/es`

#### Scenario: A waiting prize announcement is cleared
- **WHEN** the device held a pending-prize announcement record and the page renders
- **THEN** the record is gone
