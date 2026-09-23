## ADDED Requirements

### Requirement: The delete-account email confirms an irreversible action

The application SHALL provide a `delete-account` React Email template, localized under `Emails.DeleteAccount.*` in `en`, `es` and `pt`, sent in the locale of the page where deletion was requested. It SHALL state that following the link deletes the account and all progress permanently, that nothing happens if the learner ignores the email, and that the learner must be signed in when following it. Like the other templates, it SHALL carry exactly one call-to-action link, also printed as text, and it SHALL declare preview props.

#### Scenario: The email states the consequence and the escape
- **WHEN** `delete-account` is rendered in English
- **THEN** it says the deletion is permanent, says that ignoring the email keeps the account, and holds the link as a button and as text
