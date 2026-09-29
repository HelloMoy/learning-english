# course-enrollment Specification

## Purpose
TBD - created by archiving change course-enrollment. Update Purpose after archive.
## Requirements
### Requirement: Enrollments are stored per account behind a port

The domain SHALL declare `CourseEnrollmentRepository` under
`src/domain/ports/course-enrollment-repository/` with `list(): Promise<ReadonlySet<Slug>>` and
`enroll(courseSlug: Slug): Promise<void>`. `enroll` SHALL be idempotent. The port SHALL NOT take a
learner parameter; adapters are bound to one learner.

The database SHALL hold `course_enrollment`, one row per learner and course, with primary key
`(user_id, course_slug)`, an `enrolled_at` time set by the database, and a foreign key to `user`
declared `ON DELETE CASCADE`. The port SHALL have an in-memory adapter and a Turso adapter, and the
learner-repositories factory SHALL build the Turso one alongside the other learner adapters. A stored
slug that no longer parses as a `Slug` SHALL be left out of `list()` rather than throw.

#### Scenario: Enrolling twice keeps one row
- **WHEN** `enroll("basic-course")` is called twice for one learner
- **THEN** `list()` resolves to `{basic-course}` and the table holds one row for that learner and course

#### Scenario: Enrollments are isolated per learner
- **WHEN** learner A enrolls in `advanced-intermediate-course`
- **THEN** learner B's enrollments do not contain it

#### Scenario: Deleting a user removes their enrollments
- **WHEN** a user with enrollments is deleted
- **THEN** `course_enrollment` holds no row for that user

#### Scenario: A learner with no enrollment lists nothing
- **WHEN** `list()` is called for a learner who never enrolled
- **THEN** it resolves to an empty set

### Requirement: `enrollInCourse` enrolls only in a course the catalog serves

The domain SHALL expose `enrollInCourse({ courseSlug }) => ResultAsync<{ enrolled: true },
EnrollInCourseErrors>`. It SHALL resolve the course through `CourseRepository.bySlug` and SHALL enroll
through `CourseEnrollmentRepository.enroll` only when the course exists. Errors SHALL be a closed union of
`course-not-found` and `internal-error`. The use case SHALL NOT throw.

#### Scenario: Enrolling in a served course succeeds
- **WHEN** `enrollInCourse({ courseSlug: "basic-course" })` runs and the catalog serves that course
- **THEN** it resolves to `{ ok: true, value: { enrolled: true } }` and the learner is enrolled

#### Scenario: An unknown course is refused
- **WHEN** `enrollInCourse` is called with a slug the catalog does not serve (unknown or a hidden draft)
- **THEN** it resolves to `{ ok: false, error: { kind: "course-not-found" } }` and nothing is written

#### Scenario: A storage failure is a typed error
- **WHEN** the enrollment repository rejects the write
- **THEN** the use case resolves to `{ ok: false, error: { kind: "internal-error" } }`

### Requirement: A learner enrolls explicitly through an authenticated action

`enrollInCourseAction` SHALL accept `{ courseSlug }` only, derive the learner from the verified session,
run `enrollInCourse`, and return `{ enrolled: boolean }`. A request without a valid session SHALL be
refused before any adapter is constructed.

On the client, `enrollInCourse(courseSlug)` SHALL do nothing when the learner is already enrolled in that
course. Otherwise it SHALL add the course to the learner store at once, call `enrollInCourseAction`, and
remove it again when the action returns `validationErrors`, `serverError` or `{ enrolled: false }`, or
the request fails.

#### Scenario: Enrolling shows at once
- **WHEN** the client calls `enrollInCourse("advanced-intermediate-course")`
- **THEN** `useEnrolledCourses()` contains that slug before the action answers

#### Scenario: A refused enrollment is withdrawn
- **WHEN** `enrollInCourseAction` answers with a server error
- **THEN** `useEnrolledCourses()` no longer contains the slug

#### Scenario: Already enrolled, nothing sent
- **WHEN** `enrollInCourse` is called for a course already in the learner's enrollments
- **THEN** no action is called and no subscriber is notified

#### Scenario: The action takes no learner id
- **WHEN** the input schema of `enrollInCourseAction` is inspected
- **THEN** it declares `courseSlug` and no user or learner id

### Requirement: Opening a lesson enrolls the learner in its course

Recording the continue-watching location when a lesson page mounts SHALL also enroll the learner in that
lesson's course. On the server, `recordContinueWatchingAction` SHALL run the `recordContinueWatching` use
case, which enrolls through `enrollInCourse` and then stores the location; when the course is not served,
neither is written. On the client, the same optimistic step SHALL add the course to the enrolled courses
and roll back together with the location when refused.

#### Scenario: A new account's first lesson enrolls them
- **WHEN** a learner with no enrollment opens a lesson of `advanced-intermediate-course`
- **THEN** their enrollments contain `advanced-intermediate-course`, and still do after a reload

#### Scenario: Opening a lesson of an enrolled course changes nothing
- **WHEN** a learner already enrolled in `basic-course` opens another Basic lesson
- **THEN** their enrollments are unchanged

#### Scenario: A refused visit rolls back both
- **WHEN** `recordContinueWatchingAction` answers with a server error
- **THEN** neither the location nor the enrollment it added optimistically remains in the store

### Requirement: Enrollments join the learner snapshot

The learner snapshot SHALL carry `enrolledCourseSlugs`, and the learner store SHALL adopt it as
`enrolledCourses`. `useEnrolledCourses()` SHALL return an empty set on the server and until hydration,
and the snapshot's set afterwards.

#### Scenario: Enrollments follow the learner across devices
- **WHEN** a learner enrolls on a phone and opens the app on a laptop
- **THEN** after hydration the laptop's `useEnrolledCourses()` contains that course

#### Scenario: The server render knows no enrollments
- **WHEN** a page using `useEnrolledCourses()` renders on the server
- **THEN** it renders with an empty set

### Requirement: Accounts that predate enrollment are enrolled in the Basic Course

A one-time data migration SHALL enroll every row of `user` that exists when it runs in `basic-course`,
and SHALL enroll each learner in every course they already hold a continue-watching location for. It
SHALL be safe to run against a database that already holds enrollments. Accounts created after it runs
SHALL start with no enrollment.

#### Scenario: An existing account is enrolled in Basic
- **WHEN** the migration runs on a database with a user who has no enrollment
- **THEN** that user is enrolled in `basic-course`

#### Scenario: A tester of the Advanced draft keeps that course
- **WHEN** the migration runs for a user whose continue-watching location is in `advanced-intermediate-course`
- **THEN** that user is enrolled in both `basic-course` and `advanced-intermediate-course`

#### Scenario: Running it twice changes nothing
- **WHEN** the migration's statements run a second time
- **THEN** no row is added and none fails

#### Scenario: A new account starts empty
- **WHEN** an account is created after the migration has run
- **THEN** its enrollments are empty until it enrolls or opens a lesson

