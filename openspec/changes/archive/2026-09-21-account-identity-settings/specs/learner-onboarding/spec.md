## MODIFIED Requirements

### Requirement: Step one asks for the learner's name on a live card

The route `/[locale]/start` SHALL render step 1 of 2 of the onboarding: a heading inviting the learner
to make their learner card, the learner card carrying the name field itself, and a **Continue** action.
Typing SHALL update the card's name and initials as the learner types. **Continue** SHALL be unavailable
while the trimmed name is empty.

The name field SHALL open holding the name the learner's account was created with — the name typed on
the sign-up form, or the one the social provider supplied — so the learner confirms a name instead of
retyping it. The learner SHALL be able to clear or rewrite it, and what they leave in the field is what
is saved. When the account carries no usable name the field SHALL open empty, exactly as it does today.
The seeded name SHALL come from the server's session, not from the browser, and the step SHALL NOT wait
for it after hydration.

The name SHALL be typed in the card, where the name will live, and SHALL be the step's only name field.
It SHALL read as somewhere to type — a resting line under it, a caret, and a visible focus ring — so it
is not mistaken for the card's own text, and it SHALL keep the accessible name, autocomplete and maximum
length the step has today.

Pressing **Continue** with a valid name SHALL save a profile with that name and the initials avatar,
and SHALL navigate to `/[locale]/start/avatar`, carrying a valid `next` along unchanged.

#### Scenario: The card is where the name is typed
- **WHEN** step 1 opens
- **THEN** the name field is inside the learner card, and the step offers no second name field

#### Scenario: The account's name is already in the field
- **WHEN** a learner who signed up as `Ana García` opens `/en/start`
- **THEN** the card's name field holds `Ana García`, the card shows the initials `AG`, and Continue is available

#### Scenario: An account without a name opens an empty field
- **WHEN** the signed-in account's name is blank
- **THEN** the field is empty, the card shows its placeholder, and Continue is disabled

#### Scenario: The seeded name can be rewritten
- **WHEN** the learner clears the seeded name and types `Ana`
- **THEN** the card shows `Ana`, and continuing saves `Ana`

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

### Requirement: Step two picks the avatar on the same card

The route `/[locale]/start/avatar` SHALL render step 2 of 2: the learner card showing the saved name,
the avatar picker with the current avatar checked, and **Continue**. Choosing an option SHALL update
the card immediately. Pressing **Continue** SHALL save the chosen avatar and navigate to the valid
`next` path when one is present, and to `/[locale]/learning` otherwise.

The card's name SHALL be editable here in the same way it is on step 1: the name lives in a field
inside the card, seeded with the saved name, carrying the same accessible name, autocomplete and
maximum length. Typing SHALL update the card's name and initials at once and SHALL save nothing;
**Continue** SHALL save the edited name together with the chosen avatar. **Continue** SHALL be
unavailable while the trimmed name is empty. Leaving the step without continuing SHALL leave the
saved name unchanged.

#### Scenario: Picking an illustration updates the card
- **WHEN** the learner picks `Echo`
- **THEN** the card shows the Echo illustration before anything is saved

#### Scenario: The name can be corrected on step two
- **WHEN** the learner changes the card's name field from `Ana García` to `Ana G.` and presses Continue
- **THEN** the saved profile is named `Ana G.` and carries the chosen avatar

#### Scenario: Editing the name alone saves nothing until Continue
- **WHEN** the learner types in the name field and does not press Continue
- **THEN** the card shows the typed name and the stored profile still holds the old one

#### Scenario: Continue is unavailable without a name
- **WHEN** the card's name field is emptied
- **THEN** Continue is disabled and nothing is saved

#### Scenario: Finishing opens My learning
- **WHEN** the learner presses Continue on step 2 without a valid `next`
- **THEN** the chosen avatar is saved and My learning opens

#### Scenario: Finishing returns to the requested course route
- **WHEN** the learner presses Continue on `/en/start/avatar?next=%2Fcourses%2Fc%2Fmodules%2Fm`
- **THEN** the chosen avatar is saved and `/en/courses/c/modules/m` opens

### Requirement: Onboarding copy is localized and marks its progress

Every onboarding string SHALL come from the active locale's messages in `en`, `es` and `pt`, and each
step SHALL state its position (`Step 1 of 2`, `Step 2 of 2`) in text and as a two-segment indicator.
Step 2's name field SHALL take its accessible name and placeholder from the same messages step 1 uses.

#### Scenario: Step one in Portuguese
- **WHEN** `/pt/start` renders
- **THEN** the heading, field label, placeholder, Continue and step label render from `pt.json`

#### Scenario: Step two in Portuguese
- **WHEN** `/pt/start/avatar` renders
- **THEN** the heading, intro, the card's name field label, Continue and step label render from `pt.json`
