## ADDED Requirements

### Requirement: Course routes require a learner profile

Every course route SHALL, after hydration, replace itself with `/[locale]/start?next=<path>` when
the device holds no learner profile. Course routes are `/[locale]/courses/[courseSlug]`,
`/[locale]/courses/[courseSlug]/modules/[moduleSlug]` and
`/[locale]/courses/[courseSlug]/modules/[moduleSlug]/lessons/[lessonId]`; `<path>` is the
requested route's path without the locale prefix. The redirect SHALL apply however the route was
reached (landing link, shared link, typed URL). Nothing SHALL be decided while the profile is
unknown, and the server SHALL keep rendering the route's full content.

#### Scenario: A lesson link on a device without a profile opens the onboarding
- **WHEN** a device without a profile opens `/en/courses/c/modules/m/lessons/l`
- **THEN** it lands on `/en/start?next=%2Fcourses%2Fc%2Fmodules%2Fm%2Flessons%2Fl`

#### Scenario: A landing catalog card on a device without a profile opens the onboarding
- **WHEN** a device without a profile follows a course card from `/en`
- **THEN** it lands on `/en/start` carrying that course path as `next`

#### Scenario: A learner with a profile stays on the course route
- **WHEN** a device with a saved profile opens `/en/courses/c`
- **THEN** the course overview stays open

#### Scenario: The server still renders course content
- **WHEN** `/en/courses/c` is requested without JavaScript
- **THEN** the response contains the course overview and its structured data

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

## MODIFIED Requirements

### Requirement: Step one asks for the learner's name on a live card

The route `/[locale]/start` SHALL render step 1 of 2 of the onboarding: a heading inviting the learner
to make their learner card, the learner card, a name field and a **Continue** action. Typing SHALL
update the card's name and initials as the learner types. **Continue** SHALL be unavailable while the
trimmed name is empty.

Pressing **Continue** with a valid name SHALL save a profile with that name and the initials avatar,
and SHALL navigate to `/[locale]/start/avatar`, carrying a valid `next` along unchanged.

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

#### Scenario: Picking an illustration updates the card
- **WHEN** the learner picks `Echo`
- **THEN** the card shows the Echo illustration before anything is saved

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
