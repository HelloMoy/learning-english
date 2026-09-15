# learner-onboarding Specification

## Purpose
TBD - created by archiving change learner-onboarding. Update Purpose after archive.
## Requirements
### Requirement: Step one asks for the learner's name on a live card

The route `/[locale]/start` SHALL render step 1 of 2 of the onboarding: a heading inviting the learner
to make their learner card, the learner card, a name field and a **Continue** action. Typing SHALL
update the card's name and initials as the learner types. **Continue** SHALL be unavailable while the
trimmed name is empty.

Pressing **Continue** with a valid name SHALL save a profile with that name and the initials avatar,
and SHALL navigate to `/[locale]/start/avatar`.

#### Scenario: Continue is unavailable without a name
- **WHEN** the name field is empty or only spaces
- **THEN** Continue is disabled and nothing is saved

#### Scenario: Continuing saves the name and opens step two
- **WHEN** the learner types `Ana García` and presses Continue
- **THEN** a profile named `Ana García` with the initials avatar is saved and step 2 opens

### Requirement: Step two picks the avatar on the same card

The route `/[locale]/start/avatar` SHALL render step 2 of 2: the learner card showing the saved name,
the avatar picker with the current avatar checked, and **Continue**. Choosing an option SHALL update
the card immediately. Pressing **Continue** SHALL save the chosen avatar and navigate to
`/[locale]/learning`.

#### Scenario: Picking an illustration updates the card
- **WHEN** the learner picks `Echo`
- **THEN** the card shows the Echo illustration before anything is saved

#### Scenario: Finishing opens My learning
- **WHEN** the learner presses Continue on step 2
- **THEN** the chosen avatar is saved and My learning opens

### Requirement: The onboarding steps are guarded by the profile

After hydration, `/[locale]/start` SHALL replace itself with `/[locale]/learning` when a profile already
exists, and `/[locale]/start/avatar` SHALL replace itself with `/[locale]/start` when no profile exists.
Until storage has been read each step SHALL render a placeholder of its own shape.

#### Scenario: A learner with a profile skips onboarding
- **WHEN** a device with a saved profile opens `/en/start`
- **THEN** it lands on `/en/learning`

#### Scenario: Step two needs step one
- **WHEN** a device without a profile opens `/en/start/avatar`
- **THEN** it lands on `/en/start`

### Requirement: Onboarding copy is localized and marks its progress

Every onboarding string SHALL come from the active locale's messages in `en`, `es` and `pt`, and each
step SHALL state its position (`Step 1 of 2`, `Step 2 of 2`) in text and as a two-segment indicator.

#### Scenario: Step one in Portuguese
- **WHEN** `/pt/start` renders
- **THEN** the heading, field label, placeholder, Continue and step label render from `pt.json`

