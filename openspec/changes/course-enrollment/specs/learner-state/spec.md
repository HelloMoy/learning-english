## MODIFIED Requirements

### Requirement: Learner progress is stored per account in four tables

The database SHALL hold `learner_profile` (one row per learner), `lesson_completion` (one row per learner and completed lesson), `playback_position` (one row per learner and lesson, holding seconds) and `continue_watching` (one row per learner and course, with primary key `(user_id, course_slug)` and an `updated_at` time set by the database). Every row SHALL be keyed by the learner's user id, with a foreign key to `user` declared `ON DELETE CASCADE`. Completion, position and location SHALL stay in separate tables, so writing one never touches another. Enrollments are stored in `course_enrollment` as specified by the `course-enrollment` capability, under the same keying and cascade rules.

#### Scenario: Deleting a user removes their progress
- **WHEN** a user row with a profile, completions, positions, locations and enrollments is deleted
- **THEN** none of those tables holds a row for that user afterwards

#### Scenario: Two learners do not see each other's progress
- **WHEN** learner A marks a lesson complete
- **THEN** learner B's completion set does not contain it

#### Scenario: A location per course survives the key change
- **WHEN** the migration that re-keys `continue_watching` runs on a table holding a learner's location
- **THEN** that location is still stored afterwards, under its course

### Requirement: Turso adapters implement the existing ports, bound to one learner

Each of `ProgressTracker`, `PlaybackPositionRepository`, `ContinueWatchingRepository`, `LearnerProfileRepository` and `CourseEnrollmentRepository` SHALL have a Turso adapter under `src/adapters/persistence/turso/`, constructed with a database and one learner id and honouring every scenario of its port unchanged: idempotent writes, `null` for absent, a single slot for the profile, and one location per course. The ports SHALL NOT gain a learner parameter. A stored value that no longer satisfies its domain schema SHALL read as absent rather than throw.

A factory SHALL build all of them for one learner id. It SHALL be the only place that names the Turso adapters.

#### Scenario: Completion round-trips per learner
- **WHEN** the tracker for learner A marks a lesson complete and a new tracker for learner A asks
- **THEN** the lesson is complete

#### Scenario: A repeated position write keeps one row
- **WHEN** `setPosition` is called twice for the same lesson and learner
- **THEN** the table holds one row for that pair, carrying the second value

#### Scenario: A corrupt profile row reads as absent
- **WHEN** the stored avatar illustration is not one of the eight known ids
- **THEN** `get()` resolves to `null`

#### Scenario: Locations in two courses are two rows
- **WHEN** the continue-watching adapter for one learner sets a Basic location and then an Advanced one
- **THEN** the table holds two rows for that learner, one per course

### Requirement: The server hands the client one learner snapshot per request

For a signed-in learner, the locale layout SHALL load the profile, the set of completed lesson ids, the map of playback positions, the continue-watching records (one per course, most recent first) and the enrolled course slugs in one step, and SHALL pass them to a client seed component. The client store SHALL adopt that snapshot only in the browser. Every hook SHALL keep reporting its existing server and hydration state (empty sets and maps, `unknown` profile) until hydration completes, and SHALL report the snapshot afterwards.

#### Scenario: Marks appear after hydration from the account's data
- **WHEN** a learner who completed a lesson on another device opens the module on this one
- **THEN** after hydration that lesson's completion mark shows, and the server-rendered HTML carries no mark

#### Scenario: The server never shares one learner's snapshot with another
- **WHEN** two learners' requests are rendered by the same server process
- **THEN** each response carries only its own learner's snapshot, because no server-side module state holds a snapshot

#### Scenario: The snapshot carries every course's place
- **WHEN** a learner with locations in two courses loads any page
- **THEN** the snapshot holds both records, the most recently watched first

### Requirement: Writes are optimistic and roll back when refused

Marking and un-marking completion, recording the continue-watching location (together with the enrollment it implies), enrolling in a course and saving the profile SHALL update the client store at once and SHALL then call an authenticated Server Action. When the action returns `validationErrors` or `serverError`, or the request fails, the store SHALL be restored to its previous value, and every mounted reader SHALL see the restore.

A playback position SHALL also update the store at once, but a refused position write SHALL NOT be rolled back: positions are coalesced, and the next write carries a newer position anyway.

#### Scenario: A mark shows immediately
- **WHEN** the learner activates Mark as complete
- **THEN** the completion mark appears before the action has answered

#### Scenario: A refused mark is withdrawn
- **WHEN** the mark-complete action answers with a server error
- **THEN** the completion mark disappears again and the lesson reads as incomplete

#### Scenario: A refused location write restores the previous places
- **WHEN** recording a location in a new course is refused
- **THEN** the store's continue-watching records and enrollments are both as they were before the write
