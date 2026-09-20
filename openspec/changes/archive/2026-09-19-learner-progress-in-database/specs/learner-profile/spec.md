## MODIFIED Requirements

### Requirement: The profile is stored per device behind a port

The domain SHALL declare a learner profile repository port with a read and a write. The application
SHALL provide a database adapter that stores one profile per signed-in learner, returns no profile
when none is stored or the stored row fails validation, and never throws on a read.

Finding and saving a profile SHALL go through use cases that return typed results; saving an invalid
profile SHALL fail with a typed error and SHALL NOT write.

#### Scenario: A saved profile is read back
- **WHEN** a valid profile is saved and then read for the same learner, on the same or another device
- **THEN** the same profile is returned

#### Scenario: A corrupt row reads as no profile
- **WHEN** the stored row fails validation
- **THEN** reading returns no profile

#### Scenario: An invalid save is refused
- **WHEN** a profile with a blank name is saved
- **THEN** the use case returns an `invalid-learner-profile` error and the stored profile is unchanged

### Requirement: The client learns the profile after hydration and hears every save

The client SHALL report the profile as unknown during server rendering and hydration, then as absent
or present from the learner snapshot the server handed over. A save made anywhere in the application
SHALL be reflected by every mounted reader in the same tab. A save made in another tab or on another
device SHALL be reflected after this tab's next full load.

#### Scenario: The header updates after a profile save
- **WHEN** the Profile page saves a new avatar while the header is mounted
- **THEN** the header shows the new avatar without a reload

#### Scenario: Nothing is asserted before hydration
- **WHEN** a page renders on the server
- **THEN** readers receive the unknown state rather than absent or present
