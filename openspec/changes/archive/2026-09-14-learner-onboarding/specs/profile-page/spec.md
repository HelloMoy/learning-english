## ADDED Requirements

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
