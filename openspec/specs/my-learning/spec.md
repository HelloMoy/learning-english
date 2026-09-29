# my-learning Specification

## Purpose
TBD - created by archiving change learner-onboarding. Update Purpose after archive.
## Requirements
### Requirement: My learning is the learner's own page

The route `/[locale]/learning` SHALL render the learner's page. After hydration it SHALL replace itself with `/[locale]/start` when no profile exists, and with `/[locale]/start/first-course?from=learning` when a profile exists but the learner is enrolled in no course. Until storage has been read it SHALL render a placeholder of the page's shape, and it SHALL decide neither redirect while the profile or the enrollments are unknown.

The page SHALL greet the learner with their avatar and a localized welcome that uses the first word of
their name.

#### Scenario: The greeting uses the learner's name
- **WHEN** a learner named `Ana García` opens My learning
- **THEN** the page shows their avatar and `Welcome back, Ana.`

#### Scenario: No profile sends the learner to onboarding
- **WHEN** a device without a profile opens `/en/learning`
- **THEN** it lands on `/en/start`

#### Scenario: No enrollment sends the learner to the first-course step
- **WHEN** a learner with a profile and no enrolled course opens `/en/learning`
- **THEN** it lands on `/en/start/first-course?from=learning`

### Requirement: My learning resumes the last lesson or starts the first

My learning SHALL lead with the enrolled course the learner watched most recently — the enrolled course whose continue-watching record is the latest, or, when no enrolled course has one, the first enrolled course in `sequence` order. For that course it SHALL show a hero for its **continue target** (as the `continue-target` capability picks it, with that course's own record as the last opened video) beside the course's progress panel.

The hero SHALL show:

- the target's poster;
- a mark reading **Pick up where you left off**, or **Start here** when the target is the course's first unwatched video with no progress;
- the course title with the target's module ordinal and its position in the module (`Video 3 of 10`);
- the target's title;
- for a video with a saved position, a progress bar with the elapsed and total time and how long ago the course was last watched;
- one action, reading **Resume**, **Start** or **Watch again** according to the target's kind, which opens the target.

The progress panel SHALL be the course overview's course panel: the course title as a level-two heading, the ring, the completed and total videos with the time left, the prize icons, and a **View course** link to the course overview.

#### Scenario: The last watched course leads
- **WHEN** a learner enrolled in Basic and Advanced last opened the third video of Advanced's sixth module, which is unfinished
- **THEN** the hero shows that video with `Video 3 of 10` and Resume opens it, and the panel beside it is Advanced's

#### Scenario: A finished recorded video resumes the next one
- **WHEN** the latest record names a finished video
- **THEN** the hero offers the next unfinished video of that course

#### Scenario: A saved position shows elapsed time and recency
- **WHEN** the target video has a saved position of 365 seconds of 848 and was last watched yesterday
- **THEN** the hero shows `06:05 / 14:08` and says it was watched yesterday

#### Scenario: A course enrolled but never opened starts at the first video
- **WHEN** the learner's only enrollment is Advanced and no Advanced lesson has been opened
- **THEN** the hero offers Advanced's first video with Start

### Requirement: My learning copy is localized

Every string on My learning SHALL come from the active locale's messages in `en`, `es` and `pt`, with ICU
plurals for counts, and every link SHALL be locale-aware.

#### Scenario: My learning in Spanish
- **WHEN** `/es/learning` renders for a learner
- **THEN** the greeting, panel actions, row labels and table copy render from `es.json`

### Requirement: Your courses lists every enrolled course with its own next video

Below the hero, My learning SHALL show **Your courses**: a heading stating how many courses the learner is enrolled in, a **Browse courses** link to `/[locale]/courses`, and one card per enrolled course in `sequence` order. Each card SHALL show a ring with the course's completed share, its title, the completed and total videos, a **Next up** row with the course's continue target (thumbnail with its saved progress when there is one, title, module ordinal and title, position and duration), a **Continue** action that opens that target, and **View course**. The card of the course the hero leads with SHALL be marked visually as the current one.

#### Scenario: Both courses listed with their own places
- **WHEN** a learner enrolled in Basic and Advanced has records in both
- **THEN** Your courses shows two cards, and each card's Next up names that course's own continue target

#### Scenario: Browse courses opens Available courses
- **WHEN** the learner activates Browse courses
- **THEN** `/[locale]/courses` opens

