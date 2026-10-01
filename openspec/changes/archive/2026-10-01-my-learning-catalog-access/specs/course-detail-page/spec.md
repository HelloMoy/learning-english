## MODIFIED Requirements

### Requirement: The course route shows the course page until the learner has joined

`/[locale]/courses/[courseSlug]/progress` SHALL decide what to render from the learner's enrollments once the
learner store is seeded:

- a learner **not enrolled** in the course SHALL see the **course page**;
- a learner **enrolled** in the course when the store was first seeded SHALL see the progress board
  (`cinema-course-overview`);
- a learner who enrolls while on the course page SHALL keep seeing the course page, in its enrolled
  state, until they leave the route.

Before the store is seeded, including on the server, the route SHALL render a pending shape that
contains the course title as the page's level-one heading and names no enrollment state: no **Enroll**,
no **Start course** and no progress.

#### Scenario: A learner who has not joined sees the course page
- **WHEN** a learner enrolled only in `basic-course` opens `/en/courses/advanced-intermediate-course/progress`
- **THEN** the course page renders with **Enroll**, and no progress ring or continue tile renders

#### Scenario: An enrolled learner keeps the progress board
- **WHEN** a learner enrolled in `basic-course` opens `/en/courses/basic-course/progress`
- **THEN** the progress board renders and the course page does not

#### Scenario: Enrolling keeps the learner on the course page
- **WHEN** a learner activates **Enroll** on the course page
- **THEN** the course page stays, now marked enrolled, and its action reads **Start course**

#### Scenario: The next visit opens the board
- **WHEN** a learner who enrolled from the course page reloads the route
- **THEN** the progress board renders

#### Scenario: The server render asserts no enrollment
- **WHEN** the route renders before the learner store is seeded
- **THEN** the course title is the level-one heading and neither **Enroll**, **Start course** nor a progress figure renders

### Requirement: The course page has its own route

`/[locale]/courses/[courseSlug]/about` SHALL render the course page to every learner, whether or not
they are enrolled in the course, in the state their enrollment calls for: **Enroll** before they join,
the enrolled state after. It SHALL never render the progress board. Before the learner store is
seeded, including on the server, it SHALL render the same pending shape as the course route: the
course title as the level-one heading and no enrollment state. A slug that names no course SHALL
render the course route's error state.

The course route (`/[locale]/courses/[courseSlug]/progress`) SHALL keep deciding between the course page
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
course route (`/[locale]/courses/[courseSlug]/progress`) through the locale-aware path. While the learner is
not enrolled the card SHALL offer no such link. The link text SHALL come from `en`, `es` and `pt`.

#### Scenario: Enrolled
- **WHEN** an enrolled learner views the Basic Course's page
- **THEN** the enroll card shows **Go to my progress** linking to `/en/courses/basic-course/progress`

#### Scenario: Not enrolled
- **WHEN** a learner who has not joined views the Advanced course's page
- **THEN** the enroll card shows no **Go to my progress** link

#### Scenario: Spanish
- **WHEN** an enrolled learner views the Basic Course's page under `/es`
- **THEN** the link reads **Ir a mi progreso** and points to `/es/courses/basic-course/progress`
