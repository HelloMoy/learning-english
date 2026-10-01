## MODIFIED Requirements

### Requirement: Courses the learner has not joined are offered in a shelf

Every catalog course the learner is not enrolled in SHALL render under **More courses**, in `sequence` order, as a shelf card with:

- its first video's thumbnail and "Level N", or **Reference** for a reference course;
- its title;
- up to four module thumbnails (each module's first video) with the count of the rest;
- its module count, video count and total runtime;
- **Enroll**;
- **Preview course**, which opens its course page (`course-detail-page`) without enrolling.

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
- **THEN** the Advanced course page opens with **Enroll**, and the learner is still not enrolled in it

#### Scenario: Everything joined
- **WHEN** the learner is enrolled in every catalog course
- **THEN** More courses states that they are enrolled in every course

#### Scenario: A reference enrollment does not raise the level
- **WHEN** a learner enrolled in Basic and in the Atlas of American Sounds opens the page
- **THEN** More courses reads `Keep going after Level 1` and offers the Advanced course

#### Scenario: Only a reference course joined
- **WHEN** a learner enrolled only in the Atlas of American Sounds opens the page
- **THEN** More courses reads `Start here`
