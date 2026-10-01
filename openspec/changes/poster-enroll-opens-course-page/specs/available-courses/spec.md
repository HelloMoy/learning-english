## MODIFIED Requirements

### Requirement: A course the learner has not joined is offered on its poster

The poster of a course the learner is not enrolled in SHALL show:

- its first video's poster as artwork;
- a chip reading "Level N", or **Reference** for a reference course;
- its module count, video count and total runtime;
- the course title and its course brief;
- how many prizes the course awards;
- **Enroll**, which opens its course page at `/[locale]/courses/[courseSlug]/about` (`course-detail-page`);
- **View details**, which opens the same course page.

**Enroll** SHALL be a locale-aware link and SHALL NOT enroll the learner: activating it SHALL call no
enrollment and SHALL leave the learner's enrollments unchanged. The learner enrolls from the course page's
own enroll action (`course-detail-page`). No action on a not-joined poster SHALL enroll the learner.

#### Scenario: Enroll opens the course page
- **WHEN** a learner enrolled only in Basic activates Enroll on the Advanced poster at `/en/courses`
- **THEN** `/en/courses/advanced-intermediate-course/about` opens with **Enroll**, and the learner is still not enrolled in the Advanced course

#### Scenario: The learner enrolls from the course page
- **WHEN** that learner activates **Enroll** on the Advanced course page and returns to `/en/courses`
- **THEN** the Advanced poster reads Enrolled and offers Start course

#### Scenario: Enroll is locale-aware
- **WHEN** `/es/courses` renders the poster of a course the learner has not joined
- **THEN** its **Inscribirme** action links to `/es/courses/<slug>/about`

#### Scenario: Previewing does not enroll
- **WHEN** the learner activates View details on the Advanced poster
- **THEN** the Advanced course page opens with **Enroll**, and the learner is still not enrolled in it

#### Scenario: A not-joined reference course reads Reference
- **WHEN** the learner has not joined the Atlas of American Sounds
- **THEN** its poster reads Reference and no level number

### Requirement: A learner enrolled in nothing is shown the first step

When the learner is enrolled in no course, a next-up bar SHALL render above the page heading for the first **level** course in `sequence` order, showing:

- its first video's thumbnail;
- the line "Next up · <course title>";
- the first video's title;
- "Module NN · 0 of V videos · T left", NN being the first video's module number padded to two digits, V the course's video count and T its total runtime;
- a progress ring reading 0 %;
- **Start course**, which opens the first video, and **View course**, which opens the course page at `/[locale]/courses/[courseSlug]/about`.

A reference course SHALL NOT take the bar. The bar SHALL NOT render while the learner is enrolled in any course.

#### Scenario: Nothing enrolled shows the bar
- **WHEN** a learner with no enrollment opens `/es/courses`
- **THEN** above the heading a bar reads `Lo que sigue · Basic Course`, names the Basic Course's first video, reads `Módulo 01 · 0 de 48 videos · faltan 10 h 29 min`, and offers Empezar el curso and Ver curso

#### Scenario: Start course opens the first video
- **WHEN** that learner activates Start course on the bar
- **THEN** the Basic Course's first video opens

#### Scenario: An enrolled learner sees no bar
- **WHEN** a learner enrolled in any course opens the page
- **THEN** no next-up bar renders
