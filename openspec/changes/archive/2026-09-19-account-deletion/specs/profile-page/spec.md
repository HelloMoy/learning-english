## ADDED Requirements

### Requirement: The Profile page offers to delete the account behind a confirmation

The Profile page SHALL end with a "Delete account" section, visually separated from the profile form, holding a destructive-styled button. Activating it SHALL open a dialog that names what will be deleted (progress, tickets, prizes and the learner card), says the deletion cannot be undone, and says a confirmation email will be sent. The dialog SHALL offer Cancel, focused by default, and a destructive "Send confirmation email". Confirming SHALL request deletion, close the dialog and show in the section, announced as a status, that an email was sent to the learner's address. A refused request SHALL show a localized error in the section.

Every string SHALL come from `Profile.deleteAccount.*` in `en`, `es` and `pt`.

#### Scenario: Cancel is the safe default
- **WHEN** the learner opens the delete dialog
- **THEN** focus is on Cancel, and pressing Enter closes the dialog without sending anything

#### Scenario: Confirming reports the email
- **WHEN** the learner confirms in the dialog
- **THEN** the dialog closes and the section announces that a confirmation email was sent to their address

#### Scenario: The section in Portuguese
- **WHEN** `/pt/profile` renders
- **THEN** the section heading, the button and the dialog copy render from `pt.json`
