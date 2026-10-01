## MODIFIED Requirements

### Requirement: The enroll action enrolls, then starts the course

The enroll action SHALL render in the hero, in the enroll card and in the narrow-viewport bottom bar,
and all three SHALL agree. While the learner is not enrolled it SHALL be a button reading **Enroll**
that enrolls through the client enrollment (`course-enrollment`): optimistic, and withdrawn when the
server refuses. Once enrolled it SHALL be a link, through the locale-aware lesson path, to the video
the course overview's continue tile would open (`cinema-course-overview`, `continue-target`), read
from this device's progress the same way:

- **Nothing watched** — the course's first video, reading **Start course**;
- **Partly watched** — the course's continue target, reading **Continue where you left off**;
- **Everything watched** — the course's first video, reading **Watch again**.

A course with no videos SHALL offer no link once the learner is enrolled.

#### Scenario: Enrolling shows at once
- **WHEN** the learner activates **Enroll**
- **THEN** every enroll action reads **Start course** before the server answers, and the learner is enrolled after a reload

#### Scenario: A refused enrollment offers Enroll again
- **WHEN** the enroll action is refused by the server
- **THEN** every enroll action reads **Enroll** again

#### Scenario: Start course opens the first video
- **WHEN** an enrolled learner with nothing watched activates **Start course** on the Basic Course's page
- **THEN** the lesson page of the first video of lesson 1 opens

#### Scenario: A learner with progress continues where they left off
- **WHEN** an enrolled learner has completed the first video of the Basic Course and the continue-watching record names it
- **THEN** every enroll action reads **Continue where you left off** and links to the first video of lesson 2, the video the board's continue tile opens

#### Scenario: A finished course offers to watch again
- **WHEN** every video of the course counts as complete
- **THEN** every enroll action reads **Watch again** and links to the course's first video

#### Scenario: Spanish copy
- **WHEN** an enrolled learner with progress views the Basic Course's page under `/es`
- **THEN** the action reads **Continuar donde lo dejaste**

## ADDED Requirements

### Requirement: The course page has its own route

`/[locale]/courses/[courseSlug]/about` SHALL render the course page to every learner, whether or not
they are enrolled in the course, in the state their enrollment calls for: **Enroll** before they join,
the enrolled state after. It SHALL never render the progress board. Before the learner store is
seeded, including on the server, it SHALL render the same pending shape as the course route: the
course title as the level-one heading and no enrollment state. A slug that names no course SHALL
render the course route's error state.

The course route (`/[locale]/courses/[courseSlug]`) SHALL keep deciding between the course page
and the progress board as before.

#### Scenario: An enrolled learner opens the course page
- **WHEN** a learner enrolled in `basic-course` opens `/en/courses/basic-course/about`
- **THEN** the course page renders in its enrolled state, and no lesson ring tile and no continue tile render

#### Scenario: A learner who has not joined opens the course page
- **WHEN** a learner not enrolled in `advanced-intermediate-course` opens `/en/courses/advanced-intermediate-course/about`
- **THEN** the course page renders with **Enroll**

#### Scenario: Reloading keeps the course page
- **WHEN** a learner enrolls from `/en/courses/advanced-intermediate-course/about` and reloads it
- **THEN** the course page renders again, in its enrolled state

#### Scenario: The server render asserts no enrollment
- **WHEN** `/en/courses/basic-course/about` renders before the learner store is seeded
- **THEN** `Basic Course` is the level-one heading and neither **Enroll**, **Start course** nor a progress figure renders

#### Scenario: An unknown course
- **WHEN** a learner opens `/en/courses/no-such-course/about`
- **THEN** the course route's error state renders

### Requirement: The enrolled enroll card leads back to the progress board

Once the learner is enrolled, the enroll card SHALL end with a **Go to my progress** link to the
course route (`/[locale]/courses/[courseSlug]`) through the locale-aware path. While the learner is
not enrolled the card SHALL offer no such link. The link text SHALL come from `en`, `es` and `pt`.

#### Scenario: Enrolled
- **WHEN** an enrolled learner views the Basic Course's page
- **THEN** the enroll card shows **Go to my progress** linking to `/en/courses/basic-course`

#### Scenario: Not enrolled
- **WHEN** a learner who has not joined views the Advanced course's page
- **THEN** the enroll card shows no **Go to my progress** link

#### Scenario: Spanish
- **WHEN** an enrolled learner views the Basic Course's page under `/es`
- **THEN** the link reads **Ir a mi progreso** and points to `/es/courses/basic-course`
