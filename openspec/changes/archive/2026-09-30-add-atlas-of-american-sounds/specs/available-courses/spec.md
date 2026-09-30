## MODIFIED Requirements

### Requirement: The course the learner watched last is featured

The page SHALL feature one enrolled course in a wide artwork hero: the enrolled course with the most recent continue-watching record, or, when no enrolled course has one, the first enrolled course in `sequence` order. The hero SHALL show:

- the continue target's poster;
- an `Enrolled` mark, and a label reading **Last watched** when the course has a record and **Your course** otherwise;
- a chip naming the target video with its thumbnail, reading **Resume at m:ss** when the target is a video with a saved position and **Next up** otherwise;
- the line "Level N · M modules · V videos" and the course title, where a reference course reads "Reference · M modules · V videos";
- a small ring with the completed share, and the completed and total videos with the time left;
- the course's prize icons, claimed ones lit;
- a primary action that opens the target video and reads **Continue course**, **Start course** or **Watch again** according to the target's kind, and **View course**, which opens the course overview.

When the learner is enrolled in no course, the first **level** course SHALL take the hero, marked **Recommended for you**, with **Start course** opening its first video. A reference course SHALL NOT be recommended this way.

#### Scenario: The last watched course leads
- **WHEN** a learner enrolled in both courses last opened an Advanced lesson
- **THEN** the hero shows the Advanced course labelled Last watched

#### Scenario: A saved position shows where to resume
- **WHEN** the featured target is a video with a saved position of 365 seconds
- **THEN** the chip reads `Resume at 06:05`

#### Scenario: Nothing enrolled recommends the first course
- **WHEN** a learner with no enrollment opens the page
- **THEN** the hero shows the Basic Course marked Recommended for you, and Start course opens its first video

#### Scenario: A featured reference course reads Reference
- **WHEN** the learner last watched a lesson of the Atlas of American Sounds
- **THEN** the hero shows the Atlas labelled Last watched, and its facts line begins `Reference ·` with no level number

### Requirement: The learner's other enrolled courses follow in compact cards

Every enrolled course other than the featured one SHALL render under **Your other courses**, in `sequence` order, as a card with:

- its continue target's thumbnail, with the saved progress of that video when there is one;
- an `Enrolled` mark and "Level N", or **Reference** for a reference course;
- the title;
- a progress bar with the completed and total videos and the percentage;
- the next video's title and module;
- **Continue**, which opens that video, and **View course**.

A course whose every video counts as complete SHALL read **Completed**, show its claimed and total prizes, and offer **Watch again**, which opens its first video. The section SHALL NOT render when there is no other enrolled course. From two cards the section SHALL lay them out in two columns on wide viewports.

#### Scenario: The other enrolled course is listed
- **WHEN** the featured course is Advanced and the learner is also enrolled in Basic
- **THEN** Your other courses holds one card, for Basic, whose Continue opens Basic's continue target

#### Scenario: A finished course reads Completed
- **WHEN** every video of an enrolled, non-featured course is complete
- **THEN** its card reads Completed and offers Watch again

#### Scenario: One enrolled course, no section
- **WHEN** the learner is enrolled in one course
- **THEN** Your other courses does not render

#### Scenario: An enrolled reference course reads Reference
- **WHEN** the learner is enrolled in the Atlas of American Sounds and it is not featured
- **THEN** its card reads Reference where a level course's card reads Level N

### Requirement: Courses the learner has not joined are offered in a shelf

Every catalog course the learner is not enrolled in SHALL render under **More courses**, in `sequence` order, as a shelf card with:

- its first video's thumbnail and "Level N", or **Reference** for a reference course;
- its title;
- up to four module thumbnails (each module's first video) with the count of the rest;
- its module count, video count and total runtime;
- **Enroll**;
- **Preview course**, which opens its overview without enrolling.

The section title SHALL read "Keep going after Level N", N being the highest derived level among the **level** courses the learner is enrolled in, or "Start here" when they are enrolled in no level course. Enrolling in a reference course SHALL NOT change N. When the learner is enrolled in every course, the section SHALL remain and read that they are enrolled in every course and that new courses will show up there.

**Enroll** SHALL enroll the learner through the client enrollment (optimistic): the course SHALL leave the shelf and appear under the enrolled courses at once, and SHALL return to the shelf if the server refuses.

#### Scenario: Enrolling moves the course
- **WHEN** a learner enrolled only in Basic activates Enroll on the Advanced card
- **THEN** the Advanced course leaves More courses and appears under Your other courses, and after a reload it is still enrolled

#### Scenario: A refused enrollment returns the card
- **WHEN** the enroll action is refused
- **THEN** the Advanced card is back in More courses

#### Scenario: Previewing does not enroll
- **WHEN** the learner activates Preview course on the Advanced card
- **THEN** the Advanced overview opens and the learner is still not enrolled in it

#### Scenario: Everything joined
- **WHEN** the learner is enrolled in every catalog course
- **THEN** More courses states that they are enrolled in every course

#### Scenario: A reference enrollment does not raise the level
- **WHEN** a learner enrolled in Basic and in the Atlas of American Sounds opens the page
- **THEN** More courses reads `Keep going after Level 1` and offers the Advanced course

#### Scenario: Only a reference course joined
- **WHEN** a learner enrolled only in the Atlas of American Sounds opens the page
- **THEN** More courses reads `Start here`
