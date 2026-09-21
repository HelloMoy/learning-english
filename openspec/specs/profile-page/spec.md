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

### Requirement: The Profile page names the address and the sign-in methods

The Profile page SHALL hold an **Account** section, between the learner-card form and the delete-account
section, that names the email address the learner's account is registered with and how they sign in:
with an email and a password, with Google, or with both. The address SHALL come from the server's
session, so the page never guesses it, and it SHALL be rendered as text rather than in a field the
learner might mistake for an editable one.

A learner whose only sign-in method is Google SHALL be told, in that section, that their address is
managed by Google, and SHALL be offered neither the change-password form nor the change-email form.

Every string SHALL come from `Profile.account.*` in `en`, `es` and `pt`.

#### Scenario: The section names the address
- **WHEN** a learner registered as `ana@example.com` opens `/en/profile`
- **THEN** the Account section shows `ana@example.com` and says they sign in with an email and a password

#### Scenario: A Google account is named as such
- **WHEN** a learner who only ever signed in with Google opens `/en/profile`
- **THEN** the section shows their Google address, says the address is managed by Google, and shows no password or email form

#### Scenario: A linked account names both methods
- **WHEN** a learner who has both a password and a linked Google account opens `/en/profile`
- **THEN** the section says they sign in both ways, and both forms are offered

#### Scenario: The section in Portuguese
- **WHEN** `/pt/profile` renders
- **THEN** the Account section's heading, labels and method names render from `pt.json`

### Requirement: The Profile page changes the password behind the current one

For a learner whose account has a password, the Account section SHALL offer a change-password form with
two labelled fields — the current password and the new one — and a submit action. Both fields SHALL be
password inputs with the autocomplete the browser expects (`current-password` and `new-password`). The
new password's rule SHALL be stated under its field. Submitting SHALL validate the length in the browser
first, then ask the server, as the `learner-account` capability's "A learner changes their password from
a signed-in session" defines.

A successful change SHALL clear both fields and announce, as a status, that the password changed and
that other devices were signed out. A refusal SHALL be shown as an alert in the section, and the fields
SHALL keep what the learner typed. The submit action SHALL be unavailable while a request is in flight.

Every string SHALL come from `Profile.password.*` in `en`, `es` and `pt`.

#### Scenario: Changing the password confirms and clears
- **WHEN** the learner submits the correct current password and a valid new one
- **THEN** both fields are empty and the section announces that the password changed and other devices were signed out

#### Scenario: A refusal keeps what was typed
- **WHEN** the current password is wrong
- **THEN** the section shows the localized refusal as an alert and both fields still hold what the learner typed

#### Scenario: The form in Portuguese
- **WHEN** `/pt/profile` renders
- **THEN** the form's heading, both labels, the rule and the button render from `pt.json`

### Requirement: The Profile page changes the email address behind a confirmation

For a learner whose account has a password, the Account section SHALL offer a change-email form with one
labelled field for the new address and a submit action, and SHALL say before submitting that a link will
go to the address on file first. Submitting SHALL validate the address in the browser, then ask the
server, as the `learner-account` capability's "A learner changes their email address by confirming on the
old address and verifying on the new one" defines.

An accepted request SHALL replace the form with a confirmation, announced as a status, that names the
address the link was sent to — the one on file, not the requested one — and says the address does not
change until both links are followed. A refusal SHALL be shown as an alert, and the field SHALL keep what
the learner typed.

Every string SHALL come from `Profile.email.*` in `en`, `es` and `pt`.

#### Scenario: The confirmation names the address on file
- **WHEN** a learner registered as `ana@example.com` submits `ana.g@example.com`
- **THEN** the section announces that a link was sent to `ana@example.com` and that the address changes only after both links are followed

#### Scenario: An invalid address is refused before submitting
- **WHEN** the field holds `not-an-address`
- **THEN** the form shows the address error and sends nothing

#### Scenario: The form in Portuguese
- **WHEN** `/pt/profile` renders
- **THEN** the form's heading, label, the note about the link, the button and the confirmation render from `pt.json`

