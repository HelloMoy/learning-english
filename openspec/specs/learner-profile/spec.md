# learner-profile Specification

## Purpose
TBD - created by archiving change learner-onboarding. Update Purpose after archive.
## Requirements
### Requirement: The learner profile is a validated domain value

The domain SHALL define a learner profile made of a name and an avatar. The name SHALL be trimmed
and SHALL hold between 1 and 40 characters. The avatar SHALL be either the initials avatar or one of
exactly eight illustrations identified by `sun`, `wave`, `leaf`, `plum`, `ember`, `echo`, `night` and
`schwa`. Any other value SHALL be rejected.

#### Scenario: A valid profile parses
- **WHEN** a profile with the name `  Ana García ` and the illustration `wave` is parsed
- **THEN** it is accepted with the name `Ana García`

#### Scenario: An empty or overlong name is rejected
- **WHEN** a profile whose name is blank, or longer than 40 characters, is parsed
- **THEN** it is rejected

#### Scenario: An unknown illustration is rejected
- **WHEN** a profile names the illustration `dragon`
- **THEN** it is rejected

### Requirement: Initials are derived from the name

The domain SHALL derive an initials string from a name: the first letter of the first word followed
by the first letter of the last word when there is more than one word, upper-cased. A name with a
single word SHALL yield one letter.

#### Scenario: Two words give two letters
- **WHEN** initials are derived from `ana maría garcía`
- **THEN** the result is `AG`

#### Scenario: One word gives one letter
- **WHEN** initials are derived from `Ana`
- **THEN** the result is `A`

### Requirement: The profile is stored per device behind a port

The domain SHALL declare a learner profile repository port with a read and a write. The application
SHALL provide a browser adapter that stores the profile under one `localStorage` key, returns no
profile when the stored value is missing, unparsable or invalid, and never throws when storage is
unavailable or full.

Finding and saving a profile SHALL go through use cases that return typed results; saving an invalid
profile SHALL fail with a typed error and SHALL NOT write.

#### Scenario: A saved profile is read back
- **WHEN** a valid profile is saved and then read on the same device
- **THEN** the same profile is returned

#### Scenario: Corrupt storage reads as no profile
- **WHEN** the stored value is not valid JSON or fails validation
- **THEN** reading returns no profile

#### Scenario: An invalid save is refused
- **WHEN** a profile with a blank name is saved
- **THEN** the use case returns an `invalid-learner-profile` error and storage is unchanged

### Requirement: The client learns the profile after hydration and hears every save

The client SHALL report the profile as unknown during server rendering and hydration, then as absent
or present once storage has been read. A save made anywhere in the application SHALL be reflected by
every mounted reader in the same tab, and a save made in another tab SHALL be reflected after the
browser's storage event.

#### Scenario: The header updates after a profile save
- **WHEN** the Profile page saves a new avatar while the header is mounted
- **THEN** the header shows the new avatar without a reload

#### Scenario: Nothing is asserted before storage is read
- **WHEN** a page renders on the server
- **THEN** readers receive the unknown state rather than absent or present

### Requirement: The learner avatar renders initials or an illustration

The application SHALL render a learner avatar as a circle showing either the chosen illustration or
the derived initials on the gold accent. The avatar SHALL expose an accessible name that includes the
learner's name, and its illustration SHALL be decorative to assistive technology.

#### Scenario: Initials avatar
- **WHEN** the avatar renders for `Ana García` with the initials avatar
- **THEN** it shows `AG` and is announced as the avatar of Ana García

#### Scenario: Illustration avatar
- **WHEN** the avatar renders with the illustration `night`
- **THEN** it shows that illustration and no initials

### Requirement: The learner card shows who the learner is

The application SHALL render a learner card with the brand wordmark, a `Learner` tag, the learner's
avatar, the name (or a localized placeholder when the name is empty), the level line, and a footer
with a localized progress label supplied by the page. The card SHALL reflect name and avatar changes
immediately when its inputs change.

The card SHALL receive the learner's progress as a completed and a total video count and render the
localized footer label from them. Hovering or focusing the label SHALL reveal a tooltip, opening below
the label so it never covers the learner's name, that shows a small progress ring labelled with the
completed share as a whole, locale-formatted percentage, the completed-of-total count, and how many
videos are left in the course by name. A course with no videos SHALL read as 0%, and a finished course
SHALL say it is complete instead of counting what is left.

#### Scenario: The progress label reveals the progress ring
- **WHEN** the learner hovers or focuses `4 of 48 videos` on a Basic Course card
- **THEN** a tooltip shows a ring at `8%`, `4 of 48 videos` and `44 to go in Basic Course`

On touch devices, where there is no hover, tapping the progress label SHALL open the same tooltip and
tapping it again, or anywhere outside it, SHALL close it.

#### Scenario: A tap opens the tooltip on a phone
- **WHEN** the learner taps `4 of 48 videos` on a touch screen
- **THEN** the tooltip opens; **AND WHEN** they tap the label again
- **THEN** it closes

#### Scenario: A finished course reads as complete
- **WHEN** the learner has completed all 48 videos and focuses the progress label
- **THEN** the tooltip shows `100%` and states the course is complete

#### Scenario: The card updates while typing
- **WHEN** the card's name input changes from empty to `Ana`
- **THEN** the card replaces the placeholder with `Ana` and its avatar shows `A`

### Requirement: The avatar picker is an accessible single choice

The application SHALL offer the initials avatar and the eight illustrations as a single-choice group:
exactly one option is checked, each option has an accessible name, each hit area is at least 44×44
CSS pixels, and arrow keys move the selection between options.

#### Scenario: Choosing an illustration checks it
- **WHEN** the learner presses the `Plum` option
- **THEN** `Plum` reports checked and every other option reports unchecked

#### Scenario: Arrow keys move the choice
- **WHEN** the `Sunny` option is focused and checked and the learner presses the right arrow key
- **THEN** the next option becomes checked and focused

