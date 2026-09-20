# profile-page Specification

## Purpose
TBD - created by archiving change learner-onboarding. Update Purpose after archive.
## Requirements
### Requirement: The Profile page edits name and avatar with a live card

The route `/[locale]/profile` SHALL render a form with the name field and the avatar picker, and the
learner card as a live preview with the learner's progress label. Every edit SHALL update the preview
immediately without saving. After hydration the route SHALL replace itself with `/[locale]/start` when no
profile exists.

#### Scenario: Editing updates the preview only
- **WHEN** the learner changes the name to `Ana María López`
- **THEN** the card shows `Ana María López` and the stored profile is unchanged

#### Scenario: No profile sends the learner to onboarding
- **WHEN** a device without a profile opens `/en/profile`
- **THEN** it lands on `/en/start`

### Requirement: Saving and discarding are explicit

**Save** SHALL be available only when the edited name or avatar differs from the stored profile and the
trimmed name is not empty. Pressing Save SHALL store the edited profile and show a localized confirmation
announced as a status. **Discard** SHALL restore the form and the preview to the stored profile.

#### Scenario: Save waits for a change
- **WHEN** the Profile page opens and nothing has been edited
- **THEN** Save is disabled

#### Scenario: Saving confirms and persists
- **WHEN** the learner picks `Plum` and presses Save
- **THEN** the profile's avatar becomes Plum, a confirmation is announced, and the header shows the Plum avatar

#### Scenario: Discarding restores the stored profile
- **WHEN** the learner edits the name and presses Discard
- **THEN** the field and the card show the stored name again

### Requirement: Profile copy is localized

Every string on the Profile page SHALL come from the active locale's messages in `en`, `es` and `pt`.

#### Scenario: Profile in Portuguese
- **WHEN** `/pt/profile` renders
- **THEN** the heading, labels, Discard, Save and confirmation render from `pt.json`

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

