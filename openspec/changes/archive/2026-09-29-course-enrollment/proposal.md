## Why

Two courses now ship to production (Basic and Advanced Intermediate), but the platform has no idea which
courses a learner has joined, and it remembers only one "continue watching" location per learner. The
upcoming course pages need both: a list of the courses a learner is enrolled in, and a place to resume in
**each** of them, ordered by when the learner last watched it. This change lays that foundation without
changing any screen.

## What Changes

- A learner can be **enrolled** in courses. Enrollment is stored per account in a new `course_enrollment`
  table and is idempotent.
- Enrolling happens in two ways: an explicit enroll request (the entry point the course pages will call),
  and opening any lesson of a course, which enrolls the learner in that course if they were not already.
- **BREAKING (storage):** `continue_watching` holds one row **per learner and course** instead of one per
  learner. The port keeps answering "the last location" from `get()`, so every current screen behaves the
  same, and gains `list()`, which returns one location per course, most recent first, with when it was
  last watched.
- The learner snapshot and the client learner store carry the enrolled course slugs and the per-course
  locations; writes stay optimistic with rollback, like every other learner write.
- A one-time data migration enrolls **every account that exists before this change** in the Basic Course,
  the only course production has served so far. It also enrolls learners in any course they already have
  a continue-watching location for. Accounts created afterwards start with no enrollment.

## Capabilities

### New Capabilities
- `course-enrollment`: which courses a learner has joined. It covers the port, the table, the enroll use
  case and Server Action, enrolling on lesson visit, the client store slice and hook, and the migration of
  existing accounts into the Basic Course.

### Modified Capabilities
- `continue-watching`: the repository holds one location per course instead of one in total. `get()`
  returns the most recent, `list()` returns every course's location most recent first with a watched-at
  time, and opening a lesson replaces only that course's location.
- `learner-state`: `continue_watching` becomes one row per learner and course, and a `course_enrollment`
  table joins the per-account tables. The snapshot carries enrollments and per-course locations, and
  recording a location also enrolls, optimistically.

## Non-goals

- No UI changes: the onboarding recommendation, the Available courses page, the new My learning, the
  redirect from My learning, and the header menu entry belong to the follow-up change
  `course-enrollment-views`.
- No un-enrolling or leaving a course.
- No enrollment for signed-out visitors or device-local storage; enrollment exists only for signed-in
  accounts, like the rest of learner state.
- No course completion dates, certificates or "finished on" records.
- No change to how the continue target is chosen inside a course (`continue-target` stays as is).

## Impact

- **Database:** new Drizzle migration that creates `course_enrollment` and rebuilds `continue_watching`
  with a composite primary key `(user_id, course_slug)`, plus a custom data migration that backfills
  enrollments. Both run through `drizzle-kit migrate` in `vercel-build` on every environment.
- **Domain:** new `CourseEnrollmentRepository` port and `enrollInCourse` use case. A
  `recordContinueWatching` use case enrolls and records in one step. `ContinueWatchingRepository` gains
  `list()`, and a `ContinueWatchingRecord` value pairs a location with its watched-at time.
- **Adapters:** Turso and in-memory enrollment repositories; the Turso continue-watching adapter keyed by
  course; learner-store adapters for both; the learner-repositories factory and learner dependencies.
- **Delivery:** `enrollInCourseAction`, and `recordContinueWatchingAction` switches to the use case. The
  learner snapshot, the learner store, the test-setup store helpers and action mocks, and the e2e
  learner-state fixture change accordingly.
- **Consumers of the single location** (My learning, achievements, course progress board, module route)
  keep reading `get()` and are not changed.
