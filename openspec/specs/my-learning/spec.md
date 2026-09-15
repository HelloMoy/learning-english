# my-learning Specification

## Purpose
TBD - created by archiving change learner-onboarding. Update Purpose after archive.
## Requirements
### Requirement: My learning is the learner's own page

The route `/[locale]/learning` SHALL render the learner's page. After hydration it SHALL replace
itself with `/[locale]/start` when no profile exists. Until storage has been read it SHALL render a
placeholder of the page's shape.

The page SHALL greet the learner with their avatar and a localized welcome that uses the first word of
their name.

#### Scenario: The greeting uses the learner's name
- **WHEN** a learner named `Ana García` opens My learning
- **THEN** the page shows their avatar and `Welcome back, Ana.`

#### Scenario: No profile sends the learner to onboarding
- **WHEN** a device without a profile opens `/en/learning`
- **THEN** it lands on `/en/start`

### Requirement: My learning resumes the last lesson or starts the first

When a stored continue-watching location resolves to a live lesson, My learning SHALL show a resume
panel with the course, the module's ordinal and title, the lesson's position in its module
(`Video 6 of 17`), the lesson title, a progress bar when a playback position is saved for a video
lesson, a primary **Resume** action to the lesson, and a quieter link to the course overview.

When no location is stored, or it no longer resolves, the page SHALL show a start panel whose primary
action opens the first lesson of the first catalog course. While a stored location is resolving, the
panel area SHALL show a placeholder naming no lesson.

#### Scenario: A resolved record offers Resume
- **WHEN** the stored location resolves to the sixth video of a seventeen-video module
- **THEN** the panel shows `Video 6 of 17` and Resume links to that lesson

#### Scenario: Nothing watched offers the first lesson
- **WHEN** no location is stored
- **THEN** the panel's primary action links to the first lesson of the first course

### Requirement: Lesson progress is listed as lesson cards

My learning SHALL list, for the continued course — or the first catalog course when nothing is
continued — the course title, its completed and total video counts, and one card per module. Each card
SHALL show the module's ordinal, title, a progress ring labelled with the module's completed share as a
whole, locale-formatted percentage, and its completed-of-total video count. The ring SHALL be the same
progress ring the course overview draws. Counts SHALL use the same completion rule as the course
overview, and before hydration every ring SHALL read 0%.

Every card SHALL open its module's overview (`/[locale]/courses/<course>/modules/<module>`).

When a lesson is continued, the card of the module holding it SHALL come first and span the list's
width, marked `Current`, naming the last watched video, and SHALL be the only card offering a
**Continue** action, which opens that video. The other cards SHALL follow in `sequence` order. When
nothing is continued, every card SHALL render in `sequence` order and none SHALL offer Continue.

#### Scenario: The continued module leads with Continue
- **WHEN** the continued lesson is a video of the second module
- **THEN** the second module's card is first, marked Current, names that video, and its Continue action opens the video; no other card offers Continue

#### Scenario: Nothing continued offers no Continue
- **WHEN** no lesson is continued
- **THEN** the cards follow `sequence` order and no card offers Continue

#### Scenario: A card opens its module overview
- **WHEN** the learner activates the third module's card
- **THEN** they land on that module's overview for the active locale

#### Scenario: A finished module reads as complete
- **WHEN** every video of a module is complete
- **THEN** its ring reads 100%

#### Scenario: A card's ring fills to the module's share
- **WHEN** one of a module's three videos is complete
- **THEN** its card's ring fill covers a third of the circle and its label reads 33%

### Requirement: My learning lists every course with the continued one marked

My learning SHALL render the courses table in `sequence` order. The row for the continued course SHALL
show an in-progress badge, its completed and total video counts and a `Continue course` link; every other
row SHALL show its lesson and video counts and a `View course` link.

#### Scenario: Only the continued course is marked
- **WHEN** the continued lesson belongs to the first course
- **THEN** the first row shows In progress and Continue course, and the second shows View course

### Requirement: My learning copy is localized

Every string on My learning SHALL come from the active locale's messages in `en`, `es` and `pt`, with ICU
plurals for counts, and every link SHALL be locale-aware.

#### Scenario: My learning in Spanish
- **WHEN** `/es/learning` renders for a learner
- **THEN** the greeting, panel actions, row labels and table copy render from `es.json`

