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

My learning SHALL lead with the enrolled course the learner watched most recently — the enrolled course whose continue-watching record is the latest, or, when no enrolled course has one, the first enrolled course in `sequence` order. For that course it SHALL show a hero for its **continue target** (as the `continue-target` capability picks it, with that course's own record as the last opened video) beside the course's progress panel. On wide screens the hero SHALL stretch to the height of the progress panel, so the two share one height.

The hero SHALL show:

- the target's poster;
- a mark reading **Pick up where you left off**, or **Start here** when the target is the course's first unwatched video with no progress;
- the course title with the target's module ordinal and its position in the module (`Video 3 of 10`);
- the target's title;
- for a video with a saved position, a progress bar with the elapsed and total time and how long ago the course was last watched;
- one action, reading **Resume**, **Start** or **Watch again** according to the target's kind, which opens the target.

The progress panel SHALL be the course overview's course panel: the course title as a level-two heading, the ring, the completed and total videos with the time left, the prize icons, and a **View course details** link to the course page (`/[locale]/courses/[courseSlug]/about`).

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

#### Scenario: The hero and the progress panel share one height
- **WHEN** My learning opens on a 1440 px wide screen
- **THEN** the hero is as tall as the progress panel beside it

#### Scenario: A pointer resting on the hero keeps its link
- **WHEN** the pointer rests on the hero's poster, away from its action
- **THEN** the hero's link stays under the pointer, so the cursor and the hover style do not flicker

### Requirement: My learning copy is localized

Every string on My learning SHALL come from the active locale's messages in `en`, `es` and `pt`, with ICU
plurals for counts, and every link SHALL be locale-aware.

#### Scenario: My learning in Spanish
- **WHEN** `/es/learning` renders for a learner
- **THEN** the greeting, panel actions, row labels and table copy render from `es.json`

### Requirement: Your courses lists every enrolled course with its own next video

Below the hero, My learning SHALL show **Your courses**: a heading stating how many courses the learner is enrolled in and one card per enrolled course in `sequence` order, followed by the **catalog card**. The cards SHALL sit in three columns on wide screens, two on tablets and one on phones. Each card SHALL show a ring with the course's completed share, its title, the completed and total videos, a **Next up** row with the course's continue target (thumbnail with its saved progress when there is one, title, module ordinal and title, position and duration), one primary action across the card's width that opens that target — reading **Start** for a course never opened, **Continue** for one under way and **Watch again** for a finished one — and, closing the card, a bar split between a **Progress** link to the course overview (`/[locale]/courses/[courseSlug]/progress`) and a **Details** link to the course page (`/[locale]/courses/[courseSlug]/about`). The card's ring and title SHALL open the course overview too, left out of the tab order so keyboard users meet **Progress** once. The card of the course the hero leads with SHALL be marked visually as the current one.

#### Scenario: Both courses listed with their own places
- **WHEN** a learner enrolled in Basic and Advanced has records in both
- **THEN** Your courses shows two cards, and each card's Next up names that course's own continue target

#### Scenario: Progress, Details and the card's header
- **WHEN** a learner enrolled in Basic uses Basic's card
- **THEN** its ring and title, and **Progress**, open `/[locale]/courses/basic-course/progress`, and **Details** opens `/[locale]/courses/basic-course/about`

#### Scenario: A course never opened offers Start
- **WHEN** a learner enrolled in Advanced has never opened one of its videos
- **THEN** Advanced's card action reads **Start** and opens its first video

#### Scenario: The catalog card closes the grid
- **WHEN** a learner enrolled in Basic and Advanced opens My learning
- **THEN** the catalog card follows the two course cards in Your courses

### Requirement: The progress panel's course title opens the course page

The course title in My learning's progress panel SHALL link to the course page
(`/[locale]/courses/[courseSlug]/about`), the same page as the panel's **View course details** link.
The title link SHALL be left out of the tab order so keyboard users meet **View course details**
once, and the heading SHALL keep its level and text.

#### Scenario: Clicking the course title
- **WHEN** a learner whose hero leads with the Basic Course clicks the panel's `Basic Course` heading
- **THEN** the course page at `/en/courses/basic-course/about` opens

#### Scenario: One tab stop
- **WHEN** a keyboard user tabs through the progress panel
- **THEN** focus lands on **View course details** once and not on the title

### Requirement: My learning keeps the catalog in reach

My learning SHALL show a **See all courses** button that opens `/[locale]/courses`. On wide screens it SHALL sit at the end of the greeting's row; on phones it SHALL be hidden, the catalog card being the way to the catalog there.

The **catalog card** SHALL open `/[locale]/courses` from anywhere on it except its teaser, and SHALL show:

- the eyebrow **Catalog · N courses**, with N the number of courses in the catalog;
- the heading **All available courses**;
- how many catalog courses the learner has not joined, or, when they have joined every one, that they are enrolled in all of them;
- when the learner has not joined every course, a teaser of the first course in `sequence` order they have not joined: its first video's thumbnail, its title, its **Level N** or **Reference** label and its video count. The teaser SHALL open that course's page at `/[locale]/courses/[courseSlug]/about`;
- a **See all courses** call to action.

#### Scenario: See all courses opens Available courses
- **WHEN** the learner activates See all courses
- **THEN** `/[locale]/courses` opens

#### Scenario: See all courses shows on wide screens only
- **WHEN** My learning opens 1440 px wide and then 390 px wide
- **THEN** the button sits right of the greeting on the wide screen, and is hidden on the phone while the catalog card stays visible

#### Scenario: The catalog card teases a course not joined
- **WHEN** a learner enrolled only in Basic, in a catalog of Basic, Advanced (Level 2) and a reference course, opens My learning
- **THEN** the catalog card reads `Catalog · 3 courses`, says 2 courses are not joined, teases Advanced with `Level 2` and its video count, and opens `/[locale]/courses`

#### Scenario: The teaser opens the teased course's page
- **WHEN** a learner enrolled only in Basic activates the catalog card's teaser
- **THEN** `/[locale]/courses/advanced-intermediate-course/about` opens

#### Scenario: A learner in every course sees no teaser
- **WHEN** a learner enrolled in every catalog course opens My learning
- **THEN** the catalog card says they are enrolled in all of them and shows no teaser

