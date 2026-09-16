## MODIFIED Requirements

### Requirement: Step one asks for the learner's name on a live card

The route `/[locale]/start` SHALL render step 1 of 2 of the onboarding: a heading inviting the learner
to make their learner card, the learner card carrying the name field itself, and a **Continue** action.
Typing SHALL update the card's name and initials as the learner types. **Continue** SHALL be unavailable
while the trimmed name is empty.

The name SHALL be typed in the card, where the name will live, and SHALL be the step's only name field.
It SHALL read as somewhere to type — a resting line under it, a caret, and a visible focus ring — so it
is not mistaken for the card's own text, and it SHALL keep the accessible name, autocomplete and maximum
length the step has today.

Pressing **Continue** with a valid name SHALL save a profile with that name and the initials avatar,
and SHALL navigate to `/[locale]/start/avatar`, carrying a valid `next` along unchanged.

#### Scenario: The card is where the name is typed
- **WHEN** step 1 opens
- **THEN** the name field is inside the learner card, and the step offers no second name field

#### Scenario: Typing in the card fills the card
- **WHEN** the learner types `Ana García` in the card's name field
- **THEN** the card shows `Ana García` and the initials `AG` as they type

#### Scenario: Continue is unavailable without a name
- **WHEN** the name field is empty or only spaces
- **THEN** Continue is disabled and nothing is saved

#### Scenario: Continuing saves the name and opens step two
- **WHEN** the learner types `Ana García` and presses Continue
- **THEN** a profile named `Ana García` with the initials avatar is saved and step 2 opens

#### Scenario: Continuing keeps the requested course route
- **WHEN** the learner continues from `/en/start?next=%2Fcourses%2Fc`
- **THEN** step 2 opens at `/en/start/avatar?next=%2Fcourses%2Fc`
