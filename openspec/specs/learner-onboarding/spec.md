# learner-onboarding Specification

## Purpose
TBD - created by archiving change learner-onboarding. Update Purpose after archive.
## Requirements
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

### Requirement: The onboarding steps are guarded by the profile

After hydration, `/[locale]/start` SHALL replace itself with the valid `next` path when a profile
already exists, or with `/[locale]/learning` when there is no valid `next`. `/[locale]/start/avatar`
SHALL replace itself with `/[locale]/start` when no profile exists, carrying a valid `next` along.
Until storage has been read each step SHALL render a placeholder of its own shape.

#### Scenario: A learner with a profile skips onboarding
- **WHEN** a device with a saved profile opens `/en/start`
- **THEN** it lands on `/en/learning`

#### Scenario: A learner with a profile goes straight to the requested course route
- **WHEN** a device with a saved profile opens `/en/start?next=%2Fcourses%2Fc`
- **THEN** it lands on `/en/courses/c`

#### Scenario: Step two needs step one
- **WHEN** a device without a profile opens `/en/start/avatar`
- **THEN** it lands on `/en/start`

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

### Requirement: Course routes require a learner profile

Every course route SHALL first require a session, as the `learner-account` capability's "Personal routes require a session" defines. A signed-in learner SHALL then, after hydration, be replaced to `/[locale]/start?next=<path>` when the device holds no learner profile. Course routes are `/[locale]/courses/[courseSlug]`,
`/[locale]/courses/[courseSlug]/modules/[moduleSlug]` and
`/[locale]/courses/[courseSlug]/modules/[moduleSlug]/lessons/[lessonId]`. `<path>` is the
requested route's path without the locale prefix. The redirect SHALL apply however the route was
reached (landing link, shared link, typed URL). Nothing SHALL be decided while the profile is
unknown. The server SHALL render the route's full content only to a request with a valid session.

#### Scenario: A lesson link on a device without a profile opens the onboarding
- **WHEN** a signed-in learner whose device has no profile opens `/en/courses/c/modules/m/lessons/l`
- **THEN** they land on `/en/start?next=%2Fcourses%2Fc%2Fmodules%2Fm%2Flessons%2Fl`

#### Scenario: A landing catalog card on a device without a profile opens the onboarding
- **WHEN** a signed-in learner whose device has no profile follows a course card from `/en`
- **THEN** they land on `/en/start` carrying that course path as `next`

#### Scenario: A learner with a profile stays on the course route
- **WHEN** a signed-in learner whose device has a saved profile opens `/en/courses/c`
- **THEN** the course overview stays open

#### Scenario: A visitor without a session is sent to sign in first
- **WHEN** `/en/courses/c` is requested without a session
- **THEN** the response redirects to `/en/sign-in?next=%2Fcourses%2Fc` and contains no course content

### Requirement: Only internal course paths are accepted as the onboarding return

The onboarding SHALL treat `next` as valid only when it is a path that starts with `/courses/`, has
no scheme, no host, no `//` sequence, no backslash and no `..` segment. An invalid or missing `next`
SHALL be ignored, and the onboarding SHALL behave as though none was given.

#### Scenario: An external URL is ignored
- **WHEN** `/en/start?next=https%3A%2F%2Fevil.example` is completed
- **THEN** finishing step 2 opens `/en/learning`

#### Scenario: A protocol-relative path is ignored
- **WHEN** `next` is `//evil.example/courses/c`
- **THEN** it is ignored

#### Scenario: A non-course internal path is ignored
- **WHEN** `next` is `/profile`
- **THEN** it is ignored

