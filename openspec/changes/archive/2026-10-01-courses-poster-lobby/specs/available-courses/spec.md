## MODIFIED Requirements

### Requirement: Available courses is a learner route that lists every catalog course

The route `/[locale]/courses` SHALL render the Available courses page for a signed-in learner with a profile, under the same session and profile requirements as the other course routes. It SHALL show an eyebrow, the heading "Available courses", and a summary stating how many courses the catalog serves and how many of them the learner is enrolled in, with an "all" wording when the learner is enrolled in every one. Below the heading, every catalog course SHALL render as a course poster in one lobby grid: three columns on wide viewports, one column on phones. Until the learner store is seeded, the lobby SHALL render poster-shaped placeholders naming no course state, and no next-up bar.

The header eyebrow SHALL read `COURSES` on this route.

#### Scenario: The summary counts enrollments
- **WHEN** a learner enrolled in `basic-course` opens `/en/courses` and the catalog serves three courses
- **THEN** the summary reads `3 courses · you’re enrolled in 1`

#### Scenario: Enrolled in everything
- **WHEN** a learner enrolled in every catalog course opens the page
- **THEN** the summary says they are enrolled in all of them

#### Scenario: Every course is a poster
- **WHEN** a learner opens the page and the catalog serves three courses
- **THEN** the lobby holds three course posters, one per course

#### Scenario: No session, no page
- **WHEN** `/en/courses` is requested without a session
- **THEN** the response redirects to sign in and contains no course content

## ADDED Requirements

### Requirement: The lobby orders the learner's courses first

The lobby SHALL place the courses the learner is enrolled in first — the one with the most recent continue-watching record leading, then the other enrolled courses in `sequence` order — followed by every course the learner has not joined, in `sequence` order. No poster SHALL be larger than another.

#### Scenario: The last watched course leads
- **WHEN** a learner enrolled in Basic and Advanced last opened an Advanced lesson
- **THEN** the first poster is the Advanced course, the second the Basic Course, the third the Atlas of American Sounds

#### Scenario: Nothing enrolled keeps catalog order
- **WHEN** a learner with no enrollment opens the page
- **THEN** the posters follow catalog `sequence` order

### Requirement: An enrolled course's poster carries the way back in

The poster of a course the learner is enrolled in SHALL show:

- its continue target's poster as artwork, fading into the page background under the copy;
- a chip reading "Level N", or **Reference** for a reference course, and a chip reading **Enrolled**, or **Completed** when every video of the course counts as complete;
- a progress ring with the completed share as a percentage;
- a line reading **Resume at m:ss** when the target is a video with a saved position, or **Next up** otherwise, followed by the target video's title;
- the course title and its course brief;
- the completed and total videos with the time left, or **All watched** when complete;
- a primary action that opens the target video and reads **Continue course**, **Start course** or **Watch again** according to the target's kind, and **View progress**, which opens the course overview;
- a progress edge along the bottom of the poster filled to the completed share.

#### Scenario: A saved position shows where to resume
- **WHEN** the enrolled course's target is a video with a saved position of 365 seconds
- **THEN** its poster reads `Resume at 06:05` before the video title, and its primary action reads Continue course

#### Scenario: Continue opens the target
- **WHEN** the learner activates the primary action on an enrolled poster
- **THEN** the course's continue target video opens

#### Scenario: The secondary action reads by enrollment
- **WHEN** `/es/courses` renders a poster for an enrolled course and one for a course not joined
- **THEN** the enrolled poster offers **Ver avance**, opening `/es/courses/<slug>`, and the other offers **Ver detalles**, opening `/es/courses/<slug>/about`

#### Scenario: A finished course reads Completed
- **WHEN** every video of an enrolled course is complete
- **THEN** its poster reads Completed and offers Watch again

#### Scenario: An enrolled reference course reads Reference
- **WHEN** the learner is enrolled in the Atlas of American Sounds
- **THEN** its poster reads Reference where a level course's poster reads Level N

### Requirement: A course the learner has not joined is offered on its poster

The poster of a course the learner is not enrolled in SHALL show:

- its first video's poster as artwork;
- a chip reading "Level N", or **Reference** for a reference course;
- its module count, video count and total runtime;
- the course title and its course brief;
- how many prizes the course awards;
- **Enroll**;
- **View details**, which opens its course page at `/[locale]/courses/[courseSlug]/about` (`course-detail-page`) without enrolling.

**Enroll** SHALL enroll the learner through the client enrollment (optimistic): the poster SHALL become an enrolled poster and move among the enrolled courses at once, and SHALL return to a not-joined poster if the server refuses.

#### Scenario: Enrolling turns the poster
- **WHEN** a learner enrolled only in Basic activates Enroll on the Advanced poster
- **THEN** the Advanced poster reads Enrolled and offers Start course, and after a reload it is still enrolled

#### Scenario: A refused enrollment returns the poster
- **WHEN** the enroll action is refused
- **THEN** the Advanced poster offers Enroll again

#### Scenario: Previewing does not enroll
- **WHEN** the learner activates View details on the Advanced poster
- **THEN** the Advanced course page opens with **Enroll**, and the learner is still not enrolled in it

#### Scenario: A not-joined reference course reads Reference
- **WHEN** the learner has not joined the Atlas of American Sounds
- **THEN** its poster reads Reference and no level number

### Requirement: Every poster says who the course is for and what it teaches

Every poster SHALL show the course brief: **For** followed by the course's `audience`, and **You'll learn** followed by its `highlights`, each read through `courseCopy` for the active locale. A course that declares no audience SHALL show no **For** line; a course that declares no highlights SHALL show no **You'll learn** line.

#### Scenario: The brief reads in Spanish
- **WHEN** `/es/courses` renders the Basic Course's poster
- **THEN** it shows **Para** with the Spanish audience and **Aprenderás** with the Spanish highlights its manifest declares

#### Scenario: A course without a brief
- **WHEN** a course declares neither audience nor highlights
- **THEN** its poster shows neither line

### Requirement: A learner enrolled in nothing is shown the first step

When the learner is enrolled in no course, a next-up bar SHALL render above the page heading for the first **level** course in `sequence` order, showing:

- its first video's thumbnail;
- the line "Next up · <course title>";
- the first video's title;
- "Module NN · 0 of V videos · T left", NN being the first video's module number padded to two digits, V the course's video count and T its total runtime;
- a progress ring reading 0 %;
- **Start course**, which opens the first video, and **View course**, which opens the course page at `/[locale]/courses/[courseSlug]/about`.

A reference course SHALL NOT take the bar. The bar SHALL NOT render while the learner is enrolled in any course, and SHALL leave at once when an optimistic enrollment makes them enrolled.

#### Scenario: Nothing enrolled shows the bar
- **WHEN** a learner with no enrollment opens `/es/courses`
- **THEN** above the heading a bar reads `Lo que sigue · Basic Course`, names the Basic Course's first video, reads `Módulo 01 · 0 de 48 videos · faltan 10 h 29 min`, and offers Empezar el curso and Ver curso

#### Scenario: Start course opens the first video
- **WHEN** that learner activates Start course on the bar
- **THEN** the Basic Course's first video opens

#### Scenario: An enrolled learner sees no bar
- **WHEN** a learner enrolled in any course opens the page
- **THEN** no next-up bar renders

#### Scenario: Enrolling removes the bar
- **WHEN** a learner with no enrollment activates Enroll on a poster
- **THEN** the next-up bar leaves the page

## REMOVED Requirements

### Requirement: The course the learner watched last is featured

**Reason**: The cinema hero is replaced by the poster lobby, where no course dominates the others.
**Migration**: The last-watched course now leads the lobby as the first poster ("The lobby orders the learner's courses first"); a learner enrolled in nothing is shown the next-up bar instead of the recommended hero.

### Requirement: The learner's other enrolled courses follow in compact cards

**Reason**: Enrolled courses are posters in the lobby rather than a separate section.
**Migration**: See "An enrolled course's poster carries the way back in".

### Requirement: Courses the learner has not joined are offered in a shelf

**Reason**: Courses not joined are posters in the same lobby rather than a shelf with its own heading.
**Migration**: See "A course the learner has not joined is offered on its poster"; the optimistic Enroll is unchanged, and the link to the course page now reads **View details**.
